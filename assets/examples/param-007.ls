#define LEN 2
Dlength:4
stemsize=0.25           

axiom: f(LEN)-(90)A(1)
A(t) : t<LEN ->  F(t)+(45)&(5)A(t+1)
A(t) : t==LEN -> B
B --> C('',1)
C(a,b) -> D(a)E(b)
