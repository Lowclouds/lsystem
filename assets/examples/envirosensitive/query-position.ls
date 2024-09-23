view = {auto: 'z'}
#define STEPS 22
#define a 5
#define b 10
#define ANG 60
#define len 1

#define in(x,y) ((x*x)  / (a*a) + (y-b)*(y-b) / (b*b) <= 1)

Lsystem: 1
derivation length: STEPS
consider: ?P
Axiom: [;(158) E(0)] ;(2) / A?P(1,1)

A > ?P(x,y) : in(x,y) --> I [+(ANG) B][-(ANG) B] A ?P(0,0)
B > ?P(x,y) : in(x,y) --> N I B ?P(0,0) 

decomposition
maximum depth: 500

E(alpha) : alpha < 360 -->
	 [@m(a*cos(alpha), b*(1+sin(alpha)), 0) @O(0.35)] E(alpha+1)

E(alpha) --> *

homomorphism
I --> F(len)
A --> [;(64) @O(0.8)]
B --> [;(48) @O(0.6)]
N --> [;(32) @O(0.4)]

endlsystem
