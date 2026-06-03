// Шаблон дипломного проекта по СТО 02-2023

#let page-number-on = state("page-number-on", false)

#let _ru-alphabet = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ".split("")
#let _alphabet = _ru-alphabet

#let appendix-numbering(..nums) = _alphabet.at(nums.pos().first() - 1)

#let _chapter-numbering(n) = context {
  let ch = counter(heading).get()
  if ch.len() > 0 { [#ch.first().#n] } else { [#n] }
}

#let _chapter-equation-numbering(n) = context {
  let ch = counter(heading).get()
  if ch.len() > 0 { [(#ch.first().#n)] } else { [(#n)] }
}

#let _outline-fill = sym.space + box(width: 1fr) + sym.space

#let template(body) = {
  set document(title: "Дипломный проект")

  set page(
    paper: "a4",
    margin: (top: 20mm, bottom: 20mm, left: 30mm, right: 15mm),
    header: context {
      let page-num = counter(page).get().first()
      if page-number-on.get() { align(center)[#page-num] }
    },
    footer: none,
  )

  set text(font: "Times New Roman", size: 14pt, lang: "ru")
  set par(justify: true, first-line-indent: (amount: 1.25cm, all: true), leading: 0.65em, spacing: 0.65em)
  set block(spacing: 1.2em)
  set heading(numbering: "1.1")

  set footnote.entry(separator: line(length: 30mm, stroke: 0.5pt))
  show footnote.entry: set text(size: 10pt)

  set list(marker: [-], indent: 1.25cm, body-indent: 0.5em, spacing: 0.4em)
  set enum(indent: 1.25cm, body-indent: 0.5em, spacing: 0.4em)

  // Рисунки
  show figure.where(kind: image): set figure(supplement: [Рисунок], numbering: _chapter-numbering)
  show figure.where(kind: raw): set figure(supplement: [Рисунок], numbering: _chapter-numbering)

  // Таблицы
  show figure.where(kind: table): set figure(supplement: none, numbering: _chapter-numbering)
  show figure.where(kind: table): it => context {
    set text(size: 12pt)
    set par(justify: false, first-line-indent: (amount: 1.25cm))
    v(8pt)
    align(left, [Таблица #it.counter.display() – #it.caption.body])
    it.body
  }

  // Формулы
  set math.equation(numbering: _chapter-equation-numbering)

  // Заголовки
  show heading: set text(weight: "regular")

  show heading.where(level: 1): it => context {
    if it.numbering != none {
      pagebreak(weak: true)
      let num = numbering(it.numbering, ..counter(heading).at(it.location()))
      align(center, text(size: 14pt)[ГЛАВА #num])
      align(center, text(size: 14pt)[#upper(it.body)])
    } else {
      align(center, text(size: 14pt)[#it.body])
    }
    v(14pt)
  }

  let _sub-heading = it => {
    v(28pt)
    text(size: 14pt)[#{
      context counter(heading).display()
      h(0.3em)
      it.body
    }]
    v(14pt)
  }
  show heading.where(level: 2): _sub-heading
  show heading.where(level: 3): _sub-heading

  // Оглавление
  show outline.entry: set block(below: 0.15em)

  show outline.entry.where(level: 1): it => context {
    let in-app = state("appendix-active", false).at(it.element.location())
    let body = if in-app {
      [ПРИЛОЖЕНИЕ #it.prefix()] + linebreak() + it.element.body
    } else if it.element.numbering != none {
      [ГЛАВА #it.prefix()] + sym.space + it.element.body
    } else {
      upper(it.element.body)
    }
    link(it.element.location(), it.indented(none, body + sym.space + box(width: 1fr, it.fill) + it.page()))
  }

  body
}

#let structural-heading(title) = heading(level: 1, numbering: none, outlined: true)[#title]

#let start-page-numbering() = context {
  let p = counter(page).get().first()
  counter(page).update(p - 2)
  page-number-on.update(true)
}

#let start-appendixes(body) = {
  set heading(numbering: appendix-numbering, hanging-indent: 0pt)

  show heading.where(level: 1): it => context {
    counter(figure.where(kind: image)).update(0)
    counter(figure.where(kind: table)).update(0)
    counter(figure.where(kind: raw)).update(0)
    counter(math.equation).update(0)
    pagebreak(weak: true)
    let num = numbering(it.numbering, ..counter(heading).at(it.location()))
    align(right, text(size: 14pt)[ПРИЛОЖЕНИЕ #num])
    v(0.3em)
    align(center, text(size: 14pt)[#it.body])
    v(0.8em)
  }

  set figure(numbering: n => context {
    let ch = counter(heading).get()
    if ch.len() > 0 { [#appendix-numbering(ch.first()).#n] } else { [#n] }
  })

  state("appendix-active").update(true)
  counter(heading).update(1)
  body
}
