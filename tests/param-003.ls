#TABOP Sec 1.10.3, Fig 1.37a
view = {position: [42,10,-16], target: [0,10, -15]};

#define c 1
#define p 0.3
#define q (c-p)
#define h sqrt(p*q)

delta=86;stemsize=0.02
derivation length: 7

axiom: -(90)F(20)
p1: F(x) -> F(x*p)+F(x*h)--F(x*h)+F(x*q)
