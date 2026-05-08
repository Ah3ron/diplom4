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
} from "recharts"

const RISK_COLORS: Record<string, string> = {
  "Очень высокий": "#dc2626",
  "Высокий": "#ea580c",
  "Средний": "#eab308",
  "Низкий": "#22c55e",
  "Очень низкий": "#3b82f6",
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={incidentByDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Отказы по типу оборудования</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={equipByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip />
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
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
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
