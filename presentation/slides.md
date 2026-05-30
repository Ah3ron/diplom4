---
theme: seriph
title: Программный модуль оценки производственных рисков
info: Дипломный проект — защита
author: Лешкевич
transition: slide-left
colorSchema: light
layout: center
class: text-center
fonts:
  sans: Inter
  serif: PT Serif
  mono: Fira Code
themeConfig:
  primary: "#4f46e5"
---

<style>
h1 {
  background: linear-gradient(135deg, #312e81, #4f46e5, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>

<div class="text-3xl font-bold leading-tight">
  Программный модуль оценки<br/>
  производственных рисков<br/>
  <span style="background: linear-gradient(135deg, #4f46e5, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">на основе статистических моделей</span>
</div>

<div class="pt-6 text-base opacity-70">
  Дипломный проект
</div>

<div class="pt-2 text-sm opacity-50">
  ЗАО «Солигорский институт проблем ресурсосбережения с опытным производлением»
</div>

<div class="absolute bottom-4 right-6 text-xs opacity-40">
  2025
</div>

---

# Цель и задачи

<div class="mt-2 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-sm">
<strong>Цель:</strong> разработка программного модуля оценки производственных рисков ЗАО «СИПР» на основе статистических моделей
</div>

<br/>

<div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
<div class="p-3 rounded-lg bg-white shadow-sm border border-gray-100">

1. Анализ предметной области
2. Сравнительный анализ аналогов
3. Проектирование базы данных

</div>
<div class="p-3 rounded-lg bg-white shadow-sm border border-gray-100">

1. Разработка программного модуля
2. Тестирование и отладка
3. Расчёт экономических показателей
4. Мероприятия по охране труда

</div>
</div>

---

# Предприятие — ЗАО «СИПР»

<div class="grid grid-cols-2 gap-6 text-sm">
<div>

**ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством»**

- Основан в 1991 г., г. Солигорск
- **1 300+** сотрудников
- 391 патент, 256 наименований продукции
- Заказчик — ОАО «Беларуськалий»
- ISO 9001, ISO 45001

</div>
<div>

**5 категорий производственных рисков:**

1. Технологические (отказы оборудования)
2. Травматизм персонала
3. Взрыво- и газоопасность
4. Геомеханические процессы
5. Химические воздействия

**117 станков с ЧПУ** — высокая аварийность

</div>
</div>

---

# Проблематика

<div class="grid grid-cols-2 gap-6 text-sm">
<div class="p-4 rounded-xl bg-red-50 border border-red-100">

### 🔴 Текущий подход

- Ручная оценка рисков (матрица)
- Высокая субъективность
- Большие объёмы не обрабатываются
- Нет динамического обновления

</div>
<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">

### 🟢 Необходимое решение

- Автоматизация на основе **статистических методов**
- Объективная количественная оценка
- Хранение исторических данных
- Формирование отчётов по ГОСТ

</div>
</div>

<br/>

<div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm">
<strong>Вывод:</strong> аналоги (SAP EHS, Intelex, Dyadem) не подходят — стоимость, нет локализации, закрытый код
</div>

---

# Сравнительный анализ аналогов

<div class="text-sm">

| Критерий          | SAP EHS    | Intelex  | Dyadem   | **Наш модуль** |
| ----------------- | ---------- | -------- | -------- | -------------- |
| Стоимость         | Высокая    | Высокая  | Высокая  | **Низкая**     |
| Локализация RU/BY | Нет        | Нет      | Нет      | **Да**         |
| Статист. модели   | Ограничены | Базовые  | Базовые  | **4 метода**   |
| FMEA-анализ       | Платный    | Нет      | Да       | **Автоматич.** |
| Исходный код      | Закрытый   | Закрытый | Закрытый | **Открытый**   |
| Отчёты по ГОСТ    | Нет        | Нет      | Нет      | **Да**         |

</div>

---

# Обоснование входных данных

<div class="text-xs">

| Поле | Нормативная база | Метод анализа |
| --- | --- | --- |
| date | СТБ ISO 45001 — хронорегистрация | Тренд, Пуассон, группировка |
| department_id | ГОСТ 12.0.230 — учёт по подразделениям | Фильтрация, FMEA, дашборд |
| severity | ГОСТ Р 51901 — шкала тяжести | FMEA: S (Severity) |
| days_lost | Закон «Об охране труда» — нетрудоспособность | Описательная статистика, тренд |
| equipment_type | ISO 45001 — идентификация оборудования | FMEA: группировка |
| operating_hours | ГОСТ Р 51901 — наработка на отказ | MTBF, O (Occurrence) |
| downtime_hours | ISO 45001 — учёт простоев | FMEA: S, описательная статистика |
| failure_cause | ISO/IEC 31010 — анализ причин | FMEA: виды отказов |
| violation_type | ГОСТ 12.0.230 — классификация нарушений | Корреляция, FMEA: D |
| is_audit_finding | СТБ ISO 45001 — результаты аудитов | FMEA: D (Detection) |

</div>

---

# Интерпретация результатов

<div class="grid grid-cols-2 gap-4 text-sm">
<div class="p-3 rounded-xl bg-blue-50 border border-blue-100">

### Тренд-анализ
- Растущий тренд → **тревога**
- p < 0.05 → значим
- R² > 0.7 → прогноз надёжен

</div>
<div class="p-3 rounded-xl bg-emerald-50 border border-emerald-100">

### Пуассон
- P(X≥1) > 0.9 → критический риск
- χ² p > 0.05 → модель адекватна

</div>
<div class="p-3 rounded-xl bg-amber-50 border border-amber-100">

### FMEA (RPN)
- < 50 — мониторинг
- 50–150 — план мероприятий
- \> 150 — **немедленные действия**

</div>
<div class="p-3 rounded-xl bg-violet-50 border border-violet-100">

### Корреляция
- \|r\| > 0.7 — сильная связь
- p < 0.05 — значима
- Инциденты ↔ отказы → приоритет ТОиР

</div>
</div>

---

# Модель данных

<div class="grid grid-cols-2 gap-6">
<div class="text-sm">

**3 уровня проектирования:**

1. Концептуальная модель
2. Логическая модель
3. Физическая модель (SQLite)

**6 таблиц:**

- departments
- incidents
- equipment_failures
- safety_violations
- medical_exams
- risk_assessments

</div>
<div class="flex items-center">

<img src="/diagrams/physical_model.png" class="w-full max-h-[50vh] object-contain rounded-xl shadow-lg" />

</div>
</div>

---

# Архитектура системы

<div class="grid grid-cols-2 gap-6 text-sm">
<div class="p-4 rounded-xl bg-blue-50 border border-blue-100">

**Frontend:**

- React 19 + TypeScript
- shadcn/ui, recharts

</div>
<div class="p-4 rounded-xl bg-violet-50 border border-violet-100">

**Backend:**

- FastAPI (Python 3.13)
- pandas, SciPy

</div>
<div class="p-4 rounded-xl bg-cyan-50 border border-cyan-100">

**База данных:**

- SQLite + SQLAlchemy (async)

</div>
<div class="p-4 rounded-xl bg-amber-50 border border-amber-100">

**~6 000** строк кода (3 500 + 2 500)
Async API, RESTful, открытый код

</div>
</div>

---

<div class="flex flex-col items-center">

# Алгоритм работы модуля

<img src="/diagrams/algorithm.png" class="max-h-[40vh] object-contain rounded-xl shadow-lg mt-2" />

</div>

---

# Функциональные возможности

<div class="grid grid-cols-2 gap-6">
<div class="text-sm">

**9 вариантов использования:**

1. Загрузка данных (CSV/Excel)
2. Просмотр и фильтрация
3. Дашборд с аналитикой
4. Описательная статистика
5. Тренд-анализ с прогнозом
6. Анализ Пуассона
7. FMEA-анализ (автомат.)
8. Экспорт PDF (ГОСТ)
9. Экспорт в Excel

</div>
<div class="flex items-center">

<img src="/diagrams/use_case.png" class="w-full max-h-[48vh] object-contain rounded-xl shadow-lg" />

</div>
</div>

---

<div class="flex flex-col items-center">

# Интерфейс — Дашборд

<img src="/screenshots/dashboard.png" class="max-h-[52vh] object-contain rounded-xl shadow-lg mt-2" />

</div>

---

# Методы анализа

<div class="grid grid-cols-2 gap-4 text-sm">
<div class="p-4 rounded-xl bg-blue-50 border border-blue-100">

### 📊 Описательная статистика

Количество, среднее, медиана, СКО, мин/макс, квартили Q1/Q3

</div>
<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">

### 📈 Тренд-анализ

Линейная регрессия, прогноз с 95% доверит. интервалом, R²

</div>
<div class="p-4 rounded-xl bg-violet-50 border border-violet-100">

### 🔢 Анализ Пуассона

Оценка λ, распределение вероятностей, 95% доверит. интервал

</div>
<div class="p-4 rounded-xl bg-amber-50 border border-amber-100">

### ⚠️ FMEA-анализ

S, O, D из данных БД → RPN = S × O × D, ранжирование

</div>
</div>

---

# Математические модели — регрессия и прогноз

<div class="text-sm">

**Линейная регрессия (OLS):**

$$y = a \cdot x + b, \quad a = \text{slope}, \; b = \text{intercept}$$

**Коэффициент детерминации:**

$$R^2 = r^2 \quad \text{(из } \texttt{scipy.stats.linregress)}$$

**Прогноз:**

$$\hat{y}_i = a \cdot x_i + b, \quad x_i > n$$

**95%-ный доверительный интервал прогноза:**

$$\hat{y}_i \pm t_{0.975,\, n-2} \cdot s_e \sqrt{1 + \frac{1}{n} + \frac{(x_i - \bar{x})^2}{\sum(x_j - \bar{x})^2}}$$

где $s_e = \sqrt{\frac{\sum(y_j - \hat{y}_j)^2}{n - 2}}$ — стандартная ошибка регрессии

</div>

---

# Математические модели — Пуассон

<div class="text-sm">

**Оценка параметра λ (MLE):**

$$\hat{\lambda} = \bar{X} = \frac{1}{n}\sum_{i=1}^{n} X_i$$

**Распределение вероятностей:**

$$P(X = k) = \frac{\lambda^k \cdot e^{-\lambda}}{k!}$$

**Вероятность хотя бы одного события:**

$$P(X \geq 1) = 1 - e^{-\lambda}$$

**95%-ный доверительный интервал для λ·T (многопериодный):**

$$\text{CI}_{0.95} = \texttt{scipy.stats.poisson.interval}(0.95,\; \hat{\lambda} \cdot T)$$

</div>

---

# Математические модели — FMEA

<div class="text-sm">

**Число приоритета риска:**

$$\text{RPN} = S \times O \times D \quad \in [1,\; 1000]$$

- **S (тяжесть)** — max из оценки по среднему простою и макс. тяжести инцидентов (1–10)
- **O (частота)** — количество отказов в месяц, приведённое к шкале 1–10
- **D (обнаружимость)** — на основе доли нарушений и результатов аудитов (1–10)

</div>

---

<div class="flex flex-col items-center">

# FMEA-анализ

<img src="/screenshots/fmea.png" class="max-h-[52vh] object-contain rounded-xl shadow-lg mt-2" />

</div>

---

<div class="flex flex-col items-center">

# Тренд-анализ

<img src="/screenshots/statistics_trend.png" class="max-h-[52vh] object-contain rounded-xl shadow-lg mt-2" />

</div>

---

# Экономические показатели

<div class="grid grid-cols-2 gap-6 text-sm">
<div>

### Затраты на разработку

| Статья          | BYN         |
| --------------- | ----------- |
| Оплата труда    | 80 235      |
| Соц. отчисления | 27 360      |
| Материалы       | 229         |
| Амортизация     | 976         |
| Прочие          | 8 024       |
| **Итого**       | **116 824** |

</div>
<div>

### Эффективность

| Показатель       | Значение       |
| ---------------- | -------------- |
| Годовая экономия | **17 352 BYN** |
| ROI              | 14.9%          |
| Окупаемость      | **6.7 года**   |
| NPV (5 лет)      | −50 637 BYN    |

<br/>

<div class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
Социальный проект — основной эффект: повышение промышленной безопасности
</div>

</div>
</div>

---

# Заключение

<div class="max-w-lg mx-auto text-left text-sm">

Все 7 задач дипломного проекта выполнены:

1. ✅ Анализ предметной области СИПР
2. ✅ Обоснование собственной разработки
3. ✅ БД: 3 модели, 6 таблиц, SQLite
4. ✅ FastAPI + React, 4 метода анализа
5. ✅ Тестирование: 10/10 пройдено
6. ✅ Экономика: 116 824 BYN, 6.7 года
7. ✅ Охрана труда: мероприятия разработаны

</div>

<br/>

<div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 inline-block text-sm">
<strong>Модуль рекомендован к внедрению на ЗАО «СИПР»</strong>
</div>

---

<style>
h1 {
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>

# Спасибо за внимание

<div class="mt-6">
  <img src="/qr-repo.png" class="w-24 mx-auto rounded-xl shadow" />
  <div class="mt-2 text-xs opacity-50">github.com/Ah3ron/diplom4</div>
</div>
