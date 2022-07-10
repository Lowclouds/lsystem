#define STEPL 0.5
#define STEPA 3
#define STEPW 0.1
derivation length:30
stemsize=0.25         

axiom: CF(10)F(-1)#(STEPW)&(30)@v@#('leaf'){(0)A(1)}(0)
A(t) : t<=5 ->  #(t*STEPW)F(STEPL)&(STEPA)A(t+1)
A(t) : t>=DLength-5 ->  #((DLength-t)*STEPW)F(STEPL)&(STEPA)A(t+1)
A(t) --> F(STEPL)&(STEPA)A(t+1)
/*A(t) : t > 10 --> * */
C --> @Ds('leaf')D@De('leaf')@m(0,0,0)
D --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).
