from pydantic import BaseModel


class FMEAInput(BaseModel):
    id: int = 0
    failure_mode: str
    component: str = ""
    failure_effect: str = ""
    severity: int
    occurrence: int
    detection: int


class FMEAResult(BaseModel):
    id: int
    failure_mode: str
    component: str
    failure_effect: str
    severity: int
    severity_label: str
    occurrence: int
    occurrence_label: str
    detection: int
    detection_label: str
    rpn: int
    rpn_low: int = 0
    rpn_high: int = 0
    action_priority: str
    color: str


class FMEARequest(BaseModel):
    analysis_name: str = "FMEA-анализ"
    items: list[FMEAInput]


class FMEAAnalysis(BaseModel):
    analysis_name: str
    items: list[FMEAResult]
    total_risk: int
    avg_rpn: float
    high_risk_count: int
    recommendations: list[str]
