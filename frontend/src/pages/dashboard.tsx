import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Label,
} from "recharts"

const RISK_COLORS: Record<string, string> = {
  "смертельный": "#b91c1c",
  "тяжёлый": "#f97316",
  "средний": "#eab308",
  "лёгкий": "#22c55e",
}

const CHART_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ea580c", "#7c3aed"]

interface DashboardData {
  total_incidents: number
  total_equipment_failures: number
  total_safety_violations: number
  incidents_by_department: Record<string, number>
  incidents_by_type: Record<string, number>
  incidents_by_severity: Record<string, number>
  equipment_by_type: Record<string, number>
  violations_by_department: Record<string, number>
  monthly_trend: Array<{ month: string; count: number }>
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.statistics
      .dashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <Alert>
        <AlertDescription>Ошибка загрузки данных: {error}</AlertDescription>
      </Alert>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      <div className="text-xs text-muted-foreground mt-2 px-2">
        <p>Частота травматизма = (число инцидентов × 1000) / среднесписочная численность</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    )
  }

  const incidentByDept = Object.entries(data.incidents_by_department || {}).map(
    ([name, count]) => ({ name, count })
  )
  const incidentBySeverity = Object.entries(
    data.incidents_by_severity || {}
  ).map(([name, count]) => ({
    name,
    count,
    fill: RISK_COLORS[name] || "#8884d8",
  }))
  const equipByType = Object.entries(data.equipment_by_type || {}).map(
    ([name, count]) => ({ name, count })
  )


  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Дашборд</h1>

      {data.total_incidents === 0 && data.total_equipment_failures === 0 && data.total_safety_violations === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Данные отсутствуют. Загрузите файлы на странице «Загрузка» для отображения аналитики.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Несчастные случаи</CardDescription>
            <CardTitle className="text-3xl">{data.total_incidents}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">За весь период</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Отказы оборудования</CardDescription>
            <CardTitle className="text-3xl">
              {data.total_equipment_failures}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">За весь период</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Нарушения ТБ</CardDescription>
            <CardTitle className="text-3xl">
              {data.total_safety_violations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">За весь период</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Несчастные случаи по отделам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentByDept} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }}>
                  <Label value="Подразделение" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Количество" angle={-90} offset={15} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip formatter={(v: number) => [v, "Количество"]} />
                <Bar dataKey="count" name="Количество" fill={CHART_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Несчастные случаи по тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={incidentBySeverity}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {incidentBySeverity.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v} случаев`, n]} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Отказы по типу оборудования</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={equipByType} layout="vertical" margin={{ top: 5, right: 20, bottom: 25, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number">
                  <Label value="Количество" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip formatter={(v: number) => [v, "Количество"]} />
                <Bar dataKey="count" name="Количество" fill={CHART_COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Динамика инцидентов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly_trend || []} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }}>
                  <Label value="Месяц" offset={-5} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Инциденты" angle={-90} offset={15} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip formatter={(v: number) => [v, "Количество"]} labelFormatter={(l) => `Месяц: ${l}`} />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Инциденты"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      {children}
    </div>
  )
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}
