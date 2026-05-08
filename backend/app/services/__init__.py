from app.schemas.risk_matrix import (
    LIKELIHOOD_LABELS,
    SEVERITY_LABELS,
    RiskMatrixCell,
    RiskMatrixInput,
    RiskMatrixResult,
)


def _risk_level(score: int) -> tuple[str, str, str]:
    if score <= 4:
        return "Низкий", "#22c55e", "Мониторинг, контроль стандартный"
    elif score <= 9:
        return "Средний", "#f59e0b", "Требуются меры по снижению риска"
    elif score <= 16:
        return "Высокий", "#f97316", "Необходимы срочные меры по снижению"
    else:
        return "Очень высокий", "#ef4444", "Немедленные действия, прекращение работ"


def calculate_risk_matrix(data: RiskMatrixInput) -> RiskMatrixResult:
    matrix = []
    for sev in range(1, 6):
        row = []
        for lik in range(1, 6):
            score = sev * lik
            level, color, rec = _risk_level(score)
            row.append(
                RiskMatrixCell(
                    likelihood=lik,
                    severity=sev,
                    risk_level=level,
                    color=color,
                    score=score,
                    recommendation=rec,
                )
            )
        matrix.append(row)

    score = data.severity * data.likelihood
    level, color, rec = _risk_level(score)
    assessment = RiskMatrixCell(
        likelihood=data.likelihood,
        severity=data.severity,
        risk_level=level,
        color=color,
        score=score,
        recommendation=rec,
    )

    return RiskMatrixResult(
        matrix=matrix,
        assessment=assessment,
        likelihood_labels=[LIKELIHOOD_LABELS[i] for i in range(1, 6)],
        severity_labels=[SEVERITY_LABELS[i] for i in range(1, 6)],
    )
