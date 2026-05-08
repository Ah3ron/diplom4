import { useState, useRef } from "react"
import { uploadFile } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Upload as UploadIcon, FileSpreadsheet, FileText } from "lucide-react"

export function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    message: string
    rows: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const res = await uploadFile(file)
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Загрузка данных</h1>

      <Card>
        <CardHeader>
          <CardTitle>Загрузить файл</CardTitle>
          <CardDescription>
            Поддерживаются форматы CSV и Excel (.xlsx, .xls). Данные будут
            автоматически распознаны и добавлены в базу.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 transition-colors"
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleChange}
              className="hidden"
            />
            <UploadIcon className="mb-4 size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {dragActive
                ? "Отпустите файл для загрузки"
                : "Перетащите файл сюда или нажмите для выбора"}
            </p>
            <div className="mt-2 flex gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileSpreadsheet className="size-3" /> .xlsx
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="size-3" /> .csv
              </span>
            </div>
          </div>

          {uploading && (
            <div className="mt-4 text-sm text-muted-foreground">
              Загрузка...
            </div>
          )}

          {result && (
            <div className="mt-4 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              {result.message} (обработано строк: {result.rows})
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              Ошибка: {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Шаблоны данных</CardTitle>
          <CardDescription>
            Формат колонок для корректной загрузки файлов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <TemplateSection
              title="Несчастные случаи"
              columns={[
                "date (дата)",
                "department (отдел)",
                "incident_type (тип)",
                "severity (тяжесть: лёгкий/средний/тяжёлый/смертельный)",
                "days_lost (дни нетрудоспособности)",
                "description (описание)",
              ]}
            />
            <TemplateSection
              title="Отказы оборудования"
              columns={[
                "date (дата)",
                "equipment_type (тип оборудования)",
                "equipment_name (название)",
                "operating_hours (наработка, ч)",
                "downtime_hours (время простоя, ч)",
                "failure_cause (причина)",
                "repair_cost (стоимость ремонта)",
              ]}
            />
            <TemplateSection
              title="Нарушения ТБ"
              columns={[
                "date (дата)",
                "department (отдел)",
                "violation_type (тип нарушения)",
                "is_audit_finding (результат аудита: true/false)",
                "responsible (ответственный)",
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TemplateSection({
  title,
  columns,
}: {
  title: string
  columns: string[]
}) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap gap-1">
        {columns.map((col) => (
          <code
            key={col}
            className="rounded bg-muted px-1.5 py-0.5 text-xs"
          >
            {col}
          </code>
        ))}
      </div>
    </div>
  )
}
