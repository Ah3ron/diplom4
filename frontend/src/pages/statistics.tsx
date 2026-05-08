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
  LineChart,
  Line,
  Legend,
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
  const [trend, setTrend] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.statistics
      .trend(`data_type=${dataType}&period=${period}`)
      .then(setTrend)
      .finally(() => setLoading(false))
  }, [dataType, period])

  const chartData =
    trend?.data?.map((d: any) => ({
      period: d.period,
      count: d.count,
      trend_line: d.trend_value,
    })) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренд-анализ</CardTitle>
        <CardDescription>
          Анализ динамики данных с линейным трендом
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
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

        {loading && <Skeleton className="h-72" />}
        {!loading && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Факт"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="trend_line"
                  name="Тренд"
                  stroke={CHART_COLORS[1]}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
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
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PoissonAnalysis() {
  const [lambda, setLambda] = useState("4")
  const [timePeriod, setTimePeriod] = useState("12")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function calculate() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.statistics.poisson(
        `lambda=${lambda}&time_period=${timePeriod}`
      )
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData =
    result?.distribution?.map((d: any) => ({
      events: d.k,
      probability: Number((d.probability * 100).toFixed(2)),
      cumulative: Number((d.cumulative * 100).toFixed(2)),
    })) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Анализ Пуассона</CardTitle>
        <CardDescription>
          Моделирование вероятности редких событий (несчастных случаев, отказов)
          на основе распределения Пуассона
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              λ (среднее число событий)
            </label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={lambda}
              onChange={(e) => setLambda(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Период (месяцев)
            </label>
            <Input
              type="number"
              min="1"
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
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              <StatCard
                label="P(0 событий)"
                value={`${(result.prob_zero * 100).toFixed(2)}%`}
              />
              <StatCard
                label="P(≥1 событие)"
                value={`${(result.prob_at_least_one * 100).toFixed(2)}%`}
              />
              <StatCard
                label="Ожидаемое за период"
                value={result.expected_in_period?.toFixed(2)}
              />
            </div>

            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="events"
                    label={{ value: "Число событий", position: "bottom" }}
                  />
                  <YAxis
                    label={{
                      value: "Вероятность (%)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
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
