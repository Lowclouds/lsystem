derivation length:15
stemsize=0.25         

axiom: Cf(10)-(90)@#(leaf){(0)A(1)}(0)
A(t) : t<10 ->  F(t)+(45)A(t+1)
/*A(t) : t > 10 --> * */
C --> @Ds('leaf')D@De('leaf')@m(0,0,0)
D --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).