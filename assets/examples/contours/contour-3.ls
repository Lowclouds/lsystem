#define STEPL 0.5
#define STEPA 3
#define LEAFL 30
#define STEPW 0.2
#define STEM 0.7
#define ISTEM 0.1

derivation length:40
stemsize=STEM

axiom: C;(85)F(5)B(1)
A(t) : t<=5 ->  #(t*STEPW)F(STEPL)&(STEPA)A(t+1)
A(t) : (t>=LEAFL-5) and (t <= LEAFL) -->  #((LEAFL-t)*STEPW)F(STEPL)&(STEPA)A(t+1)
A(t) --> F(STEPL)&(STEPA)A(t+1)
B(u) : u < 4 --> F(5)\60)[-(30)@v;(16)@#('leaf')A(1)]#(STEM - u*ISTEM))B(u+1)
B(u) : u == 4 --> F(1)#(0.1)F(1)#(0.25)
C --> @CsD@Ce('leaf')@m(0,0,0)
D --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).

