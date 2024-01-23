#define d1 94.74
#define d2 132.63
#define a 18.95
#define lr 1.109
#define vr 1.732
dlength: 2
stemsize: vr
axiom: !(1)!(1)F(200)/(45)A
p1: A -> !(vr)F(50)[&(a)F(50)A]/(d1)[&(a)F(50)A]/(d2)[&(a)F(50)A]
p2: F(l) -> F(l*lr)
p3: !(w,n) -> !(w*vr)
p4: !(w) -> !(w*vr)



