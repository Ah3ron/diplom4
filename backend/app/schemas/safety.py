from datetime import date
from typing import Optional

from pydantic import BaseModel


class SafetyViolationBase(BaseModel):
    date: date
    department: str
    violation_type: str
    is_audit_finding: bool = False
    responsible: Optional[str] = None
    description: Optional[str] = None


class SafetyViolationCreate(SafetyViolationBase):
    pass


class SafetyViolationResponse(SafetyViolationBase):
    id: int

    model_config = {"from_attributes": True}


class SafetyStatistics(BaseModel):
    total_violations: int
    audit_findings_count: int
    by_department: dict[str, int]
    by_type: dict[str, int]
    monthly_counts: list[dict]
