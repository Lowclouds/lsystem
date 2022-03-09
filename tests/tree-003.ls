#define r1 0.9
#define r2 0.8
#define a0 45
#define a2 45
#define d 137.5
#define wr 0.8
dlength: 13
stemsize: 1.5
axiom: A(10,1.5)
p1: A(l,w) -> !(w)F(l)[&(a0)B(l*r2,w*wr)]/(d)A(l*r1,w*wr)
p2: B(l,w) -> !(w)F(l)[-(a2)@vC(l*r2,w*wr)]C(l*r1,w*wr)
p3: C(l,w) -> !(w)F(l)[+(a2)@vB(l*r2,w*wr)]B(l*r1,w*wr)


