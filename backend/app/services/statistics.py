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

    slope, intercept, r_value, p_value, std_err = sp_stats.linregress(x, y)
    r_squared = r_value**2

    window = min(3, len(values))
    ma = pd.Series(values).rolling(window=window, min_periods=1).mean().tolist()
    ma_floats = [round(float(v), 4) for v in ma]

    reg_line = [round(float(slope * xi + intercept), 4) for xi in x]

    future_x = np.arange(len(values), len(values) + forecast_periods)
    forecast_vals = slope * future_x + intercept
    forecast_floats = [round(max(0, float(v)), 4) for v in forecast_vals]

    n = len(values)
    x_mean = np.mean(x)
    ss_x = np.sum((x - x_mean) ** 2)
    se_y = np.sqrt(np.sum((y - (slope * x + intercept)) ** 2) / (n - 2)) if n > 2 else 0
    t_crit = float(sp_stats.t.ppf(0.975, max(n - 2, 1)))

    forecast_lower = []
    forecast_upper = []
    for xi, fv in zip(future_x, forecast_floats):
        se_pred = se_y * np.sqrt(1 + 1 / n + (xi - x_mean) ** 2 / ss_x) if ss_x > 0 else se_y
        margin = t_crit * se_pred
        forecast_lower.append(round(max(0, float(fv - margin)), 4))
        forecast_upper.append(round(max(0, float(fv + margin)), 4))

    forecast_labels = _generate_forecast_labels(labels, forecast_periods)

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
        p_value=round(float(p_value), 6),
        intercept=round(float(intercept), 4),
        moving_avg=ma_floats,
        regression_line=reg_line,
        forecast_values=forecast_floats,
        forecast_labels=forecast_labels,
        forecast_lower=forecast_lower,
        forecast_upper=forecast_upper,
    )


def poisson_goodness_of_fit(observed_counts: list[int], lam: float) -> dict:
    counts = np.array(observed_counts)
    n = len(counts)
    if n < 3:
        return {"chi2_statistic": None, "p_value": None, "conclusion": "Недостаточно данных"}

    max_k = int(counts.max())
    observed_freq = np.zeros(max_k + 2)
    for c in counts:
        k = min(c, max_k + 1)
        observed_freq[k] += 1

    if observed_freq[-1] == 0:
        observed_freq = observed_freq[:-1]

    n_bins = len(observed_freq)
    expected_freq = np.array([float(sp_stats.poisson.pmf(k, lam)) * n for k in range(n_bins - 1)])
    expected_freq = np.append(expected_freq, n - expected_freq.sum())

    tail = expected_freq[-1]
    merge_from = None
    for i in range(len(expected_freq) - 1, -1, -1):
        if expected_freq[i] < 5:
            merge_from = i
        else:
            break

    if merge_from is not None and merge_from > 0:
        observed_freq[merge_from - 1] += observed_freq[merge_from:].sum()
        expected_freq[merge_from - 1] += expected_freq[merge_from:].sum()
        observed_freq = observed_freq[:merge_from]
        expected_freq = expected_freq[:merge_from]

    valid = expected_freq > 0
    if valid.sum() < 2:
        return {"chi2_statistic": None, "p_value": None, "conclusion": "Недостаточно данных"}

    chi2 = float(np.sum((observed_freq[valid] - expected_freq[valid]) ** 2 / expected_freq[valid]))
    df = max(int(valid.sum()) - 2, 1)
    p_val = float(sp_stats.chi2.sf(chi2, df))

    if p_val > 0.05:
        conclusion = "Распределение Пуассона согласуется с данными (p > 0.05)"
    else:
        conclusion = "Распределение Пуассона НЕ согласуется с данными (p ≤ 0.05)"

    return {
        "chi2_statistic": round(chi2, 4),
        "degrees_of_freedom": df,
        "p_value": round(p_val, 6),
        "conclusion": conclusion,
    }


def correlation_analysis(
    series_a: list[float],
    series_b: list[float],
    labels_a: list[str],
    labels_b: list[str],
) -> dict:
    min_len = min(len(series_a), len(series_b))
    if min_len < 3:
        return {"error": "Недостаточно совпадающих периодов для корреляции"}

    a = np.array(series_a[:min_len])
    b = np.array(series_b[:min_len])

    pearson_r, pearson_p = sp_stats.pearsonr(a, b)
    spearman_r, spearman_p = sp_stats.spearmanr(a, b)

    if abs(pearson_r) < 0.2:
        strength = "Очень слабая"
    elif abs(pearson_r) < 0.4:
        strength = "Слабая"
    elif abs(pearson_r) < 0.6:
        strength = "Умеренная"
    elif abs(pearson_r) < 0.8:
        strength = "Сильная"
    else:
        strength = "Очень сильная"

    return {
        "pearson_r": round(float(pearson_r), 4),
        "pearson_p_value": round(float(pearson_p), 6),
        "spearman_r": round(float(spearman_r), 4),
        "spearman_p_value": round(float(spearman_p), 6),
        "strength": strength,
        "n_periods": min_len,
        "conclusion": (
            f"{strength} корреляция (r={pearson_r:.2f}, p={pearson_p:.4f})"
            if pearson_p < 0.05
            else f"Корреляция статистически незначима (p={pearson_p:.4f})"
        ),
    }


def _generate_forecast_labels(labels: list[str], count: int) -> list[str]:
    last = labels[-1] if labels else "2025-01"
    if "-Q" in last:
        parts = last.split("-Q")
        year, q = int(parts[0]), int(parts[1])
        result = []
        for _ in range(count):
            q += 1
            if q > 4:
                q = 1
                year += 1
            result.append(f"{year}-Q{q}")
        return result
    elif len(last) == 4 and last.isdigit():
        year = int(last)
        return [str(year + i + 1) for i in range(count)]
    else:
        try:
            parts = last.split("-")
            year, month = int(parts[0]), int(parts[1])
        except (ValueError, IndexError):
            year, month = 2025, 12
        result = []
        for _ in range(count):
            month += 1
            if month > 12:
                month = 1
                year += 1
            result.append(f"{year}-{month:02d}")
        return result
