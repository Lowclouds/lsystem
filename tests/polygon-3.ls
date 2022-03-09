LA=5, RA=1, LB=1, RB = 1, PD=1
delta=60
stemsize=0.01
derivation length: 20
axiom: {.A(0)}
p1: A(t) -> G(LA,RA)[-B(t).][A(t+1)][+B(t).]
p2: B(t) : t>0 -> G(LB,RB)B(t-PD)
p3: G(s,r) -> G(s*r,r)
