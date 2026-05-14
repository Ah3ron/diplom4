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
const API_BASE = "http://localhost:8000/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  incidents: {
    list: () => request<Incident[]>("/incidents/"),
    statistics: () => request<IncidentStatistics>("/incidents/statistics"),
  },
  risk: {
    fmea: (params: string) =>
      request<any>(`/risk/fmea?${params}`),
    history: () => request<any[]>("/risk/history"),
  },
  statistics: {
    descriptive: (dataType: string) =>
      request<any>(`/statistics/descriptive?data_type=${dataType}`),
    trend: (params: string) =>
      request<any>(`/statistics/trend?${params}`),
    poisson: (params: string) =>
      request<any>(`/statistics/poisson?${params}`),
    dashboard: () => request<any>("/statistics/dashboard"),
  },
}
```

#set text(size: 14pt, font: "Times New Roman")

== Фрагмент кода генерации PDF-отчёта (report.py)

#set text(size: 11pt, font: "DejaVu Sans Mono")
```python
FONTS = {
    "TNR": "/usr/share/fonts/TTF/times.ttf",
    "TNR-B": "/usr/share/fonts/TTF/timesbd.ttf",
    "TNR-I": "/usr/share/fonts/TTF/timesi.ttf",
    "TNR-BI": "/usr/share/fonts/TTF/timesbi.ttf",
}

for name, path in FONTS.items():
    pdfmetrics.registerFont(TTFont(name, path))

def _body():
    return ParagraphStyle(
        "body", fontName="TNR", fontSize=14,
        leading=21, firstLineIndent=28.35, alignment=4,
    )

def _h1():
    return ParagraphStyle(
        "h1", fontName="TNR-B", fontSize=14,
        leading=21, spaceBefore=18, spaceAfter=12, alignment=1,
    )

def generate_full_report(
    db_data, descriptive, trend, poisson, fmea,
) -> bytes:
    elements = _build_report_elements(
        db_data, descriptive, trend, poisson, fmea
    )
    buffer = BytesIO()
    doc = _PageTracker(buffer, pagesize=A4, ...)
    doc.build(elements)
    return buffer.getvalue()
```
