= Концептуальная модель данных <appendix:a>

#set par(first-line-indent: 0cm)

#align(center)[
  #text(14pt, weight: "bold")[Концептуальная модель данных программного модуля оценки производственных рисков]
]

#v(1cm)

На рисунке А.1 представлена концептуальная модель данных программного модуля в виде таблицы сущностей.

#figure(
  table(
    columns: (5cm, 5cm, 5cm),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left, left, left),

    [*INCIDENT*], [*EQUIPMENT_FAILURE*], [*SAFETY_VIOLATION*],
    [id: INTEGER (PK)], [id: INTEGER (PK)], [id: INTEGER (PK)],
    [date: DATE], [date: DATE], [date: DATE],
    [department: VARCHAR], [equipment_type: VARCHAR], [department: VARCHAR],
    [incident_type: VARCHAR], [equipment_name: VARCHAR], [violation_type: VARCHAR],
    [severity: VARCHAR], [operating_hours: REAL], [is_audit_finding: BOOL],
    [days_lost: INTEGER], [downtime_hours: REAL], [responsible: VARCHAR],
    [description: TEXT], [failure_cause: VARCHAR], [],
    [], [repair_cost: REAL], [],
  ),
  caption: [Сущности «Инцидент», «Отказ оборудования», «Нарушение ТБ»],
) <fig:er_main>

#figure(
  table(
    columns: (5cm, 5cm, 5cm),
    stroke: 0.5pt,
    inset: 6pt,
    align: (left, left, left),

    [*MEDICAL_EXAM*], [*RISK_ASSESSMENT*], [*Связи между сущностями*],
    [id: INTEGER (PK)], [id: INTEGER (PK)], [INCIDENT — EQUIPMENT_FAILURE],
    [date: DATE], [method: VARCHAR], [связь по department и date],
    [profession: VARCHAR], [name: VARCHAR], [INCIDENT — SAFETY_VIOLATION],
    [department: VARCHAR], [input_params: TEXT], [связь по department],
    [findings: TEXT], [result: TEXT], [RISK_ASSESSMENT],
    [disease_category: VARCHAR], [created_at: DATETIME], [использует все сущности],
    [], [author: VARCHAR], [],
  ),
  caption: [Сущности «Медицинский осмотр», «Оценка риска», связи],
) <fig:er_additional>
