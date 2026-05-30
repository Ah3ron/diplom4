from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class MedicalExam(Base):
    __tablename__ = "medical_exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    profession: Mapped[str] = mapped_column(String(200), nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    findings: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    disease_category: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    department_ref = relationship("Department", back_populates="medical_exams")
