#define  LA 5
#define  RA 1
#define  LB 1
#define  RB 1
#define  PD 1
delta=60
stemsize=0.01
derivation length: 20
axiom: {.A(0)}
p1: A(t) -> G(LA,RA)[-B(t).][A(t+1)][+B(t).]
p2: B(t) : t>0 -> G(LB,RB)B(t-PD)
p3: G(s,r) -> G(s*r,r)
