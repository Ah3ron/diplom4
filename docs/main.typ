#import "template.typ": start-appendixes, start-page-numbering, structural-heading, template

#show: template

#include "abstract.typ"

#pagebreak()
#start-page-numbering()

#structural-heading("СОДЕРЖАНИЕ")

#outline(title: none, indent: auto, depth: 3)

#pagebreak()
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
#structural-heading("СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ")
#include "bibliography.typ"

#show: start-appendixes
#include "appendix.typ"
