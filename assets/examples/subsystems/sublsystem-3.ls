/*
 This shows one way that subsystems can be strung together and sequenced at the top level.
 The top-level system will hand off the B and C modules to sub-lsystems 2 and 3, respectively,
 in the first step, and then switch off. The B and C modules are then expanded by their
 sub-lsystems in parallel until they each produce an M module and turn off.
 The M marker module produced by sub-lsystem 2, then allows the A > M production to produce
 a growth. In the next step, the M produced by sub-Lsystem 3 allows the M < D production to
 match in the main lsystem (note the ignore: $ statement.) This produces the green branch
 at the top.

 Note: Continued expansion of A or D could continue in Lsystem 1 while B, or C are evolving. 
 The key idea is delaying expansion of A and D using sub-Lsystems.
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
M < D --> +;(cstep^cstep^cstep)F(step)
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
E(n) : n < 1 --> ;(cstep*step)F(step)M
M -> *
