/* internode growth rate */
#define RATE 1.02
/*
For a doubling in branch length we want 1.26 times the width */
/*
The exponent is equivalent to log(1.26)/log(2) approximately */
/*
for 1.1 we use an exponent of .1375 */
/*
for 1.2 we use an exponent of .2630 */
/*
for 1.26 we use an exponent of .3334 */
/*
for 1.3 we use an exponent of .3785 */
#define STEMRATE 1.06
/* width of stem at start of internode */
#define STEMWIDTH .0075
/* Sub L-systems for female spike, male spike and leaf */
#define F_SPIKE ?(2,1.25)axiom$
#define M_SPIKE ?(3,1.25)axiom$
/* leaf L-system parameters: starting delay, time to turn, and new elasticity */
#define LEAF ?(4,1)axiom((a-10),a,(a-13)/100)$
lsystem: 1
/* nice derivation length 90+ (95?) */
derivation length: 95
axiom: /(30)+(10)#(STEMWIDTH)A(4,4)
* < A(a,t) > * : a==30 --> F(1)/(137.5)M_SPIKE
* < A(a,t) > * : t<10 --> F(1)A(a+1,t+1)
* < A(a,t) > * : t==10 --> F(1)/(137.5)[L(a)][S(a)]#(STEMWIDTH)A(a+1,0)
* < #(d) > * : d<200 --> #(d*STEMRATE)
/* ! is used here so that width won’t be increased */
* < S(a) > * : * --> [^(25)_(0-.1)!(.3)F((30-a)/5)F((30-a)/5)_(0)F_SPIKE]
* < L(a) > * : * --> [^(60)!(.1)LEAF]
* < F(t) > * : t<2 --> F(t*RATE)
* < F(t) > * : !(t<2) --> F(t*RATE/2)F(t*RATE/2)
endlsystem

lsystem: 2
#define I_RATE 1.01
/* internode growth rate */
#define S_RATE 1.05
/* seed growth rate */
derivation length: 76
axiom: ////F(5)a(xiom)
* < A(t) > * : t<75 --> F(.2)[B]/(137.5)A(t+1)
* < B > * : * --> &(35)[~f(1)]/(180)[~f(1)][~c(1)#(.1)F(.5)]
* < F(t) > * : t<1 --> F(t*I_RATE)
* < &(a) > * : a<50 --> &(a*S_RATE)
* < ~f(t) > * : t<2 --> ~f(t*S_RATE)
* < ~c(t) > * : t<2 --> ~c(t*S_RATE)
* < a(xiom) > * : * --> [&(30)/(180)~f(2.25)#(.1)F(.5)]F(.1)/(180)[&(30)/(180)~f(2.25)#(.1)F(.5)]/(137.5)A(0)
