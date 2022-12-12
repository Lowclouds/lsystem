/*
 This shows one way that subsystems can be strung together and sequenced at the top level.
 The top-level system will completely expand the A module until the end module E
 counts down from BS. Then it will turn on the sub-Lsystem 2 to expand B until 
 the end module, E, counts down from CS. At that point, it enables the C module
 with the M marker, which is expanded by sub-Lsystem 3. 

 Note: Continued expansion of A and B can continue while B, or C are evolving. The
 key idea is that delaying expansion of B and C using sub-Lsystems.
 This could be used to create contours and surfaces before expanding the main system.
*/
#define BS 2
#define BSCALE 0.5
#define CS 3
#define CSCALE 0.75
cstep=2
step=0
ignore: $
lsystem: 1
derivation length: 7
step=1
axiom: ABCD
A < B -> $(2,BSCALE)B$
B < C --> $(3,CSCALE)C$
A > M --> F(step)
D < D --> +;(cstep^cstep^cstep)F(step)
endlsystem

lsystem: 2
step=2
axiom: B
B -> E(CS)U(CS)
U(n) : n > 0 -> WU(n-1)W
U(n) : n == 0 -> *
E(n) : n>0 --> E(n-1)
E(n) : n < 1 --> M;(cstep*step)F(step)
M -> *
endlsystem

lsystem: 3
step=3
derivation length: 3
axiom: C
C -> DE(4)
D > E(n)-> DD
E(n) : n>0 --> E(n-1)
E(n) : n < 1 --> ;(cstep*step)F(step)
