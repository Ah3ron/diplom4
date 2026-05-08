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
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

const DEFAULT_MODES = [
  "Износ режущего органа",
  "Отказ гидравлической системы",
  "Обрыв силового кабеля",
  "Неисправность системы управления",
  "Разрушение подшипникового узла",
  "Утечка масла",
  "Перегрев электродвигателя",
  "Деформация несущей конструкции",
]

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

function ResultsBlock({ result }: { result: FMEAResult }) {
  const chartData = result.items
    .sort((a, b) => b.rpn - a.rpn)
    .map((item) => ({
      name: item.failure_mode.length > 25 ? item.failure_mode.slice(0, 25) + "…" : item.failure_mode,
      rpn: item.rpn,
    }))

  return (
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
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={180} />
                <Tooltip />
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
  )
}

function AutoMode() {
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
      const res = await api.risk.fmeaAuto(params.toString())
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Автоматический анализ</CardTitle>
          <CardDescription>
            Система автоматически формирует FMEA на основе данных об отказах оборудования,
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
      {result && <ResultsBlock result={result} />}
    </div>
  )
}

function ManualMode() {
  const [name, setName] = useState("Анализ горно-шахтного оборудования")
  const [items, setItems] = useState([
    { failure_mode: "", severity: 5, occurrence: 3, detection: 4 },
  ])
  const [result, setResult] = useState<FMEAResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems([...items, { failure_mode: "", severity: 5, occurrence: 3, detection: 4 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: string, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  async function calculate() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.risk.fmea({
        analysis_name: name,
        items: items.map((item, i) => ({
          id: i + 1,
          failure_mode: item.failure_mode || `Отказ ${i + 1}`,
          severity: Number(item.severity),
          occurrence: Number(item.occurrence),
          detection: Number(item.detection),
        })),
      })
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Ручной ввод</CardTitle>
          <CardDescription>
            Укажите виды отказов и оцените S, O, D по шкале 1–10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Название анализа</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-md" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>S: 1 (незначительный) → 10 (критический)</span>
              <Separator orientation="vertical" className="h-4" />
              <span>O: 1 (невероятный) → 10 (частый)</span>
              <Separator orientation="vertical" className="h-4" />
              <span>D: 1 (обнаружим) → 10 (необнаружим)</span>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Вид отказа</TableHead>
                    <TableHead className="w-20">S (1–10)</TableHead>
                    <TableHead className="w-20">O (1–10)</TableHead>
                    <TableHead className="w-20">D (1–10)</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={item.failure_mode}
                          onChange={(e) => updateItem(i, "failure_mode", e.target.value)}
                          placeholder="Описание вида отказа"
                          list="modes"
                        />
                        <datalist id="modes">
                          {DEFAULT_MODES.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={item.severity}
                          onChange={(e) =>
                            updateItem(i, "severity", Math.min(10, Math.max(1, Number(e.target.value))))
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={item.occurrence}
                          onChange={(e) =>
                            updateItem(i, "occurrence", Math.min(10, Math.max(1, Number(e.target.value))))
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={item.detection}
                          onChange={(e) =>
                            updateItem(i, "detection", Math.min(10, Math.max(1, Number(e.target.value))))
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length <= 1}>
                          ✕
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addItem}>+ Добавить строку</Button>
              <Button onClick={calculate} disabled={loading}>{loading ? "Расчёт..." : "Рассчитать RPN"}</Button>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
        </CardContent>
      </Card>
      {result && <ResultsBlock result={result} />}
    </div>
  )
}

export function FMEAPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">FMEA-анализ</h1>
      <Tabs defaultValue="auto">
        <TabsList>
          <TabsTrigger value="auto">Автоматический</TabsTrigger>
          <TabsTrigger value="manual">Ручной ввод</TabsTrigger>
        </TabsList>
        <TabsContent value="auto">
          <AutoMode />
        </TabsContent>
        <TabsContent value="manual">
          <ManualMode />
        </TabsContent>
      </Tabs>
    </div>
  )
}
