#define R 1.02
#define Ang1 -15
#define Ang2 -4
#define Wid 6.2
n=2
axiom: #(Wid)@Gs@Gt(1.1,1.2)A(0.9,0)@Ge
p1: A(s,n) --> E(s,n)A(s*R,n+1)
p2: E(s,n):n%2 != 0 --> g(s)#(s*Wid*0.75)@Gr(-100,2.5,0,4)@Gc(12)
p3: E(s,n):n%2 == 0 --> g(s*0.9)#(s*Wid)@Gr(0,3,60,2.5)@Gc(12)@Gr(60,2.5,-100,1)g(s*0.1)@Gc(12)
