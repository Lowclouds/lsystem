/*
  decomposition usage from phyllotaxis-Vogel example in vLab
  This shows how decomposition may be used. Note that the 
  decomposition rules are applied, perhaps many times, after
  each iteration of the primary rules.
  In this example, it models the phyllotaxis of a composite 
  flower head, i.e. the patterns formed by the disc flowers.

  It's better if you turn off the ground in the scene controls.
 */
view = {auto: 'y'}

#define NUMBER 500
#modulus 
#define RADIUS 0.91

Lsystem: 1
derivation length: 2

Axiom: f(1)^(90)A(0)

C(n) --> ;(16+(floor(n/4) % 160))@O(RADIUS)

decomposition
maximum depth: 1000

A(n) : n < NUMBER --> [+(n*137.5)f(0.5*n^0.5)C(n)]A(n+1)

endlsystem

