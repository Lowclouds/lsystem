view = {auto: '-Z'};
#define CRADIUS 2
#define ITER 16
#define QSTEPS (ITER/2)
#define HGT  (sin(PI/2/QSTEPS))
#define WDTH  (cos(PI/2/QSTEPS))
#define CSTEP sqrt(HGT^2 + (1-WDTH)^2)
hgt = HGT
cstep = CSTEP
/*cangle = (PI/4 - HGT/CSTEP) * 180/PI*/
#define CANGLE 90/QSTEPS

stemsize= 0.01
ignore: 
derivation length: 19

axiom: C
C --> &(90)g&(90)@Ds(1)D@De(1)
D --> A(2*QSTEPS-1)
A(n) : n > 0 --> .&(CANGLE)G(cstep)A(n-1)
A(n) < @De(s) : n == 0 --> @De(s)B
A(n) : n == 0 --> .
B -> @m(0,10,0)@R(0,0,1)@v-(90)!(2)!(2);(65)@#(1)S

S -> D(5,80)R(3,90)U(20,45)L(5,180)D(20,60)
D(d,a) : d>0 -> 
R(d,a) : d>0 ->
U(d,a) : d>0 ->
L(d,a) : d>0 ->
