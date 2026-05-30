import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.risk_assessment import RiskAssessment
from app.services.auto_fmea import auto_fmea

router = APIRouter(prefix="/risk", tags=["Оценка рисков"])


@router.get("/fmea")
async def fmea_analysis(
    department: Optional[str] = Query(None),
    equipment_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    result = await auto_fmea(db, department=department, equipment_type=equipment_type)
    assessment = RiskAssessment(
        method="fmea",
        name=result["analysis_name"],
        input_params=json.dumps({"department": department, "equipment_type": equipment_type}),
        result=json.dumps(result),
        source_type="equipment_failures",
        source_id=None,
    )
    db.add(assessment)
    await db.commit()
    return result


@router.get("/history")
async def risk_history(
    method: str = None, db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select

    q = select(RiskAssessment).order_by(RiskAssessment.created_at.desc()).limit(50)
    if method:
        q = q.where(RiskAssessment.method == method)
    result = await db.execute(q)
    assessments = result.scalars().all()
    return [
        {
            "id": a.id,
            "method": a.method,
            "name": a.name,
            "result": json.loads(a.result) if a.result else {},
            "created_at": str(a.created_at),
            "author": a.author,
        }
        for a in assessments
    ]
