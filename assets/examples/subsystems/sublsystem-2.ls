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

lsystem: 1
derivation length: 18
axiom: ABC
A -> TE(BS)
T > E(n) --> TT
E(n) : n>0 --> E(n-1)
E(n) : n < 1 --> M
M < B --> $(2,BSCALE)B$
M < C --> $(3,CSCALE)C$
M --> *
endlsystem

lsystem: 2
axiom: B
B -> U(CS)E(CS)
U(n) : n > 0 -> WU(n-1)W
U(n) : n == 0 -> *
E(n) : n>0 --> E(n-1)
E(n) : n < 1 --> M
M < $ -> $M
M -> *
endlsystem

lsystem: 3
derivation length: 3
axiom: C
C -> DE(4)
D > E(n)-> DD
E(n) : n>0 --> E(n-1)
E(n) : n < 1 --> *
