#TABOP Sec 1.10.3, Fig 137B

#define c 1
#define p 0.3
#define q (c-p)
#define h sqrt(p*q)

delta=86
stemsize=0.035
derivation length: 10

axiom: -(90)F(10,0)
p1: F(x,t):t==0 -> F(x*p,2)+F(x*h,1)--F(x*h,1)+F(x*q,0)
p2: F(x,t):t>0  -> F(x,t-1)