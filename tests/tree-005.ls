#define r1 0.9
#define r2 0.7
#define a1 10
#define a2 60
#define d 137.5
#define wr 0.8
#define STEMSIZE 1.5
dlength: 10
stemsize: STEMSIZE
axiom: A(10,STEMSIZE)
p1: A(l,w) -> !(w)F(l)[&(a1)B(l*r1,w*wr)]/(180)[&(a2)B(l*r2,w*wr)]
p2: B(l,w) -> !(w)F(l)[+(a1)@vB(l*r1,w*wr)][-(a2)@vB(l*r2,w*wr)]


