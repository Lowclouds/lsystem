#define R 1.02
#define Ang1 -15
#define Ang2 -4
#define Wid 12.4
n=117
axiom: f(175)&(90)#(Wid)@Gs@Gt(1.1,1.2)A(0.9,0)@Ge
p1: A(s,n) --> +(Ang1)/(Ang2)E(s,n)A(s*R,n+1)
p2: E(s,n):n%2 != 0 --> f(s)#(s*Wid*0.75)-(Ang1/2)@Gr(-60,1,0,2)@Gc(12)+(Ang1/2)
p3: E(s,n):n%2 == 0 --> f(s*0.9)#(s*Wid)-(Ang1/2)@Gr(0,2,60,1)@Gc(12)@Gr(60,1,-60,1)g(s*0.1)@Gc(12)+(Ang1/2)
