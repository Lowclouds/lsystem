#define STEPL 0.5
#define STEPA 3
#define LEAFL 30
#define STEPW 0.1
#define STEM 0.6
#define ISTEM 0.1
#define ROLL
derivation length:20
stemsize=STEM

axiom: C;(85)A(0)
A(t) : t<=5 ->  #(t*STEPW)F(STEPL)-(STEPA)A(t+1)
A(t) : (t>5) -->  @#('C1')#(0.1)F(1)B(10)
B(u) : u < 3 --> #(0.1*t)&(5)F(1)B(u+1)
B(u) : u < 7 --> &(5)F(1)\(10)B(u+1)
B(u) : u >= 7 --> &(5)F(1)\(10)B(u+1)
B(u) : u > 10 --> *
C --> @Ds('C1')L@De('C1')@m(0,0,0)
L --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).
