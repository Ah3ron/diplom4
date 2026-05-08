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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface MatrixCell {
  likelihood: number
  severity: number
  risk_level: string
  color: string
}

interface MatrixResult {
  matrix: MatrixCell[][]
  likelihood_labels: string[]
  severity_labels: string[]
}

interface RiskAssessment {
  id: number
  method: string
  name: string
  input_params: any
  result: any
  created_at: string
  author: string
}

const DEFAULT_ITEMS = [
  "Взрыв метана",
  "Обрушение кровли",
  "Отказ горно-шахтного оборудования",
  "Химический выброс",
  "Поражение электрическим током",
  "Падение с высоты",
  "Ошибки оператора",
  "Нарушение ТБ",
]

export function RiskMatrixPage() {
  const [hazard, setHazard] = useState("")
  const [likelihood, setLikelihood] = useState("3")
  const [severity, setSeverity] = useState("3")
  const [matrix, setMatrix] = useState<MatrixResult | null>(null)
  const [results, setResults] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMatrix() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.risk.matrix({
        hazard_name: hazard || "Не указано",
        likelihood: Number(likelihood),
        severity: Number(severity),
      })
      setMatrix(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    try {
      const hist = await api.risk.history()
      setResults(hist)
    } catch {}
  }

  useEffect(() => {
    loadMatrix()
    loadHistory()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Матрица рисков 5×5</h1>

      <Card>
        <CardHeader>
          <CardTitle>Оценка риска</CardTitle>
          <CardDescription>
            Выберите вероятность и тяжесть для идентификации опасности
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Опасность</label>
              <Input
                value={hazard}
                onChange={(e) => setHazard(e.target.value)}
                placeholder="Описание опасности"
                className="w-64"
                list="hazards"
              />
              <datalist id="hazards">
                {DEFAULT_ITEMS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Вероятность (1-5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={likelihood}
                onChange={(e) => setLikelihood(e.target.value)}
                className="w-24"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Тяжесть (1-5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-24"
              />
            </div>
            <Button onClick={loadMatrix} disabled={loading}>
              Оценить
            </Button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-destructive">{error}</div>
          )}
        </CardContent>
      </Card>

      {matrix && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Матрица рисков</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-xs">
                      Вероятность \ Тяжесть
                    </th>
                    {matrix.severity_labels.map((label, i) => (
                      <th key={i} className="border p-2 text-xs">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...matrix.matrix]
                    .reverse()
                    .map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="border p-2 text-xs font-medium">
                          {matrix.likelihood_labels[matrix.matrix.length - 1 - rowIdx]}
                        </td>
                        {row.map((cell, colIdx) => {
                          const isSelected =
                            cell.likelihood === Number(likelihood) &&
                            cell.severity === Number(severity)
                          return (
                            <td
                              key={colIdx}
                              className="border p-2 text-center text-xs font-medium"
                              style={{
                                backgroundColor: cell.color,
                                color: "white",
                                outline: isSelected
                                  ? "3px solid black"
                                  : "none",
                                outlineOffset: "-3px",
                              }}
                            >
                              {cell.risk_level}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="inline-block size-4 rounded bg-green-600" />{" "}
                Низкий
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="inline-block size-4 rounded bg-yellow-500" />{" "}
                Средний
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="inline-block size-4 rounded bg-orange-500" />{" "}
                Высокий
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="inline-block size-4 rounded bg-red-600" />{" "}
                Очень высокий
              </div>
            </div>

            {hazard && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-medium">
                  Результат для «{hazard}»:
                </span>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor:
                      matrix.matrix[Number(likelihood) - 1]?.[
                        Number(severity) - 1
                      ]?.color,
                    color: "white",
                  }}
                >
                  {matrix.matrix[Number(likelihood) - 1]?.[
                    Number(severity) - 1
                  ]?.risk_level || "—"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">История оценок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {results
                .filter((r) => r.method === "risk_matrix")
                .slice(-10)
                .reverse()
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("ru")}
                      </span>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: r.result?.color,
                        color: "white",
                      }}
                    >
                      {r.result?.risk_level}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
