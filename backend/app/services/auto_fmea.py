from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import EquipmentFailure
from app.models.incident import Incident
from app.models.safety import SafetyViolation
from app.schemas.fmea import FMEAInput
from app.services.fmea import analyze_fmea


SEVERITY_BY_DOWNTIME = [
    (2, 0, 2),
    (4, 2, 8),
    (6, 8, 24),
    (8, 24, 48),
    (10, 48, float("inf")),
]

INCIDENT_SEVERITY_SCORE = {"Лёгкий": 1, "Средний": 3, "Тяжёлый": 7, "Смертельный": 10}

MONTHS_SPAN = 64


def _severity_from_downtime(avg_downtime: float) -> int:
    for score, lo, hi in SEVERITY_BY_DOWNTIME:
        if lo <= avg_downtime < hi:
            return score
    return 5


def _severity_from_incidents(incidents: list) -> int:
    if not incidents:
        return 0
    return max(INCIDENT_SEVERITY_SCORE.get(i.severity, 1) for i in incidents)


def _occurrence_from_count(count: int, span_months: float) -> int:
    if span_months <= 0:
        return 1
    per_month = count / span_months
    if per_month < 0.05:
        return 1
    elif per_month < 0.1:
        return 2
    elif per_month < 0.2:
        return 3
    elif per_month < 0.3:
        return 4
    elif per_month < 0.5:
        return 5
    elif per_month < 0.7:
        return 6
    elif per_month < 1.0:
        return 7
    elif per_month < 1.5:
        return 8
    elif per_month < 2.5:
        return 9
    else:
        return 10


def _detection_from_violations(violation_ratio: float, audit_ratio: float) -> int:
    score = 3
    if violation_ratio > 0.15:
        score += 2
    elif violation_ratio > 0.08:
        score += 1
    if audit_ratio < 0.2:
        score += 3
    elif audit_ratio < 0.35:
        score += 1
    return min(score, 10)


def _detect_violation_keyword(failure_cause: str) -> str | None:
    keywords = {
        "Нарушение регламента ТО": "Нарушение инструкций по ТБ",
        "Перегрузка": "Нарушение режима работы",
        "Коррозия": None,
        "Механический износ": None,
        "Электрическая неисправность": "Нарушение электробезопасности",
        "Гидравлическая утечка": None,
        "Программный сбой": None,
    }
    return keywords.get(failure_cause)


async def auto_fmea(
    db: AsyncSession,
    department: str | None = None,
    equipment_type: str | None = None,
    analysis_name: str = "Автоматический FMEA-анализ",
) -> dict:
    eq_q = select(EquipmentFailure)
    if equipment_type:
        eq_q = eq_q.where(EquipmentFailure.equipment_type == equipment_type)
    eq_result = await db.execute(eq_q)
    failures = eq_result.scalars().all()

    inc_q = select(Incident)
    if department:
        inc_q = inc_q.where(Incident.department == department)
    inc_result = await db.execute(inc_q)
    incidents = inc_result.scalars().all()

    viol_q = select(SafetyViolation)
    if department:
        viol_q = viol_q.where(SafetyViolation.department == department)
    viol_result = await db.execute(viol_q)
    violations = viol_result.scalars().all()

    if not failures:
        return {
            "analysis_name": analysis_name,
            "items": [],
            "total_risk": 0,
            "avg_rpn": 0,
            "high_risk_count": 0,
            "recommendations": ["Нет данных об отказах оборудования для анализа."],
            "source_stats": {
                "total_failures": 0,
                "total_incidents": len(incidents),
                "total_violations": len(violations),
                "period_months": MONTHS_SPAN,
            },
        }

    grouped: dict[tuple[str, str], list] = defaultdict(list)
    for f in failures:
        grouped[(f.equipment_type, f.failure_cause)].append(f)

    total_violations = len(violations)
    audit_violations = sum(1 for v in violations if v.is_audit_finding)
    audit_ratio = audit_violations / total_violations if total_violations > 0 else 0

    fmea_items: list[FMEAInput] = []
    idx = 1
    for (eq_type, cause), group in grouped.items():
        count = len(group)
        avg_downtime = sum(f.downtime_hours for f in group) / count
        avg_cost = sum(f.repair_cost or 0 for f in group) / count

        s_downtime = _severity_from_downtime(avg_downtime)

        related_incidents = [
            i for i in incidents if i.date >= min(f.date for f in group)
        ]
        s_incidents = _severity_from_incidents(related_incidents)
        severity = min(max(s_downtime, s_incidents), 10)

        occurrence = _occurrence_from_count(count, MONTHS_SPAN)

        viol_keyword = _detect_violation_keyword(cause)
        related_violations = (
            sum(1 for v in violations if v.violation_type == viol_keyword)
            if viol_keyword
            else 0
        )
        violation_ratio = related_violations / total_violations if total_violations > 0 else 0
        detection = _detection_from_violations(violation_ratio, audit_ratio)

        fmea_items.append(
            FMEAInput(
                id=idx,
                failure_mode=f"{eq_type}: {cause.lower()}",
                component=eq_type,
                failure_effect=f"Простой {avg_downtime:.1f}ч, стоимость {avg_cost:.0f} BYN",
                severity=severity,
                occurrence=occurrence,
                detection=detection,
            )
        )
        idx += 1

    result = analyze_fmea(fmea_items, analysis_name=analysis_name)

    return {
        **result.model_dump(),
        "source_stats": {
            "total_failures": len(failures),
            "total_incidents": len(incidents),
            "total_violations": len(violations),
            "period_months": MONTHS_SPAN,
        },
    }
