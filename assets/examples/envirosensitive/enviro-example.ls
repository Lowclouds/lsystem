#include "./enviroexample.js"

Lsystem: 1
derivation length: 11
axiom: F+?E(0,0)
?E(in,out) : out == 0 --> F+?E(in+1,out)
?E(in,out) : out == 1 --> ^f&F+?E(0,0)