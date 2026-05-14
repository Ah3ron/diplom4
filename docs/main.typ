// main.typ — Точка входа дипломного проекта
// Компиляция: typst compile docs/main.typ docs/diploma.pdf --root .

#import "@preview/modern-g7-32:0.2.0": abstract, appendixes, gost

#import "@preview/pintorita:0.1.4"
#show raw.where(lang: "pintora"): it => pintorita.render(it.text, style: "default")

#show: gost.with(
  ministry: "Министерство образования Республики Беларусь",
  organization: (
    full: "Учреждение образования «Белорусско-Российский университет»",
    short: "Белорусско-Российский университет",
  ),
  about: "О дипломном проекте",
  subject: "Программный модуль оценки производственных рисков ЗАО «Солигорский институт проблем ресурсосбережения» на основе статистических моделей",
  manager: (name: "И.О. Руководитель", position: "Старший преподаватель"),
  city: "Могилёв",
  performers: (
    (name: "А.Р. Студент", position: "Студент группы ПИ-191"),
  ),
  add-pagebreaks: true,
)

// ── Нумерация глав: «ГЛАВА 1» + название по центру ──────────────
#show heading.where(level: 1): it => {
  if it.numbering != none {
    context {
      let n = counter(heading).get().first()
      pagebreak(weak: true)
      align(center)[
        #text(weight: "bold", size: 14pt)[ГЛАВА #n]
        #linebreak()
        #text(weight: "bold", size: 14pt)[#it.body]
      ]
    }
  } else {
    pagebreak(weak: true)
    align(center, text(weight: "bold", size: 14pt, upper(it.body)))
  }
}

// show raw/code blocks in figures as Рисунок not Листинг
#show figure.where(kind: raw): set figure(supplement: [Рисунок])

// Нумерация рисунков: Рисунок 2.2 (глава.номер_в_главе)
#set figure(numbering: n => {
  context {
    let ch = counter(heading).get()
    if ch.len() > 0 {
      let chapter-num = ch.first()
      [#chapter-num.#n]
    } else {
      [#n]
    }
  }
})

// ── Оглавление: «ГЛАВА 1  НАЗВАНИЕ .... страница» ──────────────
// Структурные разделы — капсом
#show outline.entry.where(level: 1): it => {
  let in-appendix = state("appendixes", false).at(it.element.location())
  if it.element.numbering != none and not in-appendix {
    link(it.element.location(), it.indented(
      none,
      [ГЛАВА #it.prefix()] + sym.space + it.element.body + sym.space + box(width: 1fr, it.fill) + it.page(),
    ))
  } else if it.element.numbering == none and not in-appendix {
    link(it.element.location(), it.indented(
      none,
      upper(it.element.body) + sym.space + box(width: 1fr, it.fill) + it.page(),
    ))
  } else {
    it
  }
}

#abstract(
  "оценка рисков",
  "FMEA",
  "анализ Пуассона",
  "тренд-анализ",
  "программный модуль",
  "статистические модели",
  "FastAPI",
  "React",
)[
  Дипломный проект: 58 страниц, 18 рисунков, 13 таблиц, 31 источник, 4 приложения.

  Ключевые слова: оценка рисков, FMEA, анализ Пуассона, тренд-анализ, программный модуль, статистические модели, база данных, веб-приложение, FastAPI, React.

  Объект исследования — производственные риски ЗАО «Солигорский институт проблем ресурсосбережения с опытным производством».

  Предмет исследования — методы и программные средства оценки производственных рисков на основе статистических моделей.

  Цель работы — разработка программного модуля оценки производственных рисков на основе статистических моделей (описательная статистика, тренд-анализ с прогнозом, анализ Пуассона, FMEA-анализ). Программный модуль реализован по клиент-серверной архитектуре: серверная часть на Python 3.13 + FastAPI, клиентская на React 19 + TypeScript. База данных — SQLite через SQLAlchemy ORM.
]

#outline(title: [Оглавление])

// ── Перечень условных обозначений ──────────────────────────────
#include "abbreviations.typ"

// ── Введение ───────────────────────────────────────────────────
#include "introduction.typ"

// ── Глава 1 ────────────────────────────────────────────────────
#include "chapter1.typ"

// ── Глава 2 ────────────────────────────────────────────────────
#include "chapter2.typ"

// ── Глава 3 ────────────────────────────────────────────────────
#include "chapter3.typ"

// ── Глава 4 ────────────────────────────────────────────────────
#include "chapter4.typ"

// ── Глава 5 ────────────────────────────────────────────────────
#include "chapter5.typ"

// ── Заключение ─────────────────────────────────────────────────
#include "conclusion.typ"

// ── Список использованных источников ───────────────────────────
#bibliography("refs.bib")

// ── Приложения ─────────────────────────────────────────────────
#show: appendixes
#show heading: set align(right)

#include "appendix-a.typ"
#include "appendix-b.typ"
#include "appendix-c.typ"
#include "appendix-d.typ"
