import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend,
  Area,
  ComposedChart,

  Label,
} from "recharts"

const CHART_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#7c3aed"]

export function StatisticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Статистический анализ</h1>
      <Tabs defaultValue="descriptive">
        <TabsList>
          <TabsTrigger value="descriptive">Описательная статистика</TabsTrigger>
          <TabsTrigger value="trend">Тренд-анализ</TabsTrigger>
          <TabsTrigger value="poisson">Анализ Пуассона</TabsTrigger>
        </TabsList>
        <TabsContent value="descriptive">
          <DescriptiveStats />
        </TabsContent>
        <TabsContent value="trend">
          <TrendAnalysis />
        </TabsContent>
        <TabsContent value="poisson">
          <PoissonAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DescriptiveStats() {
  const [dataType, setDataType] = useState("incidents")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.statistics
      .descriptive(`data_type=${dataType}`)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [dataType])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Описательная статистика</CardTitle>
        <CardDescription>
          Основные статистические показатели по выбранному типу данных
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="incidents">Несчастные случаи</SelectItem>
                <SelectItem value="equipment">Отказы оборудования</SelectItem>
                <SelectItem value="safety">Нарушения ТБ</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {loading && <Skeleton className="h-48" />}
        {!loading && stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Количество" value={stats.count} />
            <StatCard label="Среднее" value={stats.mean?.toFixed(2)} />
            <StatCard label="Медиана" value={stats.median?.toFixed(2)} />
            <StatCard label="Стд. отклонение" value={stats.std?.toFixed(2)} />
            <StatCard label="Минимум" value={stats.min} />
            <StatCard label="Максимум" value={stats.max} />
            <StatCard label="25-й перцентиль" value={stats.q25?.toFixed(2)} />
            <StatCard label="75-й перцентиль" value={stats.q75?.toFixed(2)} />
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2 space-y-1 px-2">
          <p>x̄ — среднее арифметическое, σ — стандартное отклонение (СКО)</p>
          <p>Q1, Q3 — первый и третий квартили (25-й и 75-й перцентили)</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendAnalysis() {
  const [dataType, setDataType] = useState("incidents")
  const [period, setPeriod] = useState("monthly")
  const [forecastPeriods, setForecastPeriods] = useState("6")
  const [trend, setTrend] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.statistics
      .trend(`data_type=${dataType}&period=${period}&forecast_periods=${forecastPeriods}`)
      .then(setTrend)
      .finally(() => setLoading(false))
  }, [dataType, period, forecastPeriods])

  const historicalData =
    trend?.data?.map((d: any) => ({
      period: d.period,
      count: d.count,
      trend_line: d.trend_value,
      moving_avg: d.moving_avg,
      forecast: null as number | null,
      ci_upper: null as number | null,
      ci_lower: null as number | null,
    })) || []

  const lastHistPoint = historicalData[historicalData.length - 1]

  const forecastData: any[] =
    trend?.forecast_labels?.map((label: string, i: number) => {
      const val = trend.forecast_values?.[i] ?? null
      return {
        period: label,
        count: null as number | null,
        trend_line: null as number | null,
        forecast: val,
        ci_upper: trend.forecast_upper?.[i] ?? null,
        ci_lower: trend.forecast_lower?.[i] ?? null,
      }
    }) || []

  const bridge: any[] = []
  if (lastHistPoint && forecastData.length > 0) {
    bridge.push({
      period: lastHistPoint.period,
      count: null,
      trend_line: lastHistPoint.trend_line,
      forecast: lastHistPoint.trend_line,
      ci_upper: lastHistPoint.trend_line,
      ci_lower: lastHistPoint.trend_line,
    })
  }

  const chartData = [...historicalData, ...bridge, ...forecastData]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренд-анализ с прогнозом</CardTitle>
        <CardDescription>
          Линейная регрессия с экстраполяцией и 95% доверительным интервалом
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Тип данных</label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="incidents">Несчастные случаи</SelectItem>
                  <SelectItem value="equipment">Отказы оборудования</SelectItem>
                  <SelectItem value="safety">Нарушения ТБ</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Группировка</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="monthly">По месяцам</SelectItem>
                  <SelectItem value="quarterly">По кварталам</SelectItem>
                  <SelectItem value="yearly">По годам</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Периодов прогноза</label>
            <Input
              type="number"
              min="1"
              max="12"
              value={forecastPeriods}
              onChange={(e) => {
                const v = Math.min(12, Math.max(1, Number(e.target.value) || 1))
                setForecastPeriods(String(v))
              }}
              className="w-36"
            />
          </div>
        </div>

        {loading && <Skeleton className="h-72" />}
        {!loading && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }}>
                  <Label value="Период" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Количество" angle={-90} offset={15} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip formatter={(v: number, n: string) => [v.toFixed(1), n]} labelFormatter={(l) => `Период: ${l}`} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Area
                  type="monotone"
                  dataKey="ci_upper"
                  stroke="none"
                  fill="#7c3aed"
                  fillOpacity={0.12}
                  name="95% доверительный интервал"
                  dot={false}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey="ci_lower"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name=""
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Факт"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="trend_line"
                  name="Регрессия"
                  stroke={CHART_COLORS[1]}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="moving_avg"
                  name="Скользящее среднее"
                  stroke={CHART_COLORS[2]}
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Прогноз"
                  stroke={CHART_COLORS[4]}
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[4] }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            {trend?.slope !== undefined && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  Наклон: <strong>{trend.slope?.toFixed(4)}</strong>
                </span>
                <span>
                  R²: <strong>{trend.r_squared?.toFixed(4)}</strong>
                </span>
                {trend.p_value !== undefined && (
                  <span>
                    p-value: <strong>{trend.p_value?.toFixed(4)}</strong>
                    {trend.p_value < 0.05 ? " (значим)" : " (не значим)"}
                  </span>
                )}
                <span>
                  {trend.direction === "increasing"
                    ? "↑ Рост"
                    : trend.direction === "decreasing"
                      ? "↓ Снижение"
                      : "→ Стабильно"}
                </span>
                {trend.forecast_values?.length > 0 && (
                  <span>
                    Прогноз ({trend.forecast_values.length} мес.):{" "}
                    <strong>
                      {trend.forecast_values.map((v: number) => v.toFixed(1)).join(" → ")}
                    </strong>
                  </span>
                )}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2 space-y-1 px-2">
              <p>Линейная регрессия: y = {trend.slope?.toFixed(2)}x + {trend.intercept?.toFixed(2)}</p>
              <p>R² — коэффициент детерминации; p-value — статистическая значимость тренда (p &lt; 0.05 — значим)</p>
              <p>Скользящее среднее — сглаживание (окно 3); серая область — 95% ДИ прогноза</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PoissonAnalysis() {
  const [dataType, setDataType] = useState("incidents")
  const [periodType, setPeriodType] = useState("monthly")
  const [timePeriod, setTimePeriod] = useState("12")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function calculate() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.statistics.poisson(
        `data_type=${dataType}&period=${periodType}&time_period=${timePeriod}`
      )
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const distData =
    result?.distribution?.map((d: any) => ({
      events: d.k,
      probability: Number((d.probability * 100).toFixed(2)),
      cumulative: Number((d.cumulative * 100).toFixed(2)),
    })) || []

  const periodLabel =
    periodType === "yearly" ? "год" : periodType === "quarterly" ? "квартал" : "месяц"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Анализ Пуассона</CardTitle>
        <CardDescription>
          Моделирование вероятности редких событий (несчастных случаев, отказов
          оборудования) на основе распределения Пуассона. λ вычисляется автоматически из данных.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Тип данных</label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="incidents">Несчастные случаи</SelectItem>
                  <SelectItem value="equipment">Отказы оборудования</SelectItem>
                  <SelectItem value="safety">Нарушения ТБ</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Группировка</label>
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="monthly">По месяцам</SelectItem>
                  <SelectItem value="quarterly">По кварталам</SelectItem>
                  <SelectItem value="yearly">По годам</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Период прогноза</label>
            <Input
              type="number"
              min="1"
              max="60"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-32"
            />
          </div>
          <Button onClick={calculate} disabled={loading}>
            {loading ? "Расчёт..." : "Рассчитать"}
          </Button>
        </div>

        {error && <div className="mb-3 text-sm text-destructive">{error}</div>}

        {result && (
          <>
            {result.period_unit && (
              <div className="mb-3 text-sm text-muted-foreground">
                λ = <strong>{result.lambda}</strong> событий/{result.period_unit} |
                {" "}Всего событий: <strong>{result.total_events}</strong> |
                {" "}Периодов: <strong>{result.num_periods}</strong> |
                {" "}Данные: {result.first_date} — {result.last_date}
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="λ (интенсивность)"
                value={result.lambda?.toFixed(4)}
              />
              <StatCard
                label="P(0 событий)"
                value={`${(result.prob_zero * 100).toFixed(2)}%`}
              />
              <StatCard
                label="P(≥1 событие)"
                value={`${(result.prob_at_least_one * 100).toFixed(2)}%`}
              />
              <StatCard
                label={`Ожидаемое за ${timePeriod} ${periodLabel}.`}
                value={result.expected_in_period?.toFixed(2)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {distData.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Распределение вероятностей P(X=k)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distData} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="events">
                        <Label value="Число событий (k)" offset={-5} position="insideBottom" />
                      </XAxis>
                      <YAxis>
                        <Label value="P(X=k), %" angle={-90} offset={15} position="insideLeft" style={{ textAnchor: 'middle' }} />
                      </YAxis>
                      <Tooltip formatter={(v: number) => [v.toFixed(4), "Вероятность"]} labelFormatter={(l) => `k = ${l}`} />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Bar
                        dataKey="probability"
                        name="Вероятность (%)"
                        fill={CHART_COLORS[0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {result.event_counts?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">События по периодам</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={result.period_labels.map((l: string, i: number) => ({
                        period: l,
                        count: result.event_counts[i],
                      }))}
                      margin={{ top: 5, right: 20, bottom: 25, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }}>
                        <Label value="Период" offset={-5} position="insideBottom" />
                      </XAxis>
                      <YAxis>
                        <Label value="Количество" angle={-90} offset={15} position="insideLeft" style={{ textAnchor: 'middle' }} />
                      </YAxis>
                      <Tooltip formatter={(v: number) => [v, "Событий"]} />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Bar
                        dataKey="count"
                        name="Событий за период"
                        fill={CHART_COLORS[1]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {result.confidence_interval && (
              <div className="mt-3 text-sm text-muted-foreground">
                95% доверительный интервал за {timePeriod} {periodLabel}.: [
                <strong>{result.confidence_interval[0]?.toFixed(1)}</strong>,{" "}
                <strong>{result.confidence_interval[1]?.toFixed(1)}</strong>]
              </div>
            )}
            {result.goodness_of_fit?.chi2_statistic != null && (
              <div className="mt-2 text-sm text-muted-foreground">
                Критерий согласия χ²: <strong>{result.goodness_of_fit.chi2_statistic}</strong>
                {" "}(df={result.goodness_of_fit.degrees_of_freedom}, p={result.goodness_of_fit.p_value?.toFixed(4)})
                {" "}&mdash; <span className={result.goodness_of_fit.p_value > 0.05 ? "text-green-600" : "text-red-600"}>
                  {result.goodness_of_fit.p_value > 0.05 ? "модель адекватна" : "модель НЕ адекватна"}
                </span>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2 space-y-1 px-2">
              <p>λ (лямбда) — оценка интенсивности событий (среднее число за период)</p>
              <p>P(X=k) = λ^k · e^(-λ) / k! — вероятность ровно k событий</p>
              <p>95% ДИ — доверительный интервал для числа событий</p>
              <p>χ²-критерий — проверка согласия распределения Пуассона с данными (p &gt; 0.05 → модель адекватна)</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value ?? "—"}</div>
    </div>
  )
}
