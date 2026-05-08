from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.equipment import EquipmentFailure
from app.models.incident import Incident
from app.models.safety import SafetyViolation
from app.schemas.statistics import (
    PoissonInput,
    PoissonResult,
    TrendResult,
)
from app.services.statistics import descriptive_statistics, poisson_analysis, trend_analysis

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
        values = [1.0 for _ in rows]
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
        trend_val = None
        if i < len(tr.moving_avg):
            trend_val = tr.moving_avg[i]
        data_points.append({"period": label, "count": count, "trend_value": trend_val})

    return {
        "data": data_points,
        "slope": tr.slope,
        "r_squared": tr.r_squared,
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


@router.post("/poisson")
async def poisson_endpoint(data: PoissonInput):
    result = poisson_analysis(data.event_counts, data.forecast_periods)
    return {
        "lambda_est": result.lambda_est,
        "prob_zero": result.probabilities[0]["probability"] if result.probabilities else 0,
        "prob_at_least_one": 1 - (result.probabilities[0]["probability"] if result.probabilities else 0),
        "expected_in_period": result.lambda_est,
        "distribution": result.probabilities,
        "forecast": result.forecast,
        "confidence_interval": list(result.confidence_interval),
    }


@router.get("/poisson/estimate")
async def poisson_estimate(
    lambda_val: float = Query(4.0, alias="lambda"),
    time_period: int = Query(12),
):
    import numpy as np
    from scipy import stats as sp_stats

    lam = lambda_val
    n_max = min(int(lam * 3) + 5, 50)

    distribution = []
    cumulative = 0.0
    for k in range(n_max + 1):
        prob = float(sp_stats.poisson.pmf(k, lam))
        cumulative += prob
        distribution.append({"k": k, "probability": round(prob, 6), "cumulative": round(cumulative, 6)})

    ci_low, ci_high = sp_stats.poisson.interval(0.95, lam * time_period)

    return {
        "lambda": lam,
        "time_period": time_period,
        "prob_zero": round(float(sp_stats.poisson.pmf(0, lam)), 6),
        "prob_at_least_one": round(1 - float(sp_stats.poisson.pmf(0, lam)), 6),
        "expected_in_period": round(lam * time_period, 2),
        "distribution": distribution,
        "confidence_interval": [max(0, float(ci_low)), float(ci_high)],
    }


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db)):
    inc_count = (await db.execute(select(func.count(Incident.id)))).scalar() or 0
    eq_count = (await db.execute(select(func.count(EquipmentFailure.id)))).scalar() or 0
    sv_count = (await db.execute(select(func.count(SafetyViolation.id)))).scalar() or 0

    incidents_by_department: dict[str, int] = {}
    result = await db.execute(
        select(Incident.department, func.count(Incident.id)).group_by(Incident.department)
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
        select(SafetyViolation.department, func.count(SafetyViolation.id)).group_by(
            SafetyViolation.department
        )
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
