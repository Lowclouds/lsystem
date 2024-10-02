view = {auto: 'Y'}
#define CSIZE 0.5
#define R0 1
#define H0 0.1
#define RH_RATIO 1
#define FperRow0 10
r = R0
h = H0

n=300
#define a 137.5
#define CNT 3 
axiom: ;(28)&[A(0)]+(360/CNT)[A(0)]+((360*2)/CNT)[A(0)]
p1: A(n) : * -> +(a)[f(n^0.5)@O(CSIZE)]A(n+1)
