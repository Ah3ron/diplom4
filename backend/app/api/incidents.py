from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.incident import Incident
from app.schemas import IncidentCreate, IncidentResponse, IncidentStatistics

router = APIRouter(prefix="/incidents", tags=["Травматизм"])


@router.get("/", response_model=list[IncidentResponse])
async def list_incidents(
    department: Optional[str] = None,
    severity: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    q = select(Incident).order_by(Incident.date.desc())
    if department:
        q = q.where(Incident.department == department)
    if severity:
        q = q.where(Incident.severity == severity)
    if year:
        q = q.where(func.strftime("%Y", Incident.date) == str(year))
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=IncidentResponse)
async def create_incident(data: IncidentCreate, db: AsyncSession = Depends(get_db)):
    inc = Incident(**data.model_dump())
    db.add(inc)
    await db.commit()
    await db.refresh(inc)
    return inc


@router.get("/statistics", response_model=IncidentStatistics)
async def incident_statistics(
    year: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    q = select(Incident)
    if year:
        q = q.where(func.strftime("%Y", Incident.date) == str(year))
    result = await db.execute(q)
    incidents = result.scalars().all()

    if not incidents:
        return IncidentStatistics(
            total_incidents=0, total_days_lost=0, frequency_rate=0,
            severity_rate=0, by_department={}, by_severity={},
            by_type={}, monthly_counts=[],
        )

    total = len(incidents)
    days = sum(i.days_lost for i in incidents)
    avg_emp = 1300
    freq_rate = total * 1000 / avg_emp
    sev_rate = days / total if total > 0 else 0

    by_dept: dict[str, int] = {}
    by_sev: dict[str, int] = {}
    by_type: dict[str, int] = {}
    monthly: dict[str, int] = {}

    for inc in incidents:
        by_dept[inc.department] = by_dept.get(inc.department, 0) + 1
        by_sev[inc.severity] = by_sev.get(inc.severity, 0) + 1
        by_type[inc.incident_type] = by_type.get(inc.incident_type, 0) + 1
        key = str(inc.date)[:7]
        monthly[key] = monthly.get(key, 0) + 1

    monthly_counts = [{"month": k, "count": v} for k, v in sorted(monthly.items())]

    return IncidentStatistics(
        total_incidents=total,
        total_days_lost=days,
        frequency_rate=round(freq_rate, 2),
        severity_rate=round(sev_rate, 2),
        by_department=by_dept,
        by_severity=by_sev,
        by_type=by_type,
        monthly_counts=monthly_counts,
    )


@router.delete("/{incident_id}")
async def delete_incident(incident_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    inc = result.scalar_one_or_none()
    if inc:
        await db.delete(inc)
        await db.commit()
    return {"ok": True}
