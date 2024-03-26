view = {auto: '-Z'}
#define R 1.02
#define Ang1 -15
#define Ang2 -4
#define Wid 6.4
n=117
axiom: f(130)&(105)#(Wid)@Gs@Gt(1.1,1.2)A(0.9,0)@Ge
p1: A(s,n) --> +(Ang1)/(Ang2)E(s,n)A(s*R,n+1)
p2: E(s,n):n%2 != 0 --> g(s)#(s*Wid*0.75)-(Ang1/2)@Gr(-100,1,0,4)@Gc(12)+(Ang1/2)
p3: E(s,n):n%2 == 0 --> g(s*0.9)#(s*Wid)-(Ang1/2)@Gr(0,3,60,2.5)@Gc(12)@Gr(60,2.5,-100,0.5)g(s*0.1)@Gc(12)+(Ang1/2)
