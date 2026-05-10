= ПРИЛОЖЕНИЕ Г <appendix:d>

// Фрагменты кода

#set par(first-line-indent: 0cm)

#align(center)[
  #text(14pt, weight: "bold")[Фрагменты программного кода]
]

#v(0.5cm)

== Фрагмент кода модуля автоматического FMEA-анализа (auto\_fmea.py)

#set text(size: 11pt, font: "DejaVu Sans Mono")
```python
async def auto_fmea(
    db: AsyncSession,
    department: str | None = None,
    equipment_type: str | None = None,
    analysis_name: str = "Автоматический FMEA",
) -> dict:
    MONTHS_SPAN = 64

    stmt = select(EquipmentFailure)
    if equipment_type:
        stmt = stmt.where(
            EquipmentFailure.equipment_type.contains(equipment_type)
        )
    result = await db.execute(stmt)
    failures = result.scalars().all()

    grouped = {}
    for f in failures:
        key = (f.equipment_type, f.failure_cause)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(f)

    items = []
    for (eq_type, cause), group in grouped.items():
        avg_downtime = sum(f.downtime_hours for f in group) / len(group)

        s = _severity_from_downtime(avg_downtime)
        o = _occurrence_from_frequency(len(group), MONTHS_SPAN)
        d = _detection_from_violations(
            db, cause, department
        )

        rpn = s * o * d
        items.append({
            "component": eq_type,
            "failure_mode": cause,
            "severity": s,
            "occurrence": o,
            "detection": d,
            "rpn": rpn,
        })

    items.sort(key=lambda x: x["rpn"], reverse=True)
    return {"items": items, "analysis_name": analysis_name}
```

#set text(size: 14pt, font: "Times New Roman")

== Фрагмент кода API-клиента (frontend/src/lib/api.ts)

#set text(size: 11pt, font: "DejaVu Sans Mono")
```typescript
const API_BASE = "http://localhost:8000/api";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || response.statusText);
  }
  return response.json();
}

export const api = {
  incidents: {
    list: () => request<Incident[]>("/incidents/"),
    statistics: () => request<IncidentStatistics>("/incidents/statistics"),
  },
  risk: {
    fmea: (params: string) =>
      request<FMEResult>(`/risk/fmea?${params}`),
    history: () => request<RiskAssessment[]>("/risk/history"),
  },
  statistics: {
    descriptive: (dataType: string) =>
      request<DescriptiveStats>(`/statistics/descriptive?data_type=${dataType}`),
    trend: (params: string) =>
      request<TrendResult>(`/statistics/trend?${params}`),
    poisson: (params: string) =>
      request<PoissonResult>(`/statistics/poisson?${params}`),
    dashboard: () => request<DashboardData>("/statistics/dashboard"),
  },
};
```

#set text(size: 14pt, font: "Times New Roman")

== Фрагмент кода генерации PDF-отчёта (report.py)

#set text(size: 11pt, font: "DejaVu Sans Mono")
```python
FONT_DIR = "/usr/share/fonts/TTF/"
TNR = "DejaVuSans"
TNR_B = "DejaVuSans-Bold"

pdfmetrics.registerFont(TTFont(TNR, FONT_DIR + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont(TNR_B, FONT_DIR + "DejaVuSans-Bold.ttf"))

def _body():
    return ParagraphStyle(
        "Body",
        fontName=TNR,
        fontSize=14,
        leading=21,
        alignment=TA_JUSTIFY,
        firstLineIndent=28.35,
    )

def _h1():
    return ParagraphStyle(
        "H1",
        fontName=TNR_B,
        fontSize=14,
        leading=21,
        alignment=TA_CENTER,
        spaceBefore=18,
    )

def generate_full_report(
    db_data: dict,
    descriptive: dict | None,
    trend: dict | None,
    poisson: dict | None,
    fmea: dict | None,
) -> bytes:
    elements = _build_report_elements(
        db_data, descriptive, trend, poisson, fmea
    )
    buffer = BytesIO()
    doc = _PageTracker(buffer, pagesize=A4, ...)
    doc.build(elements)
    return buffer.getvalue()
```
