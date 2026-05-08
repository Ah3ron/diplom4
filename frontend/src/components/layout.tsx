import { NavLink, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  Upload,
  TableProperties,
  AlertTriangle,
  ClipboardList,
  BarChart3,
  Download,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Дашборд" },
  { to: "/upload", icon: Upload, label: "Загрузка данных" },
  { to: "/data", icon: TableProperties, label: "Данные" },
  { to: "/risk-matrix", icon: AlertTriangle, label: "Матрица рисков" },
  { to: "/fmea", icon: ClipboardList, label: "FMEA-анализ" },
  { to: "/statistics", icon: BarChart3, label: "Статистика" },
  { to: "/export", icon: Download, label: "Экспорт" },
]

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Оценка рисков</span>
              <span className="text-xs text-muted-foreground">ЗАО «СИПР»</span>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Навигация</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            isActive ? "data-active" : ""
                          }
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">
              Программный модуль оценки производственных рисков
            </span>
          </header>
          <div className="flex-1 overflow-auto p-4">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
