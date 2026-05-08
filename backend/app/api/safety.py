from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.safety import SafetyViolation
from app.schemas.safety import SafetyStatistics, SafetyViolationCreate, SafetyViolationResponse

router = APIRouter(prefix="/safety", tags=["Охрана труда"])


@router.get("/", response_model=list[SafetyViolationResponse])
async def list_violations(
    department: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    q = select(SafetyViolation).order_by(SafetyViolation.date.desc())
    if department:
        q = q.where(SafetyViolation.department == department)
    if year:
        q = q.where(func.strftime("%Y", SafetyViolation.date) == str(year))
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=SafetyViolationResponse)
async def create_violation(data: SafetyViolationCreate, db: AsyncSession = Depends(get_db)):
    sv = SafetyViolation(**data.model_dump())
    db.add(sv)
    await db.commit()
    await db.refresh(sv)
    return sv


@router.get("/statistics", response_model=SafetyStatistics)
async def safety_statistics(
    year: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    q = select(SafetyViolation)
    if year:
        q = q.where(func.strftime("%Y", SafetyViolation.date) == str(year))
    result = await db.execute(q)
    violations = result.scalars().all()

    if not violations:
        return SafetyStatistics(
            total_violations=0, audit_findings_count=0,
            by_department={}, by_type={}, monthly_counts=[],
        )

    by_dept: dict[str, int] = {}
    by_type: dict[str, int] = {}
    monthly: dict[str, int] = {}
    audit_count = 0

    for v in violations:
        by_dept[v.department] = by_dept.get(v.department, 0) + 1
        by_type[v.violation_type] = by_type.get(v.violation_type, 0) + 1
        key = str(v.date)[:7]
        monthly[key] = monthly.get(key, 0) + 1
        if v.is_audit_finding:
            audit_count += 1

    monthly_counts = [{"month": k, "count": v} for k, v in sorted(monthly.items())]

    return SafetyStatistics(
        total_violations=len(violations),
        audit_findings_count=audit_count,
        by_department=by_dept,
        by_type=by_type,
        monthly_counts=monthly_counts,
    )


@router.delete("/{violation_id}")
async def delete_violation(violation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SafetyViolation).where(SafetyViolation.id == violation_id))
    sv = result.scalar_one_or_none()
    if sv:
        await db.delete(sv)
        await db.commit()
    return {"ok": True}
