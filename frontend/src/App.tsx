import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout"
import { DashboardPage } from "@/pages/dashboard"
import { UploadPage } from "@/pages/upload"
import { DataPage } from "@/pages/data"

import { FMEAPage } from "@/pages/fmea"
import { StatisticsPage } from "@/pages/statistics"
import { ExportPage } from "@/pages/export"
import { Toaster } from "@/components/ui/sonner"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="data" element={<DataPage />} />
          <Route path="fmea" element={<FMEAPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="export" element={<ExportPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
