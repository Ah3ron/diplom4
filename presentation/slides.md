---
theme: seriph
title: Программный модуль оценки производственных рисков
author: Лешкевич А.П.
transition: slide-left
colorSchema: light
fonts:
  sans: Inter
  serif: PT Serif
  mono: Fira Code
themeConfig:
  primary: "#4f46e5"
---

# Программный модуль оценки производственных рисков на основе статистических моделей

Дипломный проект

ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством»

<div class="abs-bl m-6 text-sm opacity-50">
Студент группы 21ИТ-1: Лешкевич А.П. · Научный руководитель: Ю.М. Вишняков · ПИНСК 2025
</div>

---

# Актуальность, цель и задачи

ЗАО «СИПР» — 1300+ сотрудников, 117 станков с ЧПУ, производство для ОАО «Беларуськалий». Текущий ручной расчёт рисков в Excel порождает субъективность оценки и отсутствие единой аналитической базы.

<div class="grid grid-cols-4 gap-4 mt-4">
<div class="p-3 rounded bg-indigo-50 border border-indigo-100 text-xs">

**1. Предметная область**

Анализ производственных рисков СИПР и нормативной базы

</div>
<div class="p-3 rounded bg-indigo-50 border border-indigo-100 text-xs">

**2. Проектирование**

Архитектура, БД (6 таблиц), UML-диаграммы

</div>
<div class="p-3 rounded bg-indigo-50 border border-indigo-100 text-xs">

**3. Статистические модели**

Описательная статистика, тренд, Пуассон, корреляция, FMEA

</div>
<div class="p-3 rounded bg-indigo-50 border border-indigo-100 text-xs">

**4. Разработка и тестирование**

FastAPI + React, 10 тест-примеров

</div>
</div>

---

# Предприятие — ЗАО «СИПР»

<div class="grid grid-cols-2 gap-6 text-sm">
<div>

**ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством»**

- Основан в 1991 г., г. Солигорск
- **1300+** сотрудников
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

### Текущий подход

- Ручная оценка рисков (матрица)
- Высокая субъективность
- Большие объёмы не обрабатываются
- Нет динамического обновления

</div>
<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">

### Необходимое решение

- Автоматизация на основе **статистических методов**
- Объективная количественная оценка
- Хранение исторических данных
- Формирование отчётов по ГОСТ

</div>
</div>

<br/>

<div class="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-sm">
Вывод: аналоги (SAP EHS, Intelex, Dyadem) не подходят — стоимость, нет локализации, закрытый код
</div>

---

# Сравнительный анализ аналогов

| Критерий | SAP EHS | Intelex | Dyadem | **Наш модуль** |
| --- | --- | --- | --- | --- |
| Стоимость | Очень высокая | Высокая | Высокая | **Низкая** |
| Локализация RU/BY | Нет | Нет | Нет | **Полная** |
| Статист. модели | Ограничены | Базовые | Базовые | **5 методов** |
| FMEA-анализ | Платный | Нет | Да | **Автоматич.** |
| Исходный код | Закрытый | Закрытый | Закрытый | **Открытый** |
| Отчёты по ГОСТ | Нет | Нет | Нет | **Да** |

<div class="mt-2 text-sm opacity-70">
Разрабатываемый модуль превосходит аналоги за счёт отраслевой специализации, локализации и минимальной стоимости.
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
<div>

<img src="/diagrams/physical_model.png" class="w-full max-h-[40vh] object-contain" />

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

# Модель данных — Концептуальная

<img src="/diagrams/conceptual_model.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Модель данных — Логическая

<img src="/diagrams/logical_model.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Модель данных — Физическая

<img src="/diagrams/physical_model.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Алгоритм функционирования

<img src="/diagrams/algorithm.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Диаграмма вариантов использования

<img src="/diagrams/use_case.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Диаграмма классов

<img src="/diagrams/class_diagram.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Диаграмма последовательности

<img src="/diagrams/sequence_diagram.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Интерфейс — Дашборд

<img src="/screenshots/dashboard.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Модули статистического анализа

<div class="grid grid-cols-2 gap-4 text-sm">
<div class="p-4 rounded-xl bg-blue-50 border border-blue-100">

### Описательная статистика

Количество, среднее, медиана, СКО, мин/макс, квартили Q1/Q3

</div>
<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-100">

### Тренд-анализ

Линейная регрессия (OLS), прогноз с 95% доверит. интервалом, R², p-value

</div>
<div class="p-4 rounded-xl bg-violet-50 border border-violet-100">

### Анализ Пуассона

Оценка λ (MLE), распределение вероятностей, χ²-критерий, 95% ДИ

</div>
<div class="p-4 rounded-xl bg-amber-50 border border-amber-100">

### FMEA-анализ

S, O, D из данных БД → RPN = S × O × D с 95% ДИ (бутстрэп 1000 итераций)

</div>
</div>

<br/>

<div class="p-3 rounded-xl bg-cyan-50 border border-cyan-100 text-sm">

**Корреляционный анализ:** Пирсон r, Спирмен ρ, p-value для 3 пар (инциденты ↔ отказы ↔ нарушения)

</div>

---

# Тренд-анализ — интерфейс

<img src="/screenshots/statistics_trend.png" class="max-h-[42vh] object-contain mx-auto" />

---

# FMEA-анализ — интерфейс

<img src="/screenshots/fmea.png" class="max-h-[42vh] object-contain mx-auto" />

---

# Математические модели — регрессия и прогноз

<div class="text-sm">

**Линейная регрессия (OLS):**

$$y = a \cdot x + b, \quad a = \text{slope}, \; b = \text{intercept}$$

**Коэффициент детерминации:**

$$R^2 = r^2 \quad \text{(из } \texttt{scipy.stats.linregress)}$$

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

**95%-ный доверительный интервал для λ·T:**

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

**95% доверительный интервал RPN:** бутстрэп с 1000 итерациями

</div>

---

# Экономические показатели

<div class="grid grid-cols-2 gap-6 text-sm">
<div>

### Затраты на разработку

| Статья | BYN |
| --- | --- |
| Оплата труда | 80 235 |
| Соц. отчисления | 27 360 |
| Материалы | 229 |
| Амортизация | 976 |
| Прочие | 8 024 |
| **Итого** | **116 824** |

</div>
<div>

### Эффективность

| Показатель | Значение |
| --- | --- |
| Годовая экономия | **17 352 BYN** |
| ROI | 14.9% |
| Окупаемость | **6.7 года** |
| NPV (5 лет) | −50 637 BYN |

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

1. Анализ предметной области СИПР
2. Обоснование собственной разработки
3. БД: 3 модели, 6 таблиц, SQLite
4. FastAPI + React, 5 методов анализа
5. Тестирование: 10/10 пройдено
6. Экономика: 116 824 BYN, окупаемость 6.7 года
7. Охрана труда: мероприятия разработаны

</div>

<br/>

<div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 inline-block text-sm">
Модуль рекомендован к внедрению на ЗАО «СИПР»
</div>

---

# Спасибо за внимание

<div class="mt-6">
<img src="/qr-repo.png" class="w-24 mx-auto rounded-xl shadow" />
<div class="mt-2 text-xs opacity-50">github.com/Ah3ron/diplom4</div>
</div>
