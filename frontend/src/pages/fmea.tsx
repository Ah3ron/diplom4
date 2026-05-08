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

interface FMEARow {
  id: number
  failure_mode: string
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
  recommendations: string[]
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

function priorityVariant(p: string) {
  switch (p) {
    case "Высокий":
      return "destructive"
    case "Средний":
      return "secondary"
    case "Низкий":
      return "outline"
    default:
      return "secondary"
  }
}

export function FMEAPage() {
  const [name, setName] = useState("Анализ горно-шахтного оборудования")
  const [items, setItems] = useState([
    { failure_mode: "", severity: 5, occurrence: 3, detection: 4 },
  ])
  const [result, setResult] = useState<FMEAResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems([
      ...items,
      { failure_mode: "", severity: 5, occurrence: 3, detection: 4 },
    ])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateItem(
    index: number,
    field: string,
    value: string | number
  ) {
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
      <h1 className="text-2xl font-semibold">FMEA-анализ</h1>

      <Card>
        <CardHeader>
          <CardTitle>Параметры анализа</CardTitle>
          <CardDescription>
            Укажите виды отказов и оцените Severity (тяжесть), Occurrence
            (вероятность), Detection (обнаруживаемость) по шкале 1-10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Название анализа</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-md"
              />
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
                    <TableHead className="w-20">S (1-10)</TableHead>
                    <TableHead className="w-20">O (1-10)</TableHead>
                    <TableHead className="w-20">D (1-10)</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={item.failure_mode}
                          onChange={(e) =>
                            updateItem(i, "failure_mode", e.target.value)
                          }
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
                            updateItem(
                              i,
                              "severity",
                              Math.min(10, Math.max(1, Number(e.target.value)))
                            )
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
                            updateItem(
                              i,
                              "occurrence",
                              Math.min(10, Math.max(1, Number(e.target.value)))
                            )
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
                            updateItem(
                              i,
                              "detection",
                              Math.min(10, Math.max(1, Number(e.target.value)))
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(i)}
                          disabled={items.length <= 1}
                        >
                          ✕
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={addItem}>
                + Добавить строку
              </Button>
              <Button onClick={calculate} disabled={loading}>
                {loading ? "Расчёт..." : "Рассчитать RPN"}
              </Button>
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Результаты: {result.analysis_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Вид отказа</TableHead>
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
                          <TableCell>{item.failure_mode}</TableCell>
                          <TableCell>{item.severity}</TableCell>
                          <TableCell>{item.occurrence}</TableCell>
                          <TableCell>{item.detection}</TableCell>
                          <TableCell className="font-bold">
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

              <Separator className="my-4" />

              <div className="flex items-center gap-4 text-sm">
                <span>
                  Суммарный риск:{" "}
                  <span className="font-bold">{result.total_risk}</span>
                </span>
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
                    <li key={i} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
