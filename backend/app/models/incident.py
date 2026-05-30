from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(200), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    days_lost: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    department_ref = relationship("Department", back_populates="incidents")
