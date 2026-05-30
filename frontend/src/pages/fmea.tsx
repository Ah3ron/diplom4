import { useState } from "react"
import { api } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts"

interface FMEARow {
  id: number
  failure_mode: string
  component: string
  failure_effect: string
  severity: number
  occurrence: number
  detection: number
  rpn: number
  action_priority: string
  severity_label: string
  occurrence_label: string
  detection_label: string
}

interface FMEAResult {
  analysis_name: string
  items: FMEARow[]
  total_risk: number
  avg_rpn: number
  high_risk_count: number
  recommendations: string[]
  source_stats?: {
    total_failures: number
    total_incidents: number
    total_violations: number
    period_months: number
  }
}

const DEPARTMENTS = [
  { value: "all", label: "Все отделы" },
  { value: "Цех горно-шахтного оборудования", label: "Цех ГШО" },
  { value: "Экспериментальное производство", label: "Экспериментальное производство" },
  { value: "Цех спецоборудования", label: "Цех спецоборудования" },
  { value: "Цех КИПиА", label: "Цех КИПиА" },
  { value: "Институт горной автоматики", label: "Институт горной автоматики" },
]

const EQUIP_TYPES = [
  { value: "all", label: "Все типы" },
  { value: "Комбайн очистной", label: "Комбайн очистной" },
  { value: "Кран портальный", label: "Кран портальный" },
  { value: "Станок с ЧПУ", label: "Станок с ЧПУ" },
  { value: "Экскаватор шагающий", label: "Экскаватор шагающий" },
  { value: "Установка буровая", label: "Установка буровая" },
]

function priorityVariant(p: string) {
  switch (p) {
    case "Высокий":
    case "Очень высокий":
      return "destructive"
    case "Средний":
      return "secondary"
    case "Низкий":
      return "outline"
    default:
      return "secondary"
  }
}

function rpnColor(rpn: number) {
  if (rpn > 200) return "#ef4444"
  if (rpn > 100) return "#f97316"
  if (rpn > 40) return "#f59e0b"
  return "#22c55e"
}

export function FMEAPage() {
  const [department, setDepartment] = useState("all")
  const [equipType, setEquipType] = useState("all")
  const [result, setResult] = useState<FMEAResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (department && department !== "all") params.set("department", department)
      if (equipType && equipType !== "all") params.set("equipment_type", equipType)
      const res = await api.risk.fmea(params.toString())
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData = result
    ? result.items
        .sort((a, b) => b.rpn - a.rpn)
        .map((item) => ({
          name: item.failure_mode.length > 25 ? item.failure_mode.slice(0, 25) + "…" : item.failure_mode,
          rpn: item.rpn,
        }))
    : []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">FMEA-анализ</h1>

      <Card>
        <CardHeader>
          <CardTitle>Параметры анализа</CardTitle>
          <CardDescription>
            FMEA-анализ формируется автоматически на основе данных об отказах оборудования,
            инцидентах и нарушениях ТБ. Оценки S/O/D вычисляются статистически.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Отдел</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Все отделы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Отдел</SelectLabel>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Тип оборудования</label>
                <Select value={equipType} onValueChange={setEquipType}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Тип оборудования</SelectLabel>
                      {EQUIP_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={runAnalysis} disabled={loading} className="w-fit">
              {loading ? "Анализ..." : "Провести FMEA-анализ"}
            </Button>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
        </CardContent>
      </Card>

      {!result && (
        <div className="text-center text-muted-foreground py-8">
          Выберите подразделение и тип оборудования, затем нажмите «Провести FMEA-анализ»
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          {result.source_stats && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Источники данных</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>Отказы оборудования: <strong>{result.source_stats.total_failures}</strong></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Инциденты: <strong>{result.source_stats.total_incidents}</strong></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Нарушения ТБ: <strong>{result.source_stats.total_violations}</strong></span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Период: <strong>{result.source_stats.period_months} мес.</strong></span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Средний RPN</CardDescription>
                <CardTitle className="text-3xl">{result.avg_rpn}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Суммарный риск</CardDescription>
                <CardTitle className="text-3xl">{result.total_risk}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Высокорисковые элементы</CardDescription>
                <CardTitle className="text-3xl">{result.high_risk_count}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">RPN по видам отказов</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 25, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number">
                      <Label value="RPN" offset={-5} position="insideBottom" />
                    </XAxis>
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={180} />
                    <Tooltip formatter={(v: number) => [v, "RPN"]} />
                    <Bar dataKey="rpn" name="RPN" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={rpnColor(entry.rpn)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Результаты: {result.analysis_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Вид отказа</TableHead>
                      <TableHead>Компонент</TableHead>
                      <TableHead>Последствия</TableHead>
                      <TableHead>S</TableHead>
                      <TableHead>O</TableHead>
                      <TableHead>D</TableHead>
                          <TableHead>RPN</TableHead>
                          <TableHead>RPN 95% ДИ</TableHead>
                          <TableHead>Приоритет</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.items
                      .sort((a, b) => b.rpn - a.rpn)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.failure_mode}</TableCell>
                          <TableCell>{item.component}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.failure_effect}</TableCell>
                          <TableCell>{item.severity}</TableCell>
                          <TableCell>{item.occurrence}</TableCell>
                          <TableCell>{item.detection}</TableCell>
                          <TableCell className="font-bold" style={{ color: rpnColor(item.rpn) }}>
                            {item.rpn}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            [{item.rpn_low}–{item.rpn_high}]
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityVariant(item.action_priority)}>
                              {item.action_priority}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground mt-2 space-y-1 px-2">
            <p>RPN = S × O × D — число приоритета риска (от 1 до 1000)</p>
            <p>S — тяжесть последствий (1–10), O — частота возникновения (1–10), D — невозможность обнаружения (1–10)</p>
            <p>RPN 95% ДИ — доверительный интервал, полученный методом бутстрапа (±1 балл по каждой шкале)</p>
            <p className="flex gap-3">
              <span className="text-green-600">● до 40 — низкий</span>
              <span className="text-yellow-600">● 41–100 — средний</span>
              <span className="text-orange-600">● 101–200 — высокий</span>
              <span className="text-red-600">● 201+ — очень высокий</span>
            </p>
          </div>

          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Рекомендации</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
