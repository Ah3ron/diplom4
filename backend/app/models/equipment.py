from datetime import date
from typing import Optional

from sqlalchemy import Date, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class EquipmentFailure(Base):
    __tablename__ = "equipment_failures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(200), nullable=False)
    equipment_name: Mapped[str] = mapped_column(String(200), nullable=False)
    operating_hours: Mapped[float] = mapped_column(Float, default=0)
    downtime_hours: Mapped[float] = mapped_column(Float, default=0)
    failure_cause: Mapped[str] = mapped_column(String(300), nullable=False)
    repair_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
