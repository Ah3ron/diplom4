from typing import Optional

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    type: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    incidents = relationship("Incident", back_populates="department_ref", lazy="selectin")
    equipment_failures = relationship("EquipmentFailure", back_populates="department_ref", lazy="selectin")
    safety_violations = relationship("SafetyViolation", back_populates="department_ref", lazy="selectin")
    medical_exams = relationship("MedicalExam", back_populates="department_ref", lazy="selectin")
