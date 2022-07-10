#TABOP Sec 1.10.3, Fig 137B
view = {position: [30,10,-7], target: [0,10,-7]};

#define c 1
#define p 0.3
#define q (c-p)
#define h sqrt(p*q)

delta=86
stemsize=0.035
derivation length: 13


axiom: -(90)F(10,0)
p1: F(x,t):t==0 -> F(x*p,2)+F(x*h,1)--F(x*h,1)+F(x*q,0)
p2: F(x,t):t>0  -> F(x,t-1)