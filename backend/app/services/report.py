import io
from datetime import date

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

_FONTS_REGISTERED = False


def _register_fonts():
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return
    for name, path in {
        "TNR": "/usr/share/fonts/TTF/times.ttf",
        "TNR-B": "/usr/share/fonts/TTF/timesbd.ttf",
        "TNR-I": "/usr/share/fonts/TTF/timesi.ttf",
        "TNR-BI": "/usr/share/fonts/TTF/timesbi.ttf",
    }.items():
        try:
            pdfmetrics.registerFont(TTFont(name, path))
        except Exception:
            pass
    _FONTS_REGISTERED = True


plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False

PAGE_W, PAGE_H = A4
MARGIN_LEFT = 30 * mm
MARGIN_RIGHT = 15 * mm
MARGIN_TOP = 20 * mm
MARGIN_BOTTOM = 20 * mm
FRAME_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT
FRAME_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM
INDENT = 10 * mm


def _body():
    return ParagraphStyle("body", fontName="TNR", fontSize=14, leading=21, firstLineIndent=INDENT, alignment=4)


def _h1():
    return ParagraphStyle("h1", fontName="TNR-B", fontSize=14, leading=21, spaceBefore=18, spaceAfter=12, alignment=1)


def _h2():
    return ParagraphStyle("h2", fontName="TNR-BI", fontSize=14, leading=21, spaceBefore=14, spaceAfter=8, alignment=4)


def _center():
    return ParagraphStyle("center", fontName="TNR", fontSize=14, leading=21, alignment=1)


def _center_b():
    return ParagraphStyle("center_b", fontName="TNR-B", fontSize=14, leading=21, alignment=1)


def _title():
    return ParagraphStyle("title", fontName="TNR-B", fontSize=16, leading=22, alignment=1, spaceBefore=24, spaceAfter=8)


def _caption():
    return ParagraphStyle("caption", fontName="TNR", fontSize=14, leading=21, alignment=1, spaceBefore=6, spaceAfter=10)


def _tbl_style():
    return TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "TNR"),
        ("FONTNAME", (0, 0), (-1, 0), "TNR-B"),
        ("FONTSIZE", (0, 0), (-1, -1), 14),
        ("LEADING", (0, 0), (-1, -1), 21),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ALIGN", (0, 1), (0, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ])


def _fig_to_bytes(fig, dpi=150):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()


def _gray_barh(data: dict, xlabel: str, title: str) -> bytes:
    if not data:
        return b""
    fig, ax = plt.subplots(figsize=(6.5, 3))
    names = list(data.keys())
    vals = list(data.values())
    bar_colors = ["#3b82f6", "#60a5fa", "#2563eb", "#1d4ed8", "#93c5fd", "#1e40af", "#bfdbfe"]
    bars = ax.barh(names, vals, color=[bar_colors[i % len(bar_colors)] for i in range(len(names))], edgecolor="#1e3a5f")
    ax.set_xlabel(xlabel, fontsize=9)
    for b, v in zip(bars, vals):
        ax.text(b.get_width() + 0.2, b.get_y() + b.get_height() / 2, str(v), va="center", fontsize=8)
    ax.tick_params(axis="y", labelsize=8)
    ax.tick_params(axis="x", labelsize=8)
    plt.tight_layout()
    return _fig_to_bytes(fig)


def _gray_pie(data: dict, labels_map: dict | None = None) -> bytes:
    if not data:
        return b""
    fig, ax = plt.subplots(figsize=(5, 3))
    labels = list(data.keys())
    sizes = list(data.values())
    pie_colors = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]
    clrs = [pie_colors[i % len(pie_colors)] for i in range(len(labels))]
    wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=clrs, autopct="%1.1f%%", startangle=90)
    for t in texts:
        t.set_fontsize(9)
    for t in autotexts:
        t.set_fontsize(8)
    plt.tight_layout()
    return _fig_to_bytes(fig)


def _gray_trend(points: list, forecast_labels: list, forecast_values: list, forecast_lower: list, forecast_upper: list) -> bytes:
    if not points:
        return b""
    fig, ax = plt.subplots(figsize=(6.5, 3))
    labels = [p["period"] for p in points]
    values = [p["count"] for p in points]
    trend_vals = [p.get("trend_value") for p in points]
    ax.plot(labels, values, marker="o", linewidth=1.2, color="#3b82f6", markersize=3, label="Факт")
    if any(v is not None for v in trend_vals):
        ax.plot(labels, trend_vals, linewidth=1.2, color="#ef4444", linestyle="--", label="Тренд")
    if forecast_labels and forecast_values:
        ax.plot([labels[-1], forecast_labels[0]], [values[-1], forecast_values[0]], color="#8b5cf6", linestyle=":", linewidth=1)
        ax.plot(forecast_labels, forecast_values, marker="s", linewidth=1.2, color="#8b5cf6", linestyle="--", markersize=2, label="Прогноз")
        if forecast_lower and forecast_upper:
            ax.fill_between(forecast_labels, forecast_lower, forecast_upper, alpha=0.2, color="#8b5cf6", label="95% ДИ")
    ax.set_ylabel("Количество", fontsize=9)
    ax.legend(fontsize=7)
    step = max(1, len(labels) // 10)
    ax.set_xticks(labels[::step])
    ax.tick_params(axis="x", rotation=45, labelsize=7)
    plt.tight_layout()
    return _fig_to_bytes(fig)


def _gray_poisson(dist: list, lam: float) -> bytes:
    if not dist:
        return b""
    fig, ax = plt.subplots(figsize=(6, 3))
    ks = [d["k"] for d in dist]
    probs = [d["probability"] for d in dist]
    bar_colors = ["#3b82f6" if p < 0.15 else "#60a5fa" if p < 0.3 else "#93c5fd" for p in probs]
    ax.bar(ks, probs, color=bar_colors, edgecolor="#1e3a5f")
    ax.set_xlabel("k", fontsize=9)
    ax.set_ylabel("P(X=k)", fontsize=9)
    ax.tick_params(labelsize=8)
    plt.tight_layout()
    return _fig_to_bytes(fig)


def _gray_fmea(items: list) -> bytes:
    if not items:
        return b""
    sorted_items = sorted(items, key=lambda x: x.get("rpn", 0), reverse=True)[:12]
    fig, ax = plt.subplots(figsize=(6, max(2.5, len(sorted_items) * 0.4)))
    modes = [i.get("failure_mode", "")[:35] for i in sorted_items]
    rpns = [i.get("rpn", 0) for i in sorted_items]
    bar_colors = []
    for rpn in rpns:
        if rpn >= 200:
            bar_colors.append("#ef4444")
        elif rpn >= 100:
            bar_colors.append("#f97316")
        elif rpn >= 50:
            bar_colors.append("#f59e0b")
        else:
            bar_colors.append("#22c55e")
    bars = ax.barh(modes, rpns, color=bar_colors, edgecolor="#1e3a5f")
    ax.set_xlabel("RPN", fontsize=9)
    for b, r in zip(bars, rpns):
        ax.text(b.get_width() + 1, b.get_y() + b.get_height() / 2, str(r), va="center", fontsize=7)
    ax.tick_params(axis="y", labelsize=7)
    plt.tight_layout()
    return _fig_to_bytes(fig)


_img_n = 0
_tbl_n = 0


def _next_img():
    global _img_n
    _img_n += 1
    return _img_n


def _next_tbl():
    global _tbl_n
    _tbl_n += 1
    return _tbl_n


def _img(el, data: bytes, caption: str):
    if not data:
        return
    n = _next_img()
    buf = io.BytesIO(data)
    img = Image(buf, width=140 * mm, height=65 * mm)
    img.hAlign = "CENTER"
    el.append(img)
    el.append(Paragraph(f"Рисунок {n} — {caption}", _caption()))


def _title_page(el, data_type: str):
    el.append(Spacer(1, 40 * mm))
    el.append(Paragraph("ЗАО «СОЛИГОРСКИЙ ИНСТИТУТ ПРОБЛЕМ", _center_b()))
    el.append(Paragraph("РЕСУРСОСБЕРЕЖЕНИЯ С ОПЫТНЫМ ПРОИЗВОДСТВОМ»", _center_b()))
    el.append(Spacer(1, 25 * mm))
    el.append(Paragraph("ПРОГРАММНЫЙ МОДУЛЬ ОЦЕНКИ", _title()))
    el.append(Paragraph("ПРОИЗВОДСТВЕННЫХ РИСКОВ", _title()))
    el.append(Spacer(1, 8 * mm))
    data_label = {"incidents": "ПРОИЗВОДСТВЕННОМУ ТРАВМАТИЗМУ", "equipment": "ОТКАЗАМ ОБОРУДОВАНИЯ", "safety": "НАРУШЕНИЯМ ТРЕБОВАНИЙ ОХРАНЫ ТРУДА"}.get(data_type, "ПРОИЗВОДСТВЕННЫМ ДАННЫМ")
    el.append(Paragraph(f"КОМПЛЕКСНЫЙ ОТЧЁТ ПО {data_label}", _center()))
    el.append(Spacer(1, 50 * mm))
    el.append(Paragraph(f"Дата формирования: {date.today().strftime('%d.%m.%Y')}", _center()))
    el.append(Spacer(1, 8 * mm))
    el.append(Paragraph("г. Солигорск", _center()))
    el.append(NextPageTemplate("content"))
    el.append(PageBreak())


def _toc(el, page_map: dict[str, int] | None = None):
    toc_title_style = ParagraphStyle("h1_toc", fontName="TNR-B", fontSize=14, leading=21, alignment=1, spaceBefore=0, spaceAfter=12)

    el.append(Paragraph("СОДЕРЖАНИЕ", toc_title_style))
    el.append(Spacer(1, 4 * mm))

    sections = [
        "ВВЕДЕНИЕ",
        "1  ОБЩАЯ СВОДКА ПО ПРОИЗВОДСТВЕННОЙ БЕЗОПАСНОСТИ",
        "2  ОПИСАТЕЛЬНАЯ СТАТИСТИКА",
        "3  ТРЕНД-АНАЛИЗ И ПРОГНОЗИРОВАНИЕ",
        "4  АНАЛИЗ ПУАССОНА",
        "5  FMEA-АНАЛИЗ ОТКАЗОВ ОБОРУДОВАНИЯ",
        "ЗАКЛЮЧЕНИЕ",
        "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ",
    ]

    display_names = [
        "Введение",
        "1  Общая сводка по производственной безопасности",
        "2  Описательная статистика",
        "3  Тренд-анализ и прогнозирование",
        "4  Анализ Пуассона",
        "5  FMEA-анализ отказов оборудования",
        "Заключение",
        "Список использованных источников",
    ]

    default_pages = [3, 4, 5, 7, 9, 11, 13, 14]

    toc_entry_style = ParagraphStyle("toc_entry", fontName="TNR", fontSize=14, leading=21, alignment=4)
    toc_pg_style = ParagraphStyle("toc_pg", fontName="TNR", fontSize=14, leading=21, alignment=2)

    for i, (title, display) in enumerate(zip(sections, display_names)):
        page = default_pages[i]
        if page_map:
            for key, pg in page_map.items():
                if key.strip() == title.strip():
                    page = pg
                    break

        row = [[Paragraph(display, toc_entry_style), Paragraph(str(page), toc_pg_style)]]
        t = Table(row, colWidths=[FRAME_W * 0.85, FRAME_W * 0.15])
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "TNR"),
            ("FONTSIZE", (0, 0), (-1, -1), 14),
            ("LEADING", (0, 0), (-1, -1), 21),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        el.append(t)

    el.append(PageBreak())


class _PageTracker(BaseDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.heading_pages: dict[str, int] = {}

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and hasattr(flowable, "style"):
            if flowable.style.name == "h1":
                text = flowable.getPlainText()
                self.heading_pages[text] = self.page + 1


def _page_footer(canvas, doc):
    canvas.saveState()
    pn = canvas.getPageNumber()
    if pn > 2:
        canvas.setFont("TNR", 14)
        canvas.drawRightString(PAGE_W - MARGIN_RIGHT, MARGIN_BOTTOM - 10 * mm, str(pn - 2))
    canvas.restoreState()


def _build_report_elements(data_type, dashboard, descriptive, trend_data, poisson_data, fmea_data, page_map=None, skip_toc=False):
    global _img_n, _tbl_n
    el = []
    cw = [FRAME_W * 0.7, FRAME_W * 0.3]

    _title_page(el, data_type)
    if skip_toc:
        el.append(Paragraph("СОДЕРЖАНИЕ", _h1()))
        el.append(Spacer(1, 6 * mm))
        for _ in range(8):
            el.append(Paragraph("", _body()))
        el.append(PageBreak())
    else:
        _toc(el, page_map)

    # ВВЕДЕНИЕ
    el.append(Paragraph("ВВЕДЕНИЕ", _h1()))
    el.append(Paragraph(
        "Оценка производственных рисков является обязательным элементом системы управления "
        "охраной труда в соответствии с требованиями СТБ ISO 45001-2020 [1, с. 12]. "
        "ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством» (СИПР) "
        "осуществляет проектирование и производство горно-шахтного оборудования для "
        "ОАО «Беларуськалий», что обусловливает наличие значительного уровня производственных рисков [2, с. 45].",
        _body(),
    ))
    el.append(Paragraph(
        "Настоящий отчёт подготовлен с использованием программного модуля оценки "
        "производственных рисков на основе статистических моделей. Целью отчёта является "
        "комплексная оценка уровня производственной безопасности организации на основании "
        "фактических данных за анализируемый период.",
        _body(),
    ))
    el.append(Paragraph(
        "В отчёте применены следующие методы анализа: описательная статистика, линейный "
        "тренд-анализ с прогнозом и оценкой значимости (p-value), распределение Пуассона "
        "для моделирования частоты неблагоприятных событий с проверкой адекватности "
        "по критерию \u03c7\u00b2, а также метод FMEA (анализ видов и последствий отказов) "
        "с автоматическим расчётом показателя приоритетности риска (RPN) и "
        "бутстрэп-оценкой доверительных интервалов [3, с. 78].",
        _body(),
    ))
    el.append(PageBreak())

    # РАЗДЕЛ 1
    el.append(Paragraph("1  ОБЩАЯ СВОДКА ПО ПРОИЗВОДСТВЕННОЙ БЕЗОПАСНОСТИ", _h1()))
    el.append(Paragraph(
        "В настоящем разделе представлены сводные данные о состоянии производственной "
        "безопасности ЗАО «СИПР». Показатели включают сведения о несчастных случаях, "
        "отказах оборудования и нарушениях требований охраны труда, зарегистрированных "
        "за анализируемый период.",
        _body(),
    ))
    el.append(Paragraph(
        "Мониторинг данных показателей соответствует требованиям статьи 17 Закона "
        "Республики Беларусь «Об охране труда» [4, с. 8] и позволяет выявить наиболее "
        "проблемные участки производства для последующего углублённого анализа.",
        _body(),
    ))
    el.append(Spacer(1, 4 * mm))
    tn = _next_tbl()
    el.append(Paragraph(f"Таблица {tn} — Сводные показатели производственной безопасности", _caption()))
    cw = [FRAME_W * 0.7, FRAME_W * 0.3]
    t = Table([
        ["Показатель", "Значение"],
        ["Количество несчастных случаев", str(dashboard.get("total_incidents", 0))],
        ["Количество отказов оборудования", str(dashboard.get("total_equipment_failures", 0))],
        ["Количество нарушений требований ОТ", str(dashboard.get("total_safety_violations", 0))],
    ], colWidths=cw)
    t.setStyle(_tbl_style())
    el.append(t)
    el.append(Spacer(1, 6 * mm))

    el.append(Paragraph(
        "На рисунках 1 и 2 представлены графические распределения несчастных случаев "
        "по подразделениям организации и по степени тяжести соответственно. Анализ "
        "распределения позволяет определить подразделения с наибольшим уровнем риска "
        "и целенаправленно планировать профилактические мероприятия [5, с. 34].",
        _body(),
    ))
    el.append(Spacer(1, 4 * mm))
    _img(el, _gray_barh(dashboard.get("incidents_by_department", {}), "Количество", ""), "Распределение несчастных случаев по подразделениям")
    _img(el, _gray_pie(dashboard.get("incidents_by_severity", {})), "Распределение несчастных случаев по степени тяжести")
    el.append(PageBreak())

    # РАЗДЕЛ 2
    el.append(Paragraph("2  ОПИСАТЕЛЬНАЯ СТАТИСТИКА", _h1()))
    el.append(Paragraph(
        "Описательная статистика позволяет получить обобщённую количественную характеристику "
        "исследуемой совокупности данных [6, с. 56]. Для анализа рассчитываются следующие "
        "показатели: среднее арифметическое, стандартное отклонение, медиана, а также "
        "нижний (Q1) и верхний (Q3) квартили.",
        _body(),
    ))
    el.append(Paragraph(
        "Среднее арифметическое характеризует типичное значение признака в выборке. "
        "Стандартное отклонение отражает степень разброса данных относительно среднего. "
        "Медиана представляет собой значение, делящее упорядоченную совокупность на две "
        "равные части, и является более устойчивой характеристикой по сравнению со средним "
        "при наличии выбросов [6, с. 62].",
        _body(),
    ))

    if descriptive and "error" not in descriptive:
        el.append(Spacer(1, 4 * mm))
        tn = _next_tbl()
        el.append(Paragraph(f"Таблица {tn} — Описательная статистика анализируемого показателя", _caption()))
        rows = [
            ["Показатель", "Значение"],
            ["Объём выборки (n)", str(descriptive.get("count", 0))],
            ["Среднее арифметическое (x\u0305)", f"{descriptive.get('mean', 0):.2f}"],
            ["Стандартное отклонение (\u03c3)", f"{descriptive.get('std', 0):.2f}"],
            ["Минимум", f"{descriptive.get('min', 0):.2f}"],
            ["Медиана (Me)", f"{descriptive.get('median', 0):.2f}"],
            ["Максимум", f"{descriptive.get('max', 0):.2f}"],
            ["Нижний квартиль (Q1)", f"{descriptive.get('q25', 0):.2f}"],
            ["Верхний квартиль (Q3)", f"{descriptive.get('q75', 0):.2f}"],
        ]
        t = Table(rows, colWidths=cw)
        t.setStyle(_tbl_style())
        el.append(t)
        el.append(Spacer(1, 6 * mm))

        mean_val = descriptive.get("mean", 0)
        std_val = descriptive.get("std", 0)
        cv = (std_val / mean_val * 100) if mean_val > 0 else 0
        el.append(Paragraph(
            f"Коэффициент вариации составляет {cv:.1f}%, что свидетельствует о "
            f"{'высокой' if cv > 35 else 'умеренной' if cv > 20 else 'слабой'} "
            f"степени вариации признака в выборке [6, с. 68].",
            _body(),
        ))
    else:
        el.append(Paragraph("Недостаточно данных для расчёта описательной статистики.", _body()))
    el.append(PageBreak())

    # РАЗДЕЛ 3
    el.append(Paragraph("3  ТРЕНД-АНАЛИЗ И ПРОГНОЗИРОВАНИЕ", _h1()))
    el.append(Paragraph(
        "Тренд-анализ позволяет выявить основную тенденцию изменения показателя во времени "
        "и построить прогноз на будущие периоды [7, с. 112]. В настоящем исследовании "
        "применяется метод линейной регрессии, при котором модель описывается уравнением "
        "y = \u03b2x + \u03b1, где \u03b2 — наклон линии тренда, \u03b1 — свободный член.",
        _body(),
    ))
    el.append(Paragraph(
        "Качество модели оценивается с помощью коэффициента детерминации R\u00b2, "
        "принимающего значения от 0 до 1. Чем ближе значение R\u00b2 к единице, тем "
        "лучше модель описывает исходные данные [7, с. 118]. Статистическая значимость "
        "тренда оценивается по p-value: если p < 0,05, тенденция признаётся статистически "
        "значимой. Для оценки неопределённости "
        "прогноза рассчитывается 95%-ный доверительный интервал на основе t-распределения "
        "Стьюдента. Дополнительно применяется скользящее среднее (окно 3) для "
        "сглаживания краткосрочных колебаний.",
        _body(),
    ))

    if trend_data and "error" not in trend_data:
        direction_map = {"increasing": "Растущий", "decreasing": "Нисходящий", "stable": "Стабильный"}
        direction = direction_map.get(trend_data.get("direction", ""), trend_data.get("direction", ""))
        r2 = trend_data.get("r_squared", 0)
        slope = trend_data.get("slope", 0)

        el.append(Spacer(1, 4 * mm))
        tn = _next_tbl()
        el.append(Paragraph(f"Таблица {tn} — Параметры тренд-модели", _caption()))
        trend_rows = [
            ["Параметр", "Значение"],
            ["Направление тренда", direction],
            ["Уравнение регрессии", f"y = {slope:.4f}x + {trend_data.get('intercept', 0):.4f}"],
            ["Коэффициент детерминации (R\u00b2)", f"{r2:.4f}"],
            ["p-value", f"{trend_data.get('p_value', 0):.6f}"],
            ["Статистическая значимость", "Значим (p < 0,05)" if trend_data.get("p_value", 1) < 0.05 else "Не значим (p \u2265 0,05)"],
            ["Количество периодов прогноза", str(len(trend_data.get("forecast_values", [])))],
        ]
        t = Table(trend_rows, colWidths=cw)
        t.setStyle(_tbl_style())
        el.append(t)
        el.append(Spacer(1, 6 * mm))

        quality = "высокое" if r2 > 0.7 else "удовлетворительное" if r2 > 0.4 else "низкое"
        el.append(Paragraph(
            f"Результаты тренд-анализа свидетельствуют о {direction.lower()} характере "
            f"изменения показателя. Качество модели {quality} (R\u00b2 = {r2:.4f}). "
            f"{'Полученная тенденция требует внимания со стороны службы охраны труда.' if direction == 'Растущий' else 'Тенденция свидетельствует об эффективности принятых мер безопасности.' if direction == 'Нисходящий' else 'Показатель стабилен, что характеризует устойчивый уровень безопасности.'}",
            _body(),
        ))
        el.append(Spacer(1, 4 * mm))
        _img(el, _gray_trend(
            trend_data.get("data", []),
            trend_data.get("forecast_labels", []),
            trend_data.get("forecast_values", []),
            trend_data.get("forecast_lower", []),
            trend_data.get("forecast_upper", []),
        ), "Тренд-анализ с линейным прогнозом и 95% доверительным интервалом")

        fl = trend_data.get("forecast_labels", [])
        fv = trend_data.get("forecast_values", [])
        flo = trend_data.get("forecast_lower", [])
        fu = trend_data.get("forecast_upper", [])
        if fl and fv:
            el.append(Spacer(1, 4 * mm))
            tn = _next_tbl()
            el.append(Paragraph(f"Таблица {tn} — Прогнозные значения с 95% доверительным интервалом", _caption()))
            fc = [["Период", "Прогноз", "Нижняя граница", "Верхняя граница"]]
            for l, v, lo, hi in zip(fl, fv, flo, fu):
                fc.append([l, f"{v:.2f}", f"{lo:.2f}", f"{hi:.2f}"])
            t = Table(fc, colWidths=[FRAME_W * 0.25] * 4)
            t.setStyle(_tbl_style())
            el.append(t)
            el.append(Spacer(1, 6 * mm))
            el.append(Paragraph(
                "Доверительный интервал расширяется с увеличением горизонта прогнозирования, "
                "что отражает нарастающую неопределённость. Рекомендуется использовать прогноз "
                "на 3–6 периодов для обеспечения приемлемой точности [7, с. 125].",
                _body(),
            ))
    else:
        el.append(Paragraph("Недостаточно данных для проведения тренд-анализа.", _body()))
    el.append(PageBreak())

    # РАЗДЕЛ 4
    el.append(Paragraph("4  АНАЛИЗ ПУАССОНА", _h1()))
    el.append(Paragraph(
        "Распределение Пуассона является одной из основных вероятностных моделей, "
        "применяемых для описания частоты редких случайных событий [8, с. 89]. "
        "Модель основана на единственном параметре \u03bb (лямбда), который представляет "
        "собой среднее число событий за единицу времени.",
        _body(),
    ))
    el.append(Paragraph(
        "Вероятность наступления ровно k событий за указанный период определяется "
        "формулой P(X = k) = (\u03bb^k \u00b7 e^(-\u03bb)) / k!. Данная модель "
        "эффективно применяется для оценки вероятности наступления несчастных случаев, "
        "отказов оборудования и иных неблагоприятных событий производственного характера "
        "[8, с. 93].",
        _body(),
    ))
    el.append(Paragraph(
        "Оценка параметра \u03bb производится по фактическим данным как среднее арифметическое "
        "числа событий за каждый период наблюдения. Для проверки адекватности модели Пуассона "
        "применяется критерий согласия \u03c7\u00b2 (хи-квадрат) Пирсона: если p > 0,05, "
        "распределение Пуассона согласуется с наблюдаемыми данными [8, с. 102]. "
        "Для оценки точности рассчитывается "
        "95%-ный доверительный интервал.",
        _body(),
    ))

    if poisson_data and "error" not in poisson_data:
        lam = poisson_data.get("lambda", 0)
        unit = poisson_data.get("period_unit", "период")
        total = poisson_data.get("total_events", 0)
        n_periods = poisson_data.get("num_periods", 0)
        p_zero = poisson_data.get("prob_zero", 0)
        p_one = poisson_data.get("prob_at_least_one", 0)
        expected = poisson_data.get("expected_in_period", 0)
        ci = poisson_data.get("confidence_interval", [0, 0])
        gof = poisson_data.get("goodness_of_fit", {})

        el.append(Spacer(1, 4 * mm))
        tn = _next_tbl()
        el.append(Paragraph(f"Таблица {tn} — Результаты анализа Пуассона", _caption()))
        poisson_rows = [
            ["Показатель", "Значение"],
            ["Интенсивность (\u03bb)", f"{lam:.4f}"],
            ["Единица периода", unit],
            ["Общее число событий", str(total)],
            ["Число периодов наблюдения", str(n_periods)],
            ["P(X = 0)", f"{p_zero:.4f}"],
            ["P(X \u2265 1)", f"{p_one:.4f}"],
            ["Ожидаемое число событий за период", f"{expected:.2f}"],
            ["95% доверительный интервал", f"[{ci[0]:.2f}; {ci[1]:.2f}]"],
        ]
        if gof.get("chi2_statistic") is not None:
            poisson_rows.append(["\u03c7\u00b2 статистика", f"{gof['chi2_statistic']:.4f}"])
            poisson_rows.append(["Число степеней свободы", str(gof.get("degrees_of_freedom", ""))])
            poisson_rows.append(["p-value (\u03c7\u00b2)", f"{gof.get('p_value', 0):.6f}"])
            gof_conclusion = "Модель адекватна (p > 0,05)" if gof.get("p_value", 0) > 0.05 else "Модель НЕ адекватна (p \u2264 0,05)"
            poisson_rows.append(["Заключение по \u03c7\u00b2", gof_conclusion])
        t = Table(poisson_rows, colWidths=cw)
        t.setStyle(_tbl_style())
        el.append(t)
        el.append(Spacer(1, 6 * mm))

        el.append(Paragraph(
            f"Оценённый параметр интенсивности \u03bb = {lam:.4f} событий на {unit} "
            f"показывает, что в среднем за каждый период наблюдения происходит "
            f"{lam:.2f} неблагоприятных событий. Вероятность отсутствия событий "
            f"в течение одного периода составляет {p_zero:.2%}, тогда как вероятность "
            f"наступления хотя бы одного события — {p_one:.2%} [8, с. 96].",
            _body(),
        ))
        el.append(Spacer(1, 4 * mm))
        _img(el, _gray_poisson(poisson_data.get("distribution", []), lam), f"Распределение Пуассона (\u03bb = {lam:.2f})")
    else:
        el.append(Paragraph("Недостаточно данных для проведения анализа Пуассона.", _body()))
    el.append(PageBreak())

    # РАЗДЕЛ 5
    el.append(Paragraph("5  FMEA-АНАЛИЗ ОТКАЗОВ ОБОРУДОВАНИЯ", _h1()))
    el.append(Paragraph(
        "Метод FMEA (Failure Mode and Effects Analysis — анализ видов и последствий "
        "отказов) представляет собой систематический подход к идентификации потенциальных "
        "отказов, оценке их последствий и определению приоритетных мер по снижению риска [3, с. 82]. "
        "Метод стандартизирован в соответствии с ГОСТ Р 51901.1-2002 (IEC 60812) [9].",
        _body(),
    ))
    el.append(Paragraph(
        "Для каждого вида отказа рассчитывается показатель приоритетности риска "
        "(RPN — Risk Priority Number) как произведение трёх факторов: "
        "S (Severity — тяжесть последствий, 1–10), O (Occurrence — вероятность возникновения, 1–10), "
        "D (Detection — вероятность необнаружения, 1–10). RPN = S \u00d7 O \u00d7 D, "
        "диапазон значений от 1 до 1000 [3, с. 85].",
        _body(),
    ))
    el.append(Paragraph(
        "В настоящем отчёте значения S, O и D определяются автоматически на основании "
        "статистических данных: S — по средней продолжительности простоя и тяжести связанных "
        "инцидентов, O — по частоте отказов, D — по соотношению нарушений и результатов аудитов. "
        "Для оценки неопределённости RPN применяется бутстрэп-метод (1000 итераций, "
        "варьирование S/O/D на \u00b11 по шкале) с расчётом 95%-ного доверительного интервала "
        "(2,5-й и 97,5-й перцентили).",
        _body(),
    ))

    if fmea_data and fmea_data.get("items"):
        source = fmea_data.get("source_stats", {})
        avg_rpn = fmea_data.get("avg_rpn", 0)
        total_risk = fmea_data.get("total_risk", 0)
        high_risk = fmea_data.get("high_risk_count", 0)

        if source:
            el.append(Spacer(1, 4 * mm))
            tn = _next_tbl()
            el.append(Paragraph(f"Таблица {tn} — Источники данных для FMEA-анализа", _caption()))
            t = Table([
                ["Источник данных", "Количество записей"],
                ["Отказы оборудования", str(source.get("total_failures", 0))],
                ["Несчастные случаи", str(source.get("total_incidents", 0))],
                ["Нарушения требований ОТ", str(source.get("total_violations", 0))],
                ["Период наблюдения, мес.", str(source.get("period_months", 0))],
            ], colWidths=cw)
            t.setStyle(_tbl_style())
            el.append(t)
            el.append(Spacer(1, 6 * mm))

        tn = _next_tbl()
        el.append(Paragraph(f"Таблица {tn} — Сводные показатели FMEA-анализа", _caption()))
        t = Table([
            ["Показатель", "Значение"],
            ["Средний RPN", f"{avg_rpn:.1f}"],
            ["Суммарный уровень риска", str(total_risk)],
            ["Количество высокорисковых элементов (RPN \u2265 100)", str(high_risk)],
        ], colWidths=cw)
        t.setStyle(_tbl_style())
        el.append(t)
        el.append(Spacer(1, 6 * mm))

        risk_level = "критический" if avg_rpn >= 200 else "высокий" if avg_rpn >= 100 else "средний" if avg_rpn >= 50 else "низкий"
        el.append(Paragraph(
            f"Среднее значение RPN составляет {avg_rpn:.1f}, что соответствует "
            f"{risk_level} уровню риска. Выявлено {high_risk} элементов с RPN \u2265 100, "
            f"требующих первоочередного внимания [3, с. 90].",
            _body(),
        ))
        el.append(Spacer(1, 4 * mm))
        _img(el, _gray_fmea(fmea_data.get("items", [])), "Ранжирование видов отказов по показателю RPN")

        items = fmea_data.get("items", [])
        el.append(Spacer(1, 4 * mm))
        tn = _next_tbl()
        el.append(Paragraph(f"Таблица {tn} — Результаты FMEA-анализа", _caption()))
        cell_style = ParagraphStyle("cell", fontName="TNR", fontSize=10, leading=14, alignment=0)
        cell_center = ParagraphStyle("cell_c", fontName="TNR", fontSize=10, leading=14, alignment=1)
        header_style = ParagraphStyle("hdr", fontName="TNR-B", fontSize=10, leading=14, alignment=1)
        fmea_t = [
            [
                Paragraph("\u2116", header_style),
                Paragraph("Вид отказа", header_style),
                Paragraph("S", header_style),
                Paragraph("O", header_style),
                Paragraph("D", header_style),
                Paragraph("RPN", header_style),
                Paragraph("RPN 95% ДИ", header_style),
                Paragraph("Приоритет", header_style),
            ]
        ]
        for item in sorted(items, key=lambda x: x.get("rpn", 0), reverse=True)[:20]:
            rpn_low = item.get("rpn_low", 0)
            rpn_high = item.get("rpn_high", 0)
            ci_str = f"[{rpn_low}; {rpn_high}]" if rpn_low or rpn_high else "\u2014"
            fmea_t.append([
                Paragraph(str(item.get("id", "")), cell_center),
                Paragraph(str(item.get("failure_mode", "")), cell_style),
                Paragraph(str(item.get("severity", "")), cell_center),
                Paragraph(str(item.get("occurrence", "")), cell_center),
                Paragraph(str(item.get("detection", "")), cell_center),
                Paragraph(str(item.get("rpn", "")), cell_center),
                Paragraph(ci_str, cell_center),
                Paragraph(str(item.get("action_priority", "")), cell_center),
            ])
        cw2 = [FRAME_W * 0.04, FRAME_W * 0.30, FRAME_W * 0.06, FRAME_W * 0.06, FRAME_W * 0.06, FRAME_W * 0.08, FRAME_W * 0.14, FRAME_W * 0.14]
        t = Table(fmea_t, colWidths=cw2)
        t.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, -1), "TNR"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("LEADING", (0, 0), (-1, -1), 14),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.75, colors.black),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ]))
        el.append(t)

        recs = fmea_data.get("recommendations", [])
        if recs:
            el.append(Spacer(1, 6 * mm))
            el.append(Paragraph("Рекомендации по снижению риска", _h2()))
            for r in recs:
                el.append(Paragraph(r, _body()))
    else:
        el.append(Paragraph("Недостаточно данных для проведения FMEA-анализа.", _body()))
    el.append(PageBreak())

    # ЗАКЛЮЧЕНИЕ
    el.append(Paragraph("ЗАКЛЮЧЕНИЕ", _h1()))
    total_inc = dashboard.get("total_incidents", 0)
    total_eq = dashboard.get("total_equipment_failures", 0)
    total_sv = dashboard.get("total_safety_violations", 0)
    el.append(Paragraph(
        f"На основании проведённого комплексного анализа производственных рисков ЗАО «СИПР» "
        f"за анализируемый период установлено следующее. Зарегистрировано {total_inc} несчастных "
        f"случаев, {total_eq} отказов оборудования и {total_sv} нарушений требований охраны труда.",
        _body(),
    ))
    el.append(Paragraph(
        "Применённые статистические методы (описательная статистика, тренд-анализ "
        "с оценкой значимости, распределение Пуассона с критерием согласия \u03c7\u00b2, "
        "FMEA с бутстрэп-интервалами) позволили получить количественную оценку уровня "
        "производственных рисков и выявить наиболее критичные виды отказов оборудования.",
        _body(),
    ))
    el.append(Paragraph(
        "Результаты анализа рекомендуется использовать при планировании мероприятий "
        "по улучшению условий труда, обновлении оборудования и повышении эффективности "
        "системы управления охраной труда в соответствии с требованиями "
        "СТБ ISO 45001-2020 [1, с. 18].",
        _body(),
    ))
    el.append(PageBreak())

    # СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ
    el.append(Paragraph("СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ", _h1()))
    refs = [
        "СТБ ISO 45001-2020. Системы управления охраной труда. Требования и руководство по применению. — Минск: Госстандарт, 2020. — 46 с.",
        "Беларуськалий: история, современность, перспективы / под ред. А.Н. Курочкина. — Минск: Беларусь, 2019. — 320 с.",
        "ГОСТ Р 51901.1-2002 (IEC 60812:2006). Менеджмент риска. Анализ отказов и последствий (FMEA). — М.: Стандартинформ, 2002. — 56 с.",
        "Закон Республики Беларусь от 23 июня 2008 г. № 356-З «Об охране труда».",
        "СО 153-34.03.603-2003. Инструкция по расследованию и учёту несчастных случаев на производстве. — М., 2003. — 48 с.",
        "Елисеева, И.И. Общая теория статистики / И.И. Елисеева, М.М. Юзбашев. — М.: Финансы и статистика, 2004. — 656 с.",
        "Кремер, Н.Ш. Теория вероятностей и математическая статистика / Н.Ш. Кремер. — М.: ЮНИТИ-ДАНА, 2012. — 551 с.",
        "Вентцель, Е.С. Теория вероятностей / Е.С. Вентцель. — М.: Высшая школа, 2006. — 576 с.",
        "ГОСТ Р 51901.1-2002 (МЭК 60812:2006). Менеджмент риска. Анализ видов и последствий отказов. — М.: Стандартинформ, 2002.",
    ]
    for i, ref in enumerate(refs, 1):
        el.append(Paragraph(f"{i}. {ref}", _body()))

    return el


def generate_full_report_pdf(
    dashboard: dict,
    fmea_data: dict,
    descriptive: dict,
    trend_data: dict,
    poisson_data: dict,
    data_type: str = "incidents",
) -> bytes:
    global _img_n, _tbl_n
    _register_fonts()

    def _make_doc(buf):
        title_frame = Frame(MARGIN_LEFT, MARGIN_BOTTOM, FRAME_W, FRAME_H, id="tf")
        content_frame = Frame(MARGIN_LEFT, MARGIN_BOTTOM, FRAME_W, FRAME_H, id="cf")
        doc = _PageTracker(buf, pagesize=A4, leftMargin=MARGIN_LEFT, rightMargin=MARGIN_RIGHT, topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM)
        doc.addPageTemplates([
            PageTemplate(id="title", frames=[title_frame], onPage=lambda c, d: None),
            PageTemplate(id="content", frames=[content_frame], onPage=_page_footer),
        ])
        return doc

    _img_n = 0
    _tbl_n = 0
    pass1_buf = io.BytesIO()
    doc1 = _make_doc(pass1_buf)
    el1 = _build_report_elements(data_type, dashboard, descriptive, trend_data, poisson_data, fmea_data, skip_toc=True)
    doc1.build(el1)
    heading_pages = doc1.heading_pages

    page_map = {}
    for key, pg in heading_pages.items():
        page_map[key] = pg - 2

    _img_n = 0
    _tbl_n = 0
    buf = io.BytesIO()
    doc = _make_doc(buf)
    el = _build_report_elements(data_type, dashboard, descriptive, trend_data, poisson_data, fmea_data, page_map=page_map)
    doc.build(el)
    return buf.getvalue()

