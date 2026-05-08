import { useState } from "react"
import { exportExcel, exportPdf } from "@/lib/api"
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
import { Download } from "lucide-react"

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
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExport(format: "excel" | "pdf") {
    setLoading(format)
    setError(null)
    try {
      const blob =
        format === "excel"
          ? await exportExcel(dataType)
          : await exportPdf(dataType)
      const ext = format === "excel" ? "xlsx" : "pdf"
      downloadBlob(blob, `${dataType}_report.${ext}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Экспорт отчётов</h1>

      <Card>
        <CardHeader>
          <CardTitle>Параметры экспорта</CardTitle>
          <CardDescription>
            Выберите тип данных и формат для скачивания отчёта
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
              onClick={() => handleExport("excel")}
              disabled={loading !== null}
            >
              {loading === "excel" ? (
                "Экспорт..."
              ) : (
                <>
                  <Download data-icon="inline-start" />
                  Скачать Excel
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              disabled={loading !== null}
            >
              {loading === "pdf" ? (
                "Экспорт..."
              ) : (
                <>
                  <Download data-icon="inline-start" />
                  Скачать PDF
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-destructive">{error}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Описание форматов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <strong>Excel (.xlsx)</strong> — таблица с данными, цветовая
              кодировка тяжести, автофильтры. Подходит для дальнейшего анализа.
            </div>
            <div>
              <strong>PDF</strong> — форматированный отчёт с заголовком,
              таблицей данных и сводкой. Подходит для печати и архивирования.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
