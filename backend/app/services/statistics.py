import numpy as np
import pandas as pd
from scipy import stats as sp_stats

from app.schemas.statistics import DescriptiveStats, PoissonResult, TrendResult


def descriptive_statistics(values: list[float]) -> DescriptiveStats:
    s = pd.Series(values)
    q = s.quantile([0.25, 0.5, 0.75])
    return DescriptiveStats(
        count=int(s.count()),
        mean=round(float(s.mean()), 4),
        std=round(float(s.std()), 4),
        min=round(float(s.min()), 4),
        q1=round(float(q.iloc[0]), 4),
        median=round(float(q.iloc[1]), 4),
        q3=round(float(q.iloc[2]), 4),
        max=round(float(s.max()), 4),
    )


def poisson_analysis(event_counts: list[int], forecast_periods: int = 12) -> PoissonResult:
    counts = np.array(event_counts)
    lam = float(np.mean(counts))
    n_max = min(int(lam * 3) + 5, 50)

    probabilities = []
    for k in range(n_max + 1):
        prob = float(sp_stats.poisson.pmf(k, lam))
        probabilities.append({"k": k, "probability": round(prob, 6)})

    forecast = []
    for i in range(1, forecast_periods + 1):
        expected = lam
        p_zero = float(sp_stats.poisson.pmf(0, lam))
        p_one_plus = 1 - p_zero
        forecast.append(
            {
                "period": i,
                "expected_events": round(expected, 2),
                "prob_zero_events": round(p_zero, 4),
                "prob_one_or_more": round(p_one_plus, 4),
            }
        )

    ci_low, ci_high = sp_stats.poisson.interval(0.95, lam)
    ci = (max(0, float(ci_low)), float(ci_high))

    return PoissonResult(
        lambda_est=round(lam, 4), probabilities=probabilities, forecast=forecast, confidence_interval=ci
    )


def trend_analysis(values: list[float], labels: list[str], forecast_periods: int = 6) -> TrendResult:
    x = np.arange(len(values))
    y = np.array(values)

    slope, intercept, r_value, _, _ = sp_stats.linregress(x, y)
    r_squared = r_value**2

    window = min(3, len(values))
    ma = pd.Series(values).rolling(window=window, min_periods=1).mean().tolist()
    ma_floats = [round(float(v), 4) for v in ma]

    future_x = np.arange(len(values), len(values) + forecast_periods)
    forecast_vals = slope * future_x + intercept
    forecast_floats = [round(max(0, float(v)), 4) for v in forecast_vals]

    last_label = labels[-1] if labels else "0"
    try:
        parts = last_label.split("-")
        year, month = int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        year, month = 2025, 12

    forecast_labels = []
    for i in range(forecast_periods):
        month += 1
        if month > 12:
            month = 1
            year += 1
        forecast_labels.append(f"{year}-{month:02d}")

    if slope > 0.05:
        direction = "Растущий"
    elif slope < -0.05:
        direction = "Нисходящий"
    else:
        direction = "Стабильный"

    return TrendResult(
        trend_direction=direction,
        slope=round(float(slope), 4),
        r_squared=round(float(r_squared), 4),
        moving_avg=ma_floats,
        forecast_values=forecast_floats,
        forecast_labels=forecast_labels,
    )
