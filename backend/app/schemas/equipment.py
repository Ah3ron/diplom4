from datetime import date
from typing import Optional

from pydantic import BaseModel


class EquipmentFailureBase(BaseModel):
    date: date
    department_id: int
    equipment_type: str
    equipment_name: str
    operating_hours: float = 0
    downtime_hours: float = 0
    failure_cause: str
    repair_cost: Optional[float] = None
    description: Optional[str] = None


class EquipmentFailureCreate(EquipmentFailureBase):
    pass


class EquipmentFailureResponse(EquipmentFailureBase):
    id: int

    model_config = {"from_attributes": True}


class EquipmentStatistics(BaseModel):
    total_failures: int
    total_downtime: float
    avg_downtime: float
    mtbf: float
    total_repair_cost: float
    by_equipment_type: dict[str, int]
    by_cause: dict[str, int]
    monthly_counts: list[dict]
