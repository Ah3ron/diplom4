from typing import Optional

from pydantic import BaseModel


class DescriptiveStats(BaseModel):
    count: int
    mean: float
    std: float
    min: float
    q1: float
    median: float
    q3: float
    max: float


class PoissonInput(BaseModel):
    event_counts: list[int]
    forecast_periods: int = 12


class PoissonResult(BaseModel):
    lambda_est: float
    probabilities: list[dict]
    forecast: list[dict]
    confidence_interval: tuple[float, float]


class TrendInput(BaseModel):
    values: list[float]
    labels: list[str]
    forecast_periods: int = 6


class TrendResult(BaseModel):
    trend_direction: str
    slope: float
    r_squared: float
    moving_avg: list[float]
    forecast_values: list[float]
    forecast_labels: list[str]
    forecast_lower: list[float]
    forecast_upper: list[float]


class StatisticsResponse(BaseModel):
    descriptive: Optional[DescriptiveStats] = None
    poisson: Optional[PoissonResult] = None
    trend: Optional[TrendResult] = None
