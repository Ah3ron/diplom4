const API_BASE = "http://localhost:8000/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function uploadFile(file: File): Promise<{ message: string; rows: number }> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json()
}

export async function exportExcel(dataType: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/excel?data_type=${dataType}`)
  if (!res.ok) throw new Error(res.statusText)
  return res.blob()
}

export async function exportPdf(dataType: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/pdf?data_type=${dataType}`)
  if (!res.ok) throw new Error(res.statusText)
  return res.blob()
}

export const api = {
  incidents: {
    list: () => request<any[]>("/incidents/"),
    create: (data: any) => request<any>("/incidents/", { method: "POST", body: JSON.stringify(data) }),
    statistics: () => request<any>("/incidents/statistics"),
  },
  equipment: {
    list: () => request<any[]>("/equipment/"),
    create: (data: any) => request<any>("/equipment/", { method: "POST", body: JSON.stringify(data) }),
    statistics: () => request<any>("/equipment/statistics"),
  },
  safety: {
    list: () => request<any[]>("/safety/"),
    create: (data: any) => request<any>("/safety/", { method: "POST", body: JSON.stringify(data) }),
    statistics: () => request<any>("/safety/statistics"),
  },
  risk: {
    fmea: (params: string) => request<any>(`/risk/fmea?${params}`),
    history: () => request<any[]>("/risk/history"),
  },
  statistics: {
    descriptive: (params: string) => request<any>(`/statistics/descriptive?${params}`),
    trend: (params: string) => request<any>(`/statistics/trend?${params}`),
    poisson: (params: string) => request<any>(`/statistics/poisson?${params}`),
    dashboard: () => request<any>("/statistics/dashboard"),
  },
}
