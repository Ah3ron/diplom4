#import "template.typ": start-appendixes, start-page-numbering, structural-heading, template

#show: template

#for i in range(1, 3) [
  #pagebreak()
]

#include "abstract.typ"
#pagebreak()

#heading(level: 1, numbering: none, outlined: false)[СОДЕРЖАНИЕ]
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
