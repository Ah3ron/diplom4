from app.schemas.fmea import FMEAAnalysis, FMEAInput, FMEAResult


def _action_priority(rpn: int) -> tuple[str, str]:
    if rpn <= 40:
        return "Низкий", "#22c55e"
    elif rpn <= 100:
        return "Средний", "#f59e0b"
    elif rpn <= 200:
        return "Высокий", "#f97316"
    else:
        return "Очень высокий", "#ef4444"


def _severity_label(v: int) -> str:
    labels = {
        1: "Незначительный", 2: "Очень малый", 3: "Малый",
        4: "Умеренный", 5: "Заметный", 6: "Значительный",
        7: "Серьёзный", 8: "Критический", 9: "Очень критический", 10: "Катастрофический",
    }
    return labels.get(v, "Неизвестно")


def _occurrence_label(v: int) -> str:
    labels = {
        1: "Невозможно", 2: "Очень редко", 3: "Редко",
        4: "Очень низкая", 5: "Низкая", 6: "Умеренная",
        7: "Заметная", 8: "Высокая", 9: "Очень высокая", 10: "Почти всегда",
    }
    return labels.get(v, "Неизвестно")


def _detection_label(v: int) -> str:
    labels = {
        1: "Почти наверняка", 2: "Очень высокая", 3: "Высокая",
        4: "Умеренно высокая", 5: "Средняя", 6: "Умеренно низкая",
        7: "Низкая", 8: "Очень низкая", 9: "Отдалённая", 10: "Необнаружим",
    }
    return labels.get(v, "Неизвестно")


def analyze_fmea(items: list[FMEAInput], analysis_name: str = "FMEA-анализ") -> FMEAAnalysis:
    results = []
    recommendations = []
    for item in items:
        rpn = item.severity * item.occurrence * item.detection
        priority, color = _action_priority(rpn)
        results.append(
            FMEAResult(
                id=item.id,
                failure_mode=item.failure_mode,
                component=item.component,
                failure_effect=item.failure_effect,
                severity=item.severity,
                severity_label=_severity_label(item.severity),
                occurrence=item.occurrence,
                occurrence_label=_occurrence_label(item.occurrence),
                detection=item.detection,
                detection_label=_detection_label(item.detection),
                rpn=rpn,
                action_priority=priority,
                color=color,
            )
        )
        if rpn > 100:
            recommendations.append(
                f"«{item.failure_mode}» — RPN={rpn} ({priority}). "
                f"Необходимы меры по снижению: S={item.severity}, O={item.occurrence}, D={item.detection}."
            )

    results.sort(key=lambda x: x.rpn, reverse=True)

    total = sum(r.rpn for r in results)
    avg = total / len(results) if results else 0
    high = sum(1 for r in results if r.rpn > 100)

    return FMEAAnalysis(
        analysis_name=analysis_name,
        items=results,
        total_risk=total,
        avg_rpn=round(avg, 1),
        high_risk_count=high,
        recommendations=recommendations,
    )
