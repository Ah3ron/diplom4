import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Incident {
  id: number
  date: string
  department: string
  incident_type: string
  severity: string
  days_lost: number
  description: string
}

interface EquipmentFailure {
  id: number
  date: string
  equipment_type: string
  equipment_name: string
  operating_hours: number
  downtime_hours: number
  failure_cause: string
  repair_cost: number
}

interface SafetyViolation {
  id: number
  date: string
  department: string
  violation_type: string
  is_audit_finding: boolean
  responsible: string
}

function severityVariant(s: string) {
  switch (s) {
    case "смертельный":
      return "destructive"
    case "тяжёлый":
      return "destructive"
    case "средний":
      return "secondary"
    case "лёгкий":
      return "outline"
    default:
      return "secondary"
  }
}

export function DataPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Данные</h1>
      <Tabs defaultValue="incidents">
        <TabsList>
          <TabsTrigger value="incidents">Несчастные случаи</TabsTrigger>
          <TabsTrigger value="equipment">Отказы оборудования</TabsTrigger>
          <TabsTrigger value="safety">Нарушения ТБ</TabsTrigger>
        </TabsList>
        <TabsContent value="incidents">
          <IncidentsTable />
        </TabsContent>
        <TabsContent value="equipment">
          <EquipmentTable />
        </TabsContent>
        <TabsContent value="safety">
          <SafetyTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IncidentsTable() {
  const [data, setData] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.incidents
      .list()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Несчастные случаи ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Нет данных. Загрузите файл на странице «Загрузка».
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Отдел</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Тяжесть</TableHead>
                  <TableHead>Дни нетрудосп.</TableHead>
                  <TableHead>Описание</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.date}
                    </TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.incident_type}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(row.severity)}>
                        {row.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.days_lost}</TableCell>
                    <TableCell className="max-w-64 truncate">
                      {row.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EquipmentTable() {
  const [data, setData] = useState<EquipmentFailure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.equipment
      .list()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Отказы оборудования ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Нет данных. Загрузите файл на странице «Загрузка».
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Наработка (ч)</TableHead>
                  <TableHead>Простой (ч)</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Стоимость</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.date}
                    </TableCell>
                    <TableCell>{row.equipment_type}</TableCell>
                    <TableCell>{row.equipment_name}</TableCell>
                    <TableCell>{row.operating_hours}</TableCell>
                    <TableCell>{row.downtime_hours}</TableCell>
                    <TableCell className="max-w-48 truncate">
                      {row.failure_cause}
                    </TableCell>
                    <TableCell>{row.repair_cost?.toLocaleString("ru")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SafetyTable() {
  const [data, setData] = useState<SafetyViolation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.safety
      .list()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-96" />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Нарушения ТБ ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Нет данных. Загрузите файл на странице «Загрузка».
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Отдел</TableHead>
                  <TableHead>Тип нарушения</TableHead>
                  <TableHead>Аудит</TableHead>
                  <TableHead>Ответственный</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.date}
                    </TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.violation_type}</TableCell>
                    <TableCell>
                      <Badge variant={row.is_audit_finding ? "destructive" : "secondary"}>
                        {row.is_audit_finding ? "Да" : "Нет"}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.responsible}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
