from datetime import date
from typing import Optional

from pydantic import BaseModel


class IncidentBase(BaseModel):
    date: date
    department: str
    incident_type: str
    severity: str
    days_lost: int = 0
    description: Optional[str] = None


class IncidentCreate(IncidentBase):
    pass


class IncidentResponse(IncidentBase):
    id: int

    model_config = {"from_attributes": True}


class IncidentStatistics(BaseModel):
    total_incidents: int
    total_days_lost: int
    frequency_rate: float
    severity_rate: float
    by_department: dict[str, int]
    by_severity: dict[str, int]
    by_type: dict[str, int]
    monthly_counts: list[dict]
