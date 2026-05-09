import { useState } from "react"
import { exportExcel, exportReport } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText } from "lucide-react"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportPage() {
  const [dataType, setDataType] = useState("incidents")
  const [period, setPeriod] = useState("monthly")
  const [forecastPeriods, setForecastPeriods] = useState("6")
  const [timePeriod, setTimePeriod] = useState("12")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSimpleExport() {
    setLoading("data-excel")
    setError(null)
    try {
      const blob = await exportExcel(dataType)
      downloadBlob(blob, `${dataType}_data.xlsx`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  async function handleFullReport() {
    setLoading("report-pdf")
    setError(null)
    try {
      const blob = await exportReport(
        dataType,
        period,
        parseInt(forecastPeriods),
        parseInt(timePeriod),
      )
      downloadBlob(blob, `risk_report_${dataType}.pdf`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Экспорт отчётов</h1>

      <Tabs defaultValue="full">
        <TabsList>
          <TabsTrigger value="full">Комплексный отчёт</TabsTrigger>
          <TabsTrigger value="data">Только данные</TabsTrigger>
        </TabsList>

        <TabsContent value="full">
          <Card>
            <CardHeader>
              <CardTitle>Комплексный отчёт по оценке рисков</CardTitle>
              <CardDescription>
                Включает: сводку, описательную статистику, тренд-анализ с
                прогнозом, распределение Пуассона, FMEA-анализ. PDF-отчёт
                содержит графики и диаграммы.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Тип данных</label>
                    <Select value={dataType} onValueChange={setDataType}>
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="incidents">
                            Несчастные случаи
                          </SelectItem>
                          <SelectItem value="equipment">
                            Отказы оборудования
                          </SelectItem>
                          <SelectItem value="safety">
                            Нарушения ТБ
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Группировка</label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="monthly">По месяцам</SelectItem>
                          <SelectItem value="quarterly">
                            По кварталам
                          </SelectItem>
                          <SelectItem value="yearly">По годам</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">
                      Периодов прогноза
                    </label>
                    <Select
                      value={forecastPeriods}
                      onValueChange={setForecastPeriods}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">
                      Период Пуассона
                    </label>
                    <Select value={timePeriod} onValueChange={setTimePeriod}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="24">24</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => handleFullReport()}
                  disabled={loading !== null}
                >
                  {loading === "report-pdf" ? (
                    "Генерация..."
                  ) : (
                    <>
                      <FileText data-icon="inline-start" />
                      Скачать PDF с графиками
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Содержание комплексного отчёта
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div>
                  <strong>1. Общая сводка</strong> — суммарные показатели,
                  диаграммы по цехам и тяжести
                </div>
                <div>
                  <strong>2. Описательная статистика</strong> — count, mean,
                  std, min, max, медиана, квартили
                </div>
                <div>
                  <strong>3. Тренд-анализ</strong> — линейная экстраполяция,
                  прогноз с 95% доверительным интервалом
                </div>
                <div>
                  <strong>4. Анализ Пуассона</strong> — λ, распределение, P(0),
                  P(≥1), доверительный интервал
                </div>
                <div>
                  <strong>5. FMEA-анализ</strong> — автоматический расчёт
                  S/O/D, RPN, приоритеты, рекомендации
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Экспорт исходных данных</CardTitle>
              <CardDescription>
                Таблица с записями без аналитики. Подходит для дальнейшей
                обработки.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Тип данных</label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="incidents">
                          Несчастные случаи
                        </SelectItem>
                        <SelectItem value="equipment">
                          Отказы оборудования
                        </SelectItem>
                        <SelectItem value="safety">Нарушения ТБ</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleSimpleExport()}
                  disabled={loading !== null}
                >
                  {loading === "data-excel" ? (
                    "Экспорт..."
                  ) : (
                    <>
                      <Download data-icon="inline-start" />
                      Excel
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
