#define STEPL 0.5
#define STEPA 3
#define LEAFL 30
#define STEPW 0.1
#define STEM 0.6
#define ISTEM 0.1
#define ROLL 10
derivation length:30
stemsize=STEM

axiom: C;(85)A(0)
A(t) : t<=5 ->  #(t*STEPW)F(STEPL)-(STEPA)A(t+1)
A(t) : (t>5) -->  #(0.1)F(1)B(0)
B(u) : u < 3 --> #(0.1*(u+1))&(5)F(1)B(u+1)
B(u) : u == 3 --> @#('C1')&(5)F(1)\(ROLL/2)B(u+1)
B(u) : u <= 10 --> #(0.1*(u+1))&(5)F(1)\(ROLL)B(u+1)
B(u) : u > 10 --> *
C --> @CsL@Ce('C1')@m(0,0,0)
L --> @m(-1,-1/3,0).@m(-0.9,-0.1,0).@m(-2/3,0,0).@m(2/3,0,0).@m(0.9,-0.1,0).@m(1,-1/3,0).
