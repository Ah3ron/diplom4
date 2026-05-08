import json

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.risk_assessment import RiskAssessment
from app.schemas.fmea import FMEAAnalysis, FMEAInput, FMEARequest
from app.schemas.risk_matrix import RiskMatrixInput, RiskMatrixResult
from app.services import calculate_risk_matrix
from app.services.fmea import analyze_fmea

router = APIRouter(prefix="/risk", tags=["Оценка рисков"])


@router.post("/matrix", response_model=RiskMatrixResult)
async def assess_risk_matrix(
    data: RiskMatrixInput, db: AsyncSession = Depends(get_db)
):
    result = calculate_risk_matrix(data)
    assessment = RiskAssessment(
        method="risk_matrix",
        name=f"Матрица рисков: В={data.likelihood}×Т={data.severity}",
        input_params=data.model_dump_json(),
        result=result.assessment.model_dump_json(),
    )
    db.add(assessment)
    await db.commit()
    return result


@router.post("/fmea", response_model=FMEAAnalysis)
async def assess_fmea(data: FMEARequest, db: AsyncSession = Depends(get_db)):
    result = analyze_fmea(data.items, analysis_name=data.analysis_name)
    assessment = RiskAssessment(
        method="fmea",
        name=data.analysis_name,
        input_params=json.dumps([i.model_dump() for i in data.items]),
        result=result.model_dump_json(),
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
