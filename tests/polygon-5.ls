#define LA 5
#define RA 1.15
#define LB 1.3
#define RB 1.25
#define LC 3
#define RC 1.19

delta=60
stemsize=0.01
derivation length: 25

axiom: ;(90)[{A(0,0).}][{A(0,1).}]
p1: A(t,d) : d==0 --> .G(LA,RA).[+B(t)G(LC,RC,t).}][+B(t){.]A(t+1,d)
p2: A(t,d) : d==1 --> .G(LA,RA).[-B(t)G(LC,RC,t).}][-B(t){.]A(t+1,d)
p3: B(t) : t>0 --> G(LB,RB)B(t-1)
p4: G(s,r) --> G(s*r,r)
p5: G(s,r,t) : t>1 --> G(s*r,r, t-1)
