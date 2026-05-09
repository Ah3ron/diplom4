import io

from fastapi import APIRouter, Depends, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.incident import Incident
from app.models.equipment import EquipmentFailure
from app.models.safety import SafetyViolation
from app.schemas import IncidentResponse
from app.services.export import generate_incidents_excel
from app.services.report import generate_full_report_pdf
from app.services.auto_fmea import auto_fmea
from app.services.statistics import descriptive_statistics, trend_analysis

router = APIRouter(tags=["Загрузка и экспорт"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    import pandas as pd

    content = await file.read()
    filename = file.filename or ""

    try:
        if filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
    except Exception as e:
        return {"error": f"Ошибка чтения файла: {e}"}

    cols = set(df.columns)
    count = 0

    if {"date", "department", "incident_type", "severity"}.issubset(cols):
        for _, row in df.iterrows():
            inc = Incident(
                date=pd.to_datetime(row["date"]).date(),
                department=str(row["department"]),
                incident_type=str(row["incident_type"]),
                severity=str(row["severity"]),
                days_lost=int(row.get("days_lost", 0)),
                description=str(row.get("description", "")),
            )
            db.add(inc)
            count += 1
    elif {"date", "equipment_type", "equipment_name"}.issubset(cols):
        for _, row in df.iterrows():
            eq = EquipmentFailure(
                date=pd.to_datetime(row["date"]).date(),
                equipment_type=str(row["equipment_type"]),
                equipment_name=str(row["equipment_name"]),
                operating_hours=float(row.get("operating_hours", 0)),
                downtime_hours=float(row.get("downtime_hours", 0)),
                failure_cause=str(row.get("failure_cause", "")),
                repair_cost=float(row.get("repair_cost", 0)),
            )
            db.add(eq)
            count += 1
    elif {"date", "department", "violation_type"}.issubset(cols):
        for _, row in df.iterrows():
            sv = SafetyViolation(
                date=pd.to_datetime(row["date"]).date(),
                department=str(row["department"]),
                violation_type=str(row["violation_type"]),
                is_audit_finding=str(row.get("is_audit_finding", "false")).lower() == "true",
                responsible=str(row.get("responsible", "")),
            )
            db.add(sv)
            count += 1
    else:
        return {"error": f"Неизвестный формат. Колонки: {cols}"}

    await db.commit()
    return {"message": "Файл загружен", "rows": count}


@router.get("/export/excel")
async def export_excel(
    data_type: str = Query("incidents"),
    db: AsyncSession = Depends(get_db),
):
    if data_type == "incidents":
        result = await db.execute(select(Incident).order_by(Incident.date.desc()))
        rows = result.scalars().all()
        data = generate_incidents_excel([IncidentResponse.model_validate(i) for i in rows])
        filename = "incidents_report.xlsx"
    else:
        result = await db.execute(select(Incident).order_by(Incident.date.desc()))
        rows = result.scalars().all()
        data = generate_incidents_excel([IncidentResponse.model_validate(i) for i in rows])
        filename = f"{data_type}_report.xlsx"

    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/report")
async def export_full_report(
    data_type: str = Query("incidents"),
    period: str = Query("monthly"),
    forecast_periods: int = Query(6),
    time_period: int = Query(12),
    db: AsyncSession = Depends(get_db),
):
    from app.api.statistics import dashboard as _dashboard

    dashboard_data = await _dashboard(db=db)

    fmea_data = await auto_fmea(db)

    if data_type == "incidents":
        result = await db.execute(select(Incident))
        rows = result.scalars().all()
        values = [i.days_lost for i in rows]
    elif data_type == "equipment":
        result = await db.execute(select(EquipmentFailure))
        rows = result.scalars().all()
        values = [i.downtime_hours for i in rows]
    else:
        result = await db.execute(select(SafetyViolation))
        rows = result.scalars().all()
        values = [1.0 for _ in rows]

    descriptive_data = {}
    if values:
        ds = descriptive_statistics(values)
        descriptive_data = {
            "count": ds.count, "mean": ds.mean, "std": ds.std,
            "min": ds.min, "max": ds.max, "median": ds.median,
            "q25": ds.q1, "q75": ds.q3,
        }

    trend_data = {}
    if rows:
        grouped: dict[str, int] = {}
        for row in rows:
            d = str(row.date)
            if period == "yearly":
                key = d[:4]
            elif period == "quarterly":
                m = int(d[5:7])
                q = (m - 1) // 3 + 1
                key = f"{d[:4]}-Q{q}"
            else:
                key = d[:7]
            grouped[key] = grouped.get(key, 0) + 1
        sorted_items = sorted(grouped.items())
        labels = [m for m, _ in sorted_items]
        vals = [c for _, c in sorted_items]
        tr = trend_analysis(vals, labels, forecast_periods)
        trend_data = {
            "data": [{"period": l, "count": c, "trend_value": tr.moving_avg[i] if i < len(tr.moving_avg) else None} for i, (l, c) in enumerate(sorted_items)],
            "slope": tr.slope, "r_squared": tr.r_squared,
            "direction": "increasing" if tr.trend_direction == "Растущий" else "decreasing" if tr.trend_direction == "Нисходящий" else "stable",
            "forecast_values": tr.forecast_values, "forecast_labels": tr.forecast_labels,
            "forecast_lower": tr.forecast_lower, "forecast_upper": tr.forecast_upper,
        }

    poisson_data = {}
    import numpy as np
    from scipy import stats as sp_stats
    if rows:
        grouped: dict[str, int] = {}
        for row in rows:
            d = str(row.date)
            if period == "yearly":
                key = d[:4]
            elif period == "quarterly":
                m = int(d[5:7])
                q = (m - 1) // 3 + 1
                key = f"{d[:4]}-Q{q}"
            else:
                key = d[:7]
            grouped[key] = grouped.get(key, 0) + 1
        sorted_items = sorted(grouped.items())
        counts = [c for _, c in sorted_items]
        labels_p = [l for l, _ in sorted_items]
        lam = float(np.mean(counts))
        unit = {"yearly": "год", "quarterly": "квартал"}.get(period, "месяц")
        n_max = min(int(lam * 3) + 5, 50)
        distribution = []
        cumulative = 0.0
        for k in range(n_max + 1):
            prob = float(sp_stats.poisson.pmf(k, lam))
            cumulative += prob
            distribution.append({"k": k, "probability": round(prob, 6), "cumulative": round(cumulative, 6)})
        ci_low, ci_high = sp_stats.poisson.interval(0.95, lam * time_period)
        poisson_data = {
            "lambda": round(lam, 4), "time_period": time_period, "period_unit": unit,
            "total_events": len(rows), "num_periods": len(counts),
            "prob_zero": round(float(sp_stats.poisson.pmf(0, lam)), 6),
            "prob_at_least_one": round(1 - float(sp_stats.poisson.pmf(0, lam)), 6),
            "expected_in_period": round(lam * time_period, 2),
            "distribution": distribution,
            "confidence_interval": [max(0, float(ci_low)), float(ci_high)],
        }

    data = generate_full_report_pdf(dashboard_data, fmea_data, descriptive_data, trend_data, poisson_data, data_type)
    filename = f"risk_report_{data_type}.pdf"
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
