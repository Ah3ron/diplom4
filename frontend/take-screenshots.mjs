import { chromium } from "@playwright/test"
import { existsSync, mkdirSync } from "fs"
import { resolve } from "path"

const FRONTEND_URL = "http://localhost:5173"
const SCREENSHOTS_DIR = resolve(import.meta.dirname, "screenshots")
const MAX_HEIGHT = 2000
const TIMEOUT = 45000

async function waitForServer(url, label) {
  const start = Date.now()
  while (Date.now() - start < TIMEOUT) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 800))
  }
  throw new Error(`${label} not ready within ${TIMEOUT}ms`)
}

async function snap(page, name) {
  await page.waitForTimeout(300)
  const height = await page.evaluate(() => Math.min(document.body.scrollHeight, 2000))
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, clip: { x: 0, y: 0, width: 1440, height } })
  console.log(`  OK -> screenshots/${name}.png`)
}

async function main() {
  if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  console.log("Waiting for backend...")
  await waitForServer("http://localhost:8000/docs", "Backend")
  console.log("Backend ready")

  console.log("Waiting for frontend...")
  await waitForServer(FRONTEND_URL, "Frontend")
  console.log("Frontend ready")

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  console.log("Screenshot: dashboard")
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(4000)
  await snap(page, "dashboard")

  console.log("Screenshot: upload")
  await page.goto(`${FRONTEND_URL}/upload`, { waitUntil: "networkidle", timeout: 30000 })
  await snap(page, "upload")

  console.log("Screenshot: data")
  await page.goto(`${FRONTEND_URL}/data`, { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(3000)
  await snap(page, "data")

  console.log("Screenshot: statistics")
  await page.goto(`${FRONTEND_URL}/statistics`, { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(3000)
  await snap(page, "statistics")

  console.log("Screenshot: statistics_descriptive")
  await snap(page, "statistics_descriptive")

  console.log("Screenshot: statistics_trend")
  await page.click('button[role="tab"]:has-text("Тренд-анализ")')
  await page.waitForTimeout(3000)
  await snap(page, "statistics_trend")

  console.log("Screenshot: statistics_poisson")
  await page.click('button[role="tab"]:has-text("Анализ Пуассона")')
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Рассчитать")')
  await page.waitForResponse((res) => res.url().includes("/statistics/poisson") && res.status() === 200, { timeout: 15000 })
  await page.waitForTimeout(1500)
  await snap(page, "statistics_poisson")

  console.log("Screenshot: fmea")
  await page.goto(`${FRONTEND_URL}/fmea`, { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(1000)
  await page.click('button:has-text("Провести FMEA-анализ")')
  await page.waitForResponse((res) => res.url().includes("/risk/fmea") && res.status() === 200, { timeout: 15000 })
  await page.waitForTimeout(1500)
  await snap(page, "fmea")

  console.log("Screenshot: export")
  await page.goto(`${FRONTEND_URL}/export`, { waitUntil: "networkidle", timeout: 30000 })
  await snap(page, "export")

  await browser.close()
  console.log("\nAll screenshots done")
}

main()
