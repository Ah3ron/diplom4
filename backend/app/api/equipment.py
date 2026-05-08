from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.equipment import EquipmentFailure
from app.schemas.equipment import (
    EquipmentFailureCreate,
    EquipmentFailureResponse,
    EquipmentStatistics,
)

router = APIRouter(prefix="/equipment", tags=["Оборудование"])


@router.get("/", response_model=list[EquipmentFailureResponse])
async def list_failures(
    equipment_type: Optional[str] = None,
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    q = select(EquipmentFailure).order_by(EquipmentFailure.date.desc())
    if equipment_type:
        q = q.where(EquipmentFailure.equipment_type == equipment_type)
    if year:
        q = q.where(func.strftime("%Y", EquipmentFailure.date) == str(year))
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=EquipmentFailureResponse)
async def create_failure(data: EquipmentFailureCreate, db: AsyncSession = Depends(get_db)):
    ef = EquipmentFailure(**data.model_dump())
    db.add(ef)
    await db.commit()
    await db.refresh(ef)
    return ef


@router.get("/statistics", response_model=EquipmentStatistics)
async def equipment_statistics(
    year: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    q = select(EquipmentFailure)
    if year:
        q = q.where(func.strftime("%Y", EquipmentFailure.date) == str(year))
    result = await db.execute(q)
    failures = result.scalars().all()

    if not failures:
        return EquipmentStatistics(
            total_failures=0, total_downtime=0, avg_downtime=0,
            mtbf=0, total_repair_cost=0, by_equipment_type={},
            by_cause={}, monthly_counts=[],
        )

    total = len(failures)
    total_dt = sum(f.downtime_hours for f in failures)
    avg_dt = total_dt / total
    total_ops = sum(f.operating_hours for f in failures)
    mtbf = total_ops / total if total > 0 else 0
    total_cost = sum(f.repair_cost or 0 for f in failures)

    by_type: dict[str, int] = {}
    by_cause: dict[str, int] = {}
    monthly: dict[str, int] = {}

    for f in failures:
        by_type[f.equipment_type] = by_type.get(f.equipment_type, 0) + 1
        by_cause[f.failure_cause] = by_cause.get(f.failure_cause, 0) + 1
        key = str(f.date)[:7]
        monthly[key] = monthly.get(key, 0) + 1

    monthly_counts = [{"month": k, "count": v} for k, v in sorted(monthly.items())]

    return EquipmentStatistics(
        total_failures=total,
        total_downtime=round(total_dt, 2),
        avg_downtime=round(avg_dt, 2),
        mtbf=round(mtbf, 2),
        total_repair_cost=round(total_cost, 2),
        by_equipment_type=by_type,
        by_cause=by_cause,
        monthly_counts=monthly_counts,
    )


@router.delete("/{failure_id}")
async def delete_failure(failure_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EquipmentFailure).where(EquipmentFailure.id == failure_id))
    ef = result.scalar_one_or_none()
    if ef:
        await db.delete(ef)
        await db.commit()
    return {"ok": True}
