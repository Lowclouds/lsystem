#define r1 0.9
#define r2 0.7
#define a0 30
#define a2 -30
#define d 137.5
#define wr 0.8
#define STEMSIZE 1.5
dlength: 11
stemsize: STEMSIZE
axiom: A(10,STEMSIZE)
p1: A(l,w) -> !(w)F(l)[&(a0)B(l*r2,w*wr)]/(d)A(l*r1,w*wr)
p2: B(l,w) -> !(w)F(l)[-(a2)@vC(l*r2,w*wr)]C(l*r1,w*wr)
p3: C(l,w) -> !(w)F(l)[+(a2)@vB(l*r2,w*wr)]B(l*r1,w*wr)


