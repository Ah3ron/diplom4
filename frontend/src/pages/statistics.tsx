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
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ci_upper"
                  stroke="none"
                  fill="#7c3aed"
                  fillOpacity={0.12}
                  name="95% ДИ"
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
                  name="Тренд"
                  stroke={CHART_COLORS[1]}
                  strokeDasharray="5 5"
                  strokeWidth={2}
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="events" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="probability"
                      name="Вероятность (%)"
                      fill={CHART_COLORS[0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {result.event_counts?.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={result.period_labels.map((l: string, i: number) => ({
                      period: l,
                      count: result.event_counts[i],
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Событий за период"
                      fill={CHART_COLORS[1]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {result.confidence_interval && (
              <div className="mt-3 text-sm text-muted-foreground">
                95% доверительный интервал за {timePeriod} {periodLabel}.: [
                <strong>{result.confidence_interval[0]?.toFixed(1)}</strong>,{" "}
                <strong>{result.confidence_interval[1]?.toFixed(1)}</strong>]
              </div>
            )}
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
