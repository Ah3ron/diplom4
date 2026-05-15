// Шаблон дипломного проекта по СТО 02-2023
// Использует show-правила для нативных Typst-конструкций

#let page-number-on = state("page-number-on", false)

#let appendix-numbering(..nums) = {
  let alphabet = (
    "А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К",
    "Л", "М", "Н", "О", "П", "Р", "С", "Т", "У", "Ф",
    "Х", "Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я",
  )
  alphabet.at(nums.pos().first() - 1)
}

#let template(body) = {
  set document(title: "Дипломный проект")

  set page(
    paper: "a4",
    margin: (top: 20mm, bottom: 20mm, left: 30mm, right: 15mm),
    footer: context {
      let page-num = counter(page).get().first()
      if page-number-on.get() {
        align(center)[#page-num]
      }
    },
  )

  set text(font: "Times New Roman", size: 14pt, lang: "ru")

  set par(
    justify: true,
    first-line-indent: (amount: 1.25cm, all: true),
    leading: 0.65em,
    spacing: 0.65em,
  )
  set block(spacing: 1.2em)

  set heading(numbering: "1.1")

  set footnote.entry(separator: line(length: 30mm, stroke: 0.5pt))
  show footnote.entry: set text(size: 10pt)

  // Pintora / raw-блоки внутри figure → «Рисунок»
  show figure.where(kind: raw): set figure(supplement: [Рисунок])

  // Нумерация формул: (1), (2), ...
  set math.equation(numbering: "(1)")

  // Нумерация рисунков/таблиц с префиксом главы (1.1, 2.3, ...)
  set figure(numbering: n => context {
    let ch = counter(heading).get()
    if ch.len() > 0 {
      [#ch.first().#n]
    } else {
      [#n]
    }
  })

  // === Заголовки уровня 1 ===
  // С нумерацией → «ГЛАВА N» + название (прописными)
  // Без нумерации → структурный элемент (по центру)
  show heading.where(level: 1): it => context {
    if it.numbering != none {
      pagebreak(weak: true)
      let heading-num = numbering(it.numbering, ..counter(heading).at(it.location()))
      align(center, text(weight: "bold", size: 14pt)[ГЛАВА #heading-num])
      align(center, text(weight: "bold", size: 14pt)[#upper(it.body)])
    } else {
      align(center, text(weight: "bold", size: 14pt)[#it.body])
    }
    v(14pt)
  }

  // === Заголовки уровня 2 ===
  show heading.where(level: 2): it => {
    v(28pt)
    text(weight: "bold", size: 14pt)[#{
      context counter(heading).display()
      h(0.3em)
      it.body
    }]
    v(14pt)
  }

  // === Заголовки уровня 3 ===
  show heading.where(level: 3): it => {
    v(28pt)
    text(weight: "bold", size: 14pt)[#{
      context counter(heading).display()
      h(0.3em)
      it.body
    }]
    v(14pt)
  }

  // === Оглавление — кастомные записи для глав и приложений ===
  show outline.entry.where(level: 1): it => context {
    let in-app = state("appendix-active", false).at(it.element.location())
    if in-app {
      link(it.element.location(), it.indented(
        none,
        [ПРИЛОЖЕНИЕ #it.prefix()] + sym.space + it.element.body + sym.space + box(width: 1fr, it.fill) + sym.space + it.page(),
      ))
    } else if it.element.numbering != none {
      link(it.element.location(), it.indented(
        none,
        [ГЛАВА #it.prefix()] + sym.space + it.element.body + sym.space + box(width: 1fr, it.fill) + it.page(),
      ))
    } else {
      link(it.element.location(), it.indented(
        none,
        upper(it.element.body) + sym.space + box(width: 1fr, it.fill) + it.page(),
      ))
    }
  }

  body
}

#let structural-heading(title) = {
  heading(level: 1, numbering: none, outlined: true)[#title]
}

#let start-page-numbering() = {
  page-number-on.update(true)
}

// Обёртка для содержимого приложений
// Применяется как: #show: start-appendixes
// Сбрасывает счётчики, меняет нумерацию на русский алфавит
#let start-appendixes(body) = {
  set heading(numbering: appendix-numbering, hanging-indent: 0pt)

  show heading.where(level: 1): it => context {
    counter(figure.where(kind: image)).update(0)
    counter(figure.where(kind: table)).update(0)
    counter(figure.where(kind: raw)).update(0)
    counter(math.equation).update(0)
    pagebreak(weak: true)
    let heading-num = numbering(it.numbering, ..counter(heading).at(it.location()))
    align(right, text(weight: "bold", size: 14pt)[ПРИЛОЖЕНИЕ #heading-num])
    v(0.3em)
    align(center, text(weight: "bold", size: 14pt)[#it.body])
    v(0.8em)
  }

  set figure(numbering: n => context {
    let ch = counter(heading).get()
    if ch.len() > 0 {
      let ch-num = ch.first()
      [#appendix-numbering(ch-num).#n]
    } else {
      [#n]
    }
  })

  state("appendix-active").update(true)
  counter(heading).update(0)
  body
}
