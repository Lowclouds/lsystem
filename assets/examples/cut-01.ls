view = {position: [35,14,0], target: [0,10,0]};

#define CUTRATE 2
#define ENDCUT 0.5
n=5; delta=25.7; stemsize=0.1
axiom: X(CUTRATE)
p0: X(n) : n>0 -->F[+X(n-1)F][-X(n-1)F]X(n-ENDCUT)F
p1: F->FF(0.5)
p2: X(n) : n<=0 --> FX(CUTRATE)%
