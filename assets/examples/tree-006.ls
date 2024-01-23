#define r1 0.9
#define r2 0.8
#define a1 35
#define a2 35
#define d 137.5
#define wr 0.8
#define STEMSIZE 1.0
dlength: 10
stemsize: 1.0
axiom: A(10, STEMSIZE)
p1: A(l,w) -> !(w)F(l)[&(a1)B(l*r1,w*wr)]/(180)[&(a2)B(l*r2,w*wr)]
p2: B(l,w) -> !(w)F(l)[+(a1)@vB(l*r1,w*wr)][-(a2)@vB(l*r2,w*wr)]


