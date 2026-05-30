from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.department import Department
from app.models.equipment import EquipmentFailure
from app.models.incident import Incident
from app.models.safety import SafetyViolation
from app.schemas.statistics import (
    TrendResult,
)
from app.services.statistics import descriptive_statistics, trend_analysis, poisson_goodness_of_fit, correlation_analysis

router = APIRouter(prefix="/statistics", tags=["Статистика"])


@router.get("/descriptive")
async def descriptive(
    data_type: str = Query("incidents"),
    db: AsyncSession = Depends(get_db),
):
    if data_type == "incidents":
        result = await db.execute(select(Incident))
        rows = result.scalars().all()
        values = [i.days_lost for i in rows]
    elif data_type == "equipment":
        result = await db.execute(select(EquipmentFailure))
        rows = result.scalars().all()
        values = [i.downtime_hours for i in rows]
    elif data_type == "safety":
        result = await db.execute(select(SafetyViolation))
        rows = result.scalars().all()
        grouped: dict[str, int] = {}
        for row in rows:
            key = str(row.date)[:7]
            grouped[key] = grouped.get(key, 0) + 1
        values = list(grouped.values()) if grouped else []
    else:
        return {"error": f"Unknown data_type: {data_type}"}

    if not values:
        return {"error": "Нет данных"}

    ds = descriptive_statistics(values)
    return {
        "count": ds.count,
        "mean": ds.mean,
        "std": ds.std,
        "min": ds.min,
        "max": ds.max,
        "median": ds.median,
        "q25": ds.q1,
        "q75": ds.q3,
    }


@router.get("/trend")
async def trend(
    data_type: str = Query("incidents"),
    period: str = Query("monthly"),
    forecast_periods: int = Query(6),
    db: AsyncSession = Depends(get_db),
):
    if data_type == "incidents":
        result = await db.execute(select(Incident).order_by(Incident.date))
        rows = result.scalars().all()
    elif data_type == "equipment":
        result = await db.execute(select(EquipmentFailure).order_by(EquipmentFailure.date))
        rows = result.scalars().all()
    elif data_type == "safety":
        result = await db.execute(select(SafetyViolation).order_by(SafetyViolation.date))
        rows = result.scalars().all()
    else:
        return {"error": f"Unknown data_type: {data_type}"}

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

    if not grouped:
        return {"error": "Нет данных"}

    sorted_items = sorted(grouped.items())
    labels = [m for m, _ in sorted_items]
    values = [c for _, c in sorted_items]

    tr: TrendResult = trend_analysis(values, labels, forecast_periods)

    data_points = []
    for i, (label, count) in enumerate(sorted_items):
        reg_val = None
        ma_val = None
        if i < len(tr.regression_line):
            reg_val = tr.regression_line[i]
        if i < len(tr.moving_avg):
            ma_val = tr.moving_avg[i]
        data_points.append({"period": label, "count": count, "trend_value": reg_val, "moving_avg": ma_val})

    return {
        "data": data_points,
        "slope": tr.slope,
        "intercept": tr.intercept,
        "r_squared": tr.r_squared,
        "p_value": tr.p_value,
        "direction": (
            "increasing" if tr.trend_direction == "Растущий"
            else "decreasing" if tr.trend_direction == "Нисходящий"
            else "stable"
        ),
        "forecast_values": tr.forecast_values,
        "forecast_labels": tr.forecast_labels,
        "forecast_lower": tr.forecast_lower,
        "forecast_upper": tr.forecast_upper,
    }


@router.get("/poisson")
async def poisson_analysis_endpoint(
    data_type: str = Query("incidents"),
    period: str = Query("monthly"),
    time_period: int = Query(12),
    db: AsyncSession = Depends(get_db),
):
    import numpy as np
    from scipy import stats as sp_stats
    from datetime import datetime

    if data_type == "incidents":
        result = await db.execute(select(Incident).order_by(Incident.date))
        rows = result.scalars().all()
    elif data_type == "equipment":
        result = await db.execute(select(EquipmentFailure).order_by(EquipmentFailure.date))
        rows = result.scalars().all()
    elif data_type == "safety":
        result = await db.execute(select(SafetyViolation).order_by(SafetyViolation.date))
        rows = result.scalars().all()
    else:
        return {"error": f"Неизвестный тип данных: {data_type}"}

    if not rows:
        return {"error": "Нет данных для анализа"}

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
    counts = [c for _, c in sorted_items]

    lam = float(np.mean(counts))

    event_counts_per_period = counts
    if period == "yearly":
        lam_per_unit = lam
        unit_label = "год"
    elif period == "quarterly":
        lam_per_unit = lam
        unit_label = "квартал"
    else:
        lam_per_unit = lam
        unit_label = "месяц"

    n_max = min(int(lam * 3) + 5, 50)

    distribution = []
    cumulative = 0.0
    for k in range(n_max + 1):
        prob = float(sp_stats.poisson.pmf(k, lam))
        cumulative += prob
        distribution.append({"k": k, "probability": round(prob, 6), "cumulative": round(cumulative, 6)})

    ci_low, ci_high = sp_stats.poisson.interval(0.95, lam * time_period)

    gof = poisson_goodness_of_fit(counts, lam)

    first_date = str(rows[0].date)[:10] if rows else None
    last_date = str(rows[-1].date)[:10] if rows else None

    return {
        "lambda": round(lam, 4),
        "time_period": time_period,
        "period_unit": unit_label,
        "period_type": period,
        "total_events": len(rows),
        "num_periods": len(counts),
        "first_date": first_date,
        "last_date": last_date,
        "event_counts": event_counts_per_period,
        "period_labels": labels,
        "prob_zero": round(float(sp_stats.poisson.pmf(0, lam)), 6),
        "prob_at_least_one": round(1 - float(sp_stats.poisson.pmf(0, lam)), 6),
        "expected_in_period": round(lam * time_period, 2),
        "distribution": distribution,
        "confidence_interval": [max(0, float(ci_low)), float(ci_high)],
        "goodness_of_fit": gof,
    }


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db)):
    inc_count = (await db.execute(select(func.count(Incident.id)))).scalar() or 0
    eq_count = (await db.execute(select(func.count(EquipmentFailure.id)))).scalar() or 0
    sv_count = (await db.execute(select(func.count(SafetyViolation.id)))).scalar() or 0

    incidents_by_department: dict[str, int] = {}
    result = await db.execute(
        select(Department.name, func.count(Incident.id))
        .join(Department, Incident.department_id == Department.id)
        .group_by(Department.name)
    )
    for dept, cnt in result.all():
        incidents_by_department[dept] = cnt

    incidents_by_type: dict[str, int] = {}
    result = await db.execute(
        select(Incident.incident_type, func.count(Incident.id)).group_by(Incident.incident_type)
    )
    for t, cnt in result.all():
        incidents_by_type[t] = cnt

    incidents_by_severity: dict[str, int] = {}
    result = await db.execute(
        select(Incident.severity, func.count(Incident.id)).group_by(Incident.severity)
    )
    for s, cnt in result.all():
        incidents_by_severity[s] = cnt

    equipment_by_type: dict[str, int] = {}
    result = await db.execute(
        select(EquipmentFailure.equipment_type, func.count(EquipmentFailure.id)).group_by(
            EquipmentFailure.equipment_type
        )
    )
    for t, cnt in result.all():
        equipment_by_type[t] = cnt

    violations_by_department: dict[str, int] = {}
    result = await db.execute(
        select(Department.name, func.count(SafetyViolation.id))
        .join(Department, SafetyViolation.department_id == Department.id)
        .group_by(Department.name)
    )
    for dept, cnt in result.all():
        violations_by_department[dept] = cnt

    monthly: dict[str, int] = {}
    result = await db.execute(select(Incident.date).order_by(Incident.date))
    for row in result.all():
        key = str(row[0])[:7]
        monthly[key] = monthly.get(key, 0) + 1
    monthly_trend = [{"month": m, "count": c} for m, c in sorted(monthly.items())]

    return {
        "total_incidents": inc_count,
        "total_equipment_failures": eq_count,
        "total_safety_violations": sv_count,
        "incidents_by_department": incidents_by_department,
        "incidents_by_type": incidents_by_type,
        "incidents_by_severity": incidents_by_severity,
        "equipment_by_type": equipment_by_type,
        "violations_by_department": violations_by_department,
        "monthly_trend": monthly_trend,
    }


@router.get("/correlation")
async def correlation(
    period: str = Query("monthly"),
    db: AsyncSession = Depends(get_db),
):
    inc_result = await db.execute(select(Incident).order_by(Incident.date))
    incidents = inc_result.scalars().all()

    eq_result = await db.execute(select(EquipmentFailure).order_by(EquipmentFailure.date))
    failures = eq_result.scalars().all()

    viol_result = await db.execute(select(SafetyViolation).order_by(SafetyViolation.date))
    violations = viol_result.scalars().all()

    def _group(rows: list, period: str) -> dict[str, int]:
        g: dict[str, int] = {}
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
            g[key] = g.get(key, 0) + 1
        return g

    inc_grouped = _group(incidents, period)
    eq_grouped = _group(failures, period)
    viol_grouped = _group(violations, period)

    all_keys = sorted(set(inc_grouped) | set(eq_grouped) | set(viol_grouped))
    inc_vals = [inc_grouped.get(k, 0) for k in all_keys]
    eq_vals = [eq_grouped.get(k, 0) for k in all_keys]
    viol_vals = [viol_grouped.get(k, 0) for k in all_keys]

    results = {}
    if len(all_keys) >= 3:
        results["incidents_vs_equipment"] = correlation_analysis(
            inc_vals, eq_vals, all_keys, all_keys
        )
        results["incidents_vs_violations"] = correlation_analysis(
            inc_vals, viol_vals, all_keys, all_keys
        )
        results["equipment_vs_violations"] = correlation_analysis(
            eq_vals, viol_vals, all_keys, all_keys
        )
    else:
        results = {"error": "Недостаточно данных для корреляционного анализа (нужно ≥3 периодов)"}

    results["periods"] = [{"period": k, "incidents": inc_vals[i], "equipment": eq_vals[i], "violations": viol_vals[i]} for i, k in enumerate(all_keys)]
    return results
