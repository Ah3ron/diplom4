#import "template.typ": start-appendixes, start-page-numbering, structural-heading, template

#set page(margin: 0pt)
#let count = 3
#[
  #for p in range(1, count + 1) {
    image("./титульник.pdf", page: p)
  }
]

#show: template

#include "abstract.typ"
#pagebreak()

#heading(level: 1, numbering: none, outlined: false)[ОГЛАВЛЕНИЕ]
#outline(title: none, indent: auto, depth: 3)
#pagebreak()


#start-page-numbering()
#include "abbreviations.typ"
#pagebreak()
#include "introduction.typ"
#pagebreak()
#include "chapter1.typ"
#pagebreak()
#include "chapter2.typ"
#pagebreak()
#include "chapter3.typ"
#pagebreak()
#include "chapter4.typ"
#pagebreak()
#include "chapter5.typ"
#pagebreak()
#include "conclusion.typ"
#pagebreak()
#include "bibliography.typ"

#show: start-appendixes
#include "appendix.typ"

#set page(margin: 0pt)
#image("./ведомость.pdf", width: 100%)
