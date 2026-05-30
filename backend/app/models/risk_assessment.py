from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    method: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    input_params: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    author: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
