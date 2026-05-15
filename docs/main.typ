// main.typ — Точка входа дипломного проекта
// Компиляция: typst compile docs/main.typ docs/diploma.pdf --root .

#import "@preview/modern-g7-32:0.2.0": enum-numbering, gost

#import "@preview/pintorita:0.1.4"
#show raw.where(lang: "pintora"): it => pintorita.render(it.text, style: "default")

#show: gost.with(
  hide-title: true,
)

#show heading.where(level: 1): it => context {
  if it.numbering != none {
    pagebreak(weak: true)
    align(center, text(
      weight: "bold",
      size: 14pt,
    )[ГЛАВА #numbering(it.numbering, ..counter(heading).at(it.location()))])
    align(center, text(
      weight: "bold",
      size: 14pt,
    )[#upper(it.body)])
  } else {
    it
  }
}

#show figure.where(kind: raw): set figure(supplement: [Рисунок])

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

#show outline.entry.where(level: 1): it => {
  let in-appendix = state("appendixes", false).at(it.element.location())
  if in-appendix {
    link(it.element.location(), it.indented(
      none,
      [ПРИЛОЖЕНИЕ #it.prefix()] + sym.space + box(width: 1fr, it.fill) + sym.space + it.page(),
    ))
  } else if it.element.numbering != none and not in-appendix {
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

#include "abstract.typ"
#outline(title: align(center)[#upper([Оглавление])])
#include "abbreviations.typ"
#include "introduction.typ"
#include "chapter1.typ"
#include "chapter2.typ"
#include "chapter3.typ"
#include "chapter4.typ"
#include "chapter5.typ"
#include "conclusion.typ"
#bibliography("refs.bib")

#let _appendix-numbering(..nums) = {
  let alphabet = (
    "А",
    "Б",
    "В",
    "Г",
    "Д",
    "Е",
    "Ж",
    "З",
    "И",
    "К",
    "Л",
    "М",
    "Н",
    "О",
    "П",
    "Р",
    "С",
    "Т",
    "У",
    "Ф",
    "Х",
    "Ц",
    "Ч",
    "Ш",
    "Щ",
    "Э",
    "Ю",
    "Я",
  )
  alphabet.at(nums.pos().first() - 1)
}

#let my-appendixes(body) = {
  set heading(numbering: _appendix-numbering, hanging-indent: 0pt)

  show heading.where(level: 1): it => context {
    counter(figure.where(kind: image)).update(0)
    counter(figure.where(kind: table)).update(0)
    counter(figure.where(kind: raw)).update(0)
    counter(math.equation).update(0)
    pagebreak(weak: true)
    align(right, text(
      weight: "bold",
      size: 14pt,
    )[ПРИЛОЖЕНИЕ #numbering(it.numbering, ..counter(heading).at(it.location()))])
    v(0.3em)
    align(center, text(weight: "bold", size: 14pt)[#it.body])
    v(0.8em)
  }

  set figure(numbering: n => {
    context {
      let ch = counter(heading).get()
      if ch.len() > 0 {
        let ch-num = ch.first()
        [#_appendix-numbering(ch-num).#n]
      } else {
        [#n]
      }
    }
  })

  state("appendixes").update(true)
  counter(heading).update(0)
  body
}

#show: my-appendixes
#include "appendix.typ"


