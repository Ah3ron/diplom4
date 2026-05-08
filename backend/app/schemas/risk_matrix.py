from pydantic import BaseModel


class RiskMatrixInput(BaseModel):
    likelihood: int
    severity: int
    description: str = ""


class RiskMatrixCell(BaseModel):
    likelihood: int
    severity: int
    risk_level: str
    color: str
    score: int
    recommendation: str


class RiskMatrixResult(BaseModel):
    matrix: list[list[RiskMatrixCell]]
    assessment: RiskMatrixCell
    likelihood_labels: list[str]
    severity_labels: list[str]


LIKELIHOOD_LABELS = {
    1: "Маловероятно",
    2: "Редко",
    3: "Иногда",
    4: "Вероятно",
    5: "Почти всегда",
}

SEVERITY_LABELS = {
    1: "Незначительный",
    2: "Малый",
    3: "Умеренный",
    4: "Значительный",
    5: "Катастрофический",
}
