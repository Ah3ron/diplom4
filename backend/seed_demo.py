import asyncio
import random
from datetime import date, timedelta

from app.database import async_session, engine, init_db
from app.models import Base
from app.models.department import Department
from app.models.incident import Incident
from app.models.equipment import EquipmentFailure
from app.models.safety import SafetyViolation
from app.models.health import MedicalExam

DEPARTMENTS = [
    ("Цех ГШО", "Цех"),
    ("Цех РМЦ", "Цех"),
    ("Лаборатория №1", "Лаборатория"),
    ("Управление производства", "Управление"),
    ("Участок ТОиР", "Участок"),
]

INCIDENT_TYPES = ["травма", "авария", "пожар", "пролив химреагентов", "обрушение"]
SEVERITIES = ["лёгкий", "средний", "тяжёлый", "смертельный"]

EQUIPMENT_TYPES = ["станок с ЧПУ", "конвейер", "насос", "компрессор", "токарный станок"]
EQUIPMENT_NAMES = [
    "DMG Mori CMX 600V", "Транспортёр ЛК-500", "Насос КМ 100-80-160",
    "Компрессор АВА ВК-40", "16К20", "Haas VF-2", "Конвейер СТ-600",
    "Насос ЦНС 180-170", "Компрессор ЗИФ-ПВ 6/1,5", "DMG Mori NLX 2500",
]
FAILURE_CAUSES = [
    "износ подшипника", "перегрев двигателя", "обрыв ремня",
    "короткое замыкание", "разрушение шестерни", "утечка масла",
    "коррозия корпуса", "деформация вала", "засор фильтра", "отказ датчика",
]

VIOLATION_TYPES = [
    "работа без СИЗ", "нарушение режимов", "допуск без обучения",
    "отсутствие ограждений", "нарушение электробезопасности",
    "работа в нетрезвом состоянии", "невыполнение наряда-допуска",
]
RESPONSIBLES = [
    "Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Козлов К.К.",
    "Морозов М.М.", "Волков В.В.", "Соколов А.А.",
]

PROFESSIONS = [
    "станочник", "слесарь-ремонтник", "электрогазосварщик", "маляр",
    "монтажник", "водитель погрузчика", "лаборант",
]
DISEASE_CATEGORIES = [
    "профессиональное заболевание", "общее заболевание",
    "без отклонений", "подозрение на профзаболевание",
]
FINDINGS = [
    "патологий не выявлено", "снижение слуха", "нарушение осанки",
    "повышенное АД", "бронхит", "конъюнктивит", "норма",
]


def rand_date(years_back: int = 5) -> date:
    end = date(2025, 5, 1)
    start = end - timedelta(days=365 * years_back)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


async def seed():
    await init_db()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await init_db()

    async with async_session() as db:
        departments = []
        for name, dtype in DEPARTMENTS:
            d = Department(name=name, type=dtype)
            db.add(d)
            departments.append(d)
        await db.flush()

        for _ in range(200):
            inc = Incident(
                date=rand_date(),
                department_id=random.choice(departments).id,
                incident_type=random.choice(INCIDENT_TYPES),
                severity=random.choices(SEVERITIES, weights=[40, 35, 20, 5])[0],
                days_lost=random.choices([0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60],
                                         weights=[30, 15, 12, 10, 8, 7, 6, 5, 3, 2, 1, 1])[0],
                description=random.choice([
                    "Травма при обслуживании оборудования",
                    "Падение на скользком покрытии",
                    "Повреждение отлетающей деталью",
                    "Ожог при работе с нагревательным оборудованием",
                    "Поражение электрическим током",
                    "",
                ]),
            )
            db.add(inc)

        for _ in range(150):
            eq = EquipmentFailure(
                date=rand_date(),
                department_id=random.choice(departments).id,
                equipment_type=random.choice(EQUIPMENT_TYPES),
                equipment_name=random.choice(EQUIPMENT_NAMES),
                operating_hours=round(random.uniform(100, 20000), 1),
                downtime_hours=round(random.uniform(0.5, 72), 1),
                failure_cause=random.choice(FAILURE_CAUSES),
                repair_cost=round(random.uniform(50, 5000), 2) if random.random() > 0.2 else None,
            )
            db.add(eq)

        for _ in range(100):
            sv = SafetyViolation(
                date=rand_date(),
                department_id=random.choice(departments).id,
                violation_type=random.choice(VIOLATION_TYPES),
                is_audit_finding=random.random() > 0.6,
                responsible=random.choice(RESPONSIBLES),
                description=random.choice([
                    "Выявлено при плановом обходе",
                    "Зафиксировано камерой видеонаблюдения",
                    "Сообщено коллегами",
                    "Обнаружено при расследовании инцидента",
                    "",
                ]),
            )
            db.add(sv)

        for _ in range(50):
            me = MedicalExam(
                date=rand_date(2),
                profession=random.choice(PROFESSIONS),
                department_id=random.choice(departments).id,
                findings=random.choice(FINDINGS),
                disease_category=random.choice(DISEASE_CATEGORIES),
                notes="",
            )
            db.add(me)

        await db.commit()

    counts = {}
    async with async_session() as db:
        from sqlalchemy import func, select
        for model, label in [
            (Department, "departments"),
            (Incident, "incidents"),
            (EquipmentFailure, "equipment_failures"),
            (SafetyViolation, "safety_violations"),
            (MedicalExam, "medical_exams"),
        ]:
            cnt = (await db.execute(select(func.count(model.id)))).scalar()
            counts[label] = cnt

    print("Demo data seeded:", counts)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
