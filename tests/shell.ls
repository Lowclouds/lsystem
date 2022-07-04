#define R 1.03
#define Ang1 20
#define Ang2 2.1
#define Wid 2.5
n=117
axiom: f(175)&(90)#(Wid)@Gs@Gt(1.1,1.2)A(1)@Ge
p1: A(s) --> +(Ang1)/(Ang2)E(s)A(s*R)
p2: E(s) --> g(s)#(s*Wid)+(Ang1/2)@Gc(4)-(Ang1/2)
