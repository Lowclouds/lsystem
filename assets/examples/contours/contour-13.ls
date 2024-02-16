view = {auto: '-Z'};
#define CRADIUS 2
#define ITER 16
#define QSTEPS (ITER/2)
#define HGT  (sin(PI/2/QSTEPS))
#define WDTH  (cos(PI/2/QSTEPS))
#define CSTEP sqrt(HGT^2 + (1-WDTH)^2)
/*cangle = (PI/4 - HGT/CSTEP) * 180/PI*/
#define CANGLE 90/QSTEPS
#define BSCALE 1

lsystem: 1

cstep = CSTEP
hgt = HGT
stemsize= 0.01
ignore: 
derivation length: 19

axiom: C
C --> &(90)g&(90)@CsD@Ce(1)
D --> A(2*QSTEPS-1)
A(n) : n > 0 --> .&(CANGLE)G(cstep)A(n-1)
A(n) < @Ce(s) : n == 0 --> @Ce(s)$(2,BSCALE)B$
A(n) : n == 0 --> .

endlsystem

#define ALPHA a*180/PI
#define D1 5
#define D2        
#define D1RADIUS (D1/(1-cos(ALPHA)))
#define D1X abs(D1RADIUS * sin(ALPHA))
#define D1Y D1RADIUS * cos(ALPHA)

lsystem: 2

axiom: B
B -> @m(0,10,0)@R(0,0,1)@v-(90)!(2)!(2);(65)@#(1)S
S -> {(0)D(D1,80)R(3,90)U(20,45)L(5,180)}(0)
D(d,a) : d>0 -> &(a/d)F(D1X)D(d-D1Y, a - a/d)
D(d,a) : d <= 0 -> *
R(d,a) : d>0 ->
R(d,a) : d<=0 -> *
U(d,a) : d>0 ->
U(d,a) : d<=0 -> *
L(d,a) : d>0 ->
L(d,a) : d<=0 -> *

endlsystem