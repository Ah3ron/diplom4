from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class SafetyViolation(Base):
    __tablename__ = "safety_violations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    violation_type: Mapped[str] = mapped_column(String(200), nullable=False)
    is_audit_finding: Mapped[bool] = mapped_column(Boolean, default=False)
    responsible: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    department_ref = relationship("Department", back_populates="safety_violations")
