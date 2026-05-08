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
from app.services.export import generate_incidents_excel, generate_incidents_pdf

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


@router.get("/export/pdf")
async def export_pdf(
    data_type: str = Query("incidents"),
    db: AsyncSession = Depends(get_db),
):
    if data_type == "incidents":
        result = await db.execute(select(Incident).order_by(Incident.date.desc()))
        rows = result.scalars().all()
        data = generate_incidents_pdf([IncidentResponse.model_validate(i) for i in rows])
        filename = "incidents_report.pdf"
    else:
        result = await db.execute(select(Incident).order_by(Incident.date.desc()))
        rows = result.scalars().all()
        data = generate_incidents_pdf([IncidentResponse.model_validate(i) for i in rows])
        filename = f"{data_type}_report.pdf"

    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
