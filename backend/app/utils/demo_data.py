import random
from datetime import date, timedelta

from sqlalchemy import select

from app.database import async_session, engine
from app.models import Base
from app.models.equipment import EquipmentFailure
from app.models.health import MedicalExam
from app.models.incident import Incident
from app.models.safety import SafetyViolation

DEPARTMENTS = [
    "Цех горно-шахтного оборудования",
    "Экспериментальное производство",
    "Цех спецоборудования",
    "Цех КИПиА",
    "Институт горной автоматики",
]

INCIDENT_TYPES = [
    "Падение", "Удар предметом", "Поражение током",
    "Ожог", "Застревание в механизме", "Отравление",
    "Падение с высоты", "Обрушение породы", "Взрыв газа",
]

SEVERITIES = ["Лёгкий", "Средний", "Тяжёлый", "Смертельный"]
SEVERITY_WEIGHTS = [50, 35, 13, 2]

EQUIPMENT_TYPES = [
    "Комбайн очистной", "Кран портальный", "Станок с ЧПУ",
    "Экскаватор шагающий", "Установка буровая",
]

EQUIPMENT_NAMES = [
    "КСП-32", "КПШ-10", "DMG MORI NLX 2500",
    "ЭШ-10/70", "Медвед-02", "Урал-20Р",
]

FAILURE_CAUSES = [
    "Механический износ", "Электрическая неисправность",
    "Гидравлическая утечка", "Нарушение регламента ТО",
    "Коррозия", "Перегрузка", "Программный сбой",
]

VIOLATION_TYPES = [
    "Нарушение инструкций по ТБ", "Работа без СИЗ",
    "Нарушение режима работы", "Несанкционированный доступ",
    "Нарушение пожарной безопасности", "Нарушение электробезопасности",
]

PROFESSIONS = [
    "Слесарь-монтажник", "Оператор станков с ЧПУ", "Горный инженер",
    "Электромонтёр", "Сварщик", "Машинист экскаватора",
]

DISEASE_CATEGORIES = [
    "Профессиональные заболевания органов дыхания",
    "Заболевания опорно-двигательного аппарата",
    "Снижение слуха", "Заболевания кожи",
    "Нарушения зрения", None,
]


def _random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def generate_incidents(count: int = 200) -> list[Incident]:
    incidents = []
    start = date(2020, 1, 1)
    end = date(2025, 5, 1)

    for _ in range(count):
        sev = random.choices(SEVERITIES, weights=SEVERITY_WEIGHTS, k=1)[0]
        days_map = {"Лёгкий": (1, 5), "Средний": (5, 21), "Тяжёлый": (21, 90), "Смертельный": (0, 0)}
        lo, hi = days_map[sev]
        incidents.append(
            Incident(
                date=_random_date(start, end),
                department=random.choice(DEPARTMENTS),
                incident_type=random.choice(INCIDENT_TYPES),
                severity=sev,
                days_lost=random.randint(lo, hi),
                description=f"Случай №{random.randint(1000, 9999)}",
            )
        )
    return incidents


def generate_equipment_failures(count: int = 150) -> list[EquipmentFailure]:
    failures = []
    start = date(2020, 1, 1)
    end = date(2025, 5, 1)

    for _ in range(count):
        failures.append(
            EquipmentFailure(
                date=_random_date(start, end),
                equipment_type=random.choice(EQUIPMENT_TYPES),
                equipment_name=random.choice(EQUIPMENT_NAMES),
                operating_hours=round(random.uniform(100, 10000), 1),
                downtime_hours=round(random.uniform(0.5, 72), 1),
                failure_cause=random.choice(FAILURE_CAUSES),
                repair_cost=round(random.uniform(100, 50000), 2),
            )
        )
    return failures


def generate_safety_violations(count: int = 100) -> list[SafetyViolation]:
    violations = []
    start = date(2020, 1, 1)
    end = date(2025, 5, 1)

    for _ in range(count):
        violations.append(
            SafetyViolation(
                date=_random_date(start, end),
                department=random.choice(DEPARTMENTS),
                violation_type=random.choice(VIOLATION_TYPES),
                is_audit_finding=random.random() < 0.3,
                responsible=f"Сотрудник {random.randint(1, 100)}",
            )
        )
    return violations


def generate_medical_exams(count: int = 50) -> list[MedicalExam]:
    exams = []
    start = date(2020, 1, 1)
    end = date(2025, 5, 1)

    for _ in range(count):
        cat = random.choice(DISEASE_CATEGORIES)
        exams.append(
            MedicalExam(
                date=_random_date(start, end),
                profession=random.choice(PROFESSIONS),
                department=random.choice(DEPARTMENTS),
                findings=cat if cat else "Норма",
                disease_category=cat,
            )
        )
    return exams


async def seed_database():
    from app.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        existing = (await session.execute(select(Incident).limit(1))).scalar_one_or_none()
        if existing:
            return

        session.add_all(generate_incidents(200))
        session.add_all(generate_equipment_failures(150))
        session.add_all(generate_safety_violations(100))
        session.add_all(generate_medical_exams(50))
        await session.commit()
        print("Database seeded with demo data.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_database())
