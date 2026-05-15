= UML-диаграммы программного модуля <appendix:c>

#set par(first-line-indent: 0cm)

#align(center)[
  #text(14pt, weight: "bold")[UML-диаграммы программного модуля]
]

#v(0.5cm)

== Диаграмма классов серверной части

#figure(
  rect(
    width: 100%,
    stroke: 0.5pt,
    inset: 10pt,
    {
      set text(size: 9pt, font: "Times New Roman")
      table(
        columns: (5cm, 5cm, 5cm),
        stroke: 0.5pt,
        inset: 4pt,
        align: (left, left, left),

        [*Incident*], [*EquipmentFailure*], [*SafetyViolation*],
        [– id: int], [– id: int], [– id: int],
        [– date: date], [– date: date], [– date: date],
        [– department: str], [– equipment_type: str], [– department: str],
        [– incident_type: str], [– equipment_name: str], [– violation_type: str],
        [– severity: str], [– operating_hours: float], [– is_audit_finding: bool],
        [– days_lost: int], [– downtime_hours: float], [– responsible: str],
        [– description: str], [– failure_cause: str], [],
        [], [– repair_cost: float], [],

        [*StatisticsService*], [*FMEAService*], [*ReportService*],
        [+ descriptive()], [+ auto_fmea()], [+ generate_pdf()],
        [+ trend_analysis()], [+ calculate_rpn()], [+ generate_excel()],
        [+ poisson_analysis()], [+ get_recommendations()], [],
      )
    },
  ),
  caption: [Диаграмма классов серверной части],
) <fig:appendix_class_diagram>

== Диаграмма последовательности «Проведение FMEA-анализа»

#figure(
  rect(
    width: 100%,
    stroke: 0.5pt,
    inset: 10pt,
    {
      set text(size: 10pt, font: "Times New Roman")
      table(
        columns: (3cm, 3cm, 3cm, 3cm, 3cm),
        stroke: none,
        inset: 4pt,
        align: (center, center, center, center, center),

        [*Пользователь*], [*Frontend*], [*FastAPI*], [*FMEA Service*], [*SQLite*],
        [Выбор фильтров], [], [], [], [],
        [], [GET /risk/fmea?params], [], [], [],
        [], [], [Извлечение данных], [], [SQL-запрос],
        [], [], [], [], [Результат],
        [], [], [Расчёт S, O, D], [], [],
        [], [], [RPN = S×O×D], [], [],
        [], [JSON + графики], [], [], [],
        [Отображение], [результатов], [], [], [],
      )
    },
  ),
  caption: [Диаграмма последовательности «Проведение FMEA-анализа»],
) <fig:sequence_diagram>
