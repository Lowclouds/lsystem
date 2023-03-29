delta=10
#define gall 0.4
stemsize=0.5
derivation length: 20
axiom: #(0.75)F(0.1)#(0.2)\(30)&(30)FFFFF#(0.045);(26)[A][B]
p1: A -> [[+A{.C(0).]GC(0).}]
p2: B -> [[-B{.C(0).]GC(0).}]
p3: C(t) : t % 5 == 0 --> G[;(95)@O(gall)]C(t+1)
p4: C(t) --> GC(t+1)
