/*
  the environment program/module enviroexample records the turtle position when
  the 'in' parameter of ?E(in,out) is zero. On each subsequent ?E(n,0) update, 
  it tests the current position against the zero point position. If the points
  are 'close', it sets the 'out' parameter to 1.

  This Lsystem will draw ngons based on the DELTA angle (assuming it divides 360 evenly). 
  Change it to experiment.
  Hint, turn off the ground to see the entire object.
 */

#include "./enviroexample.js"

#define DELTA 90

Lsystem: 1
derivation length: 22
delta = DELTA

axiom: ?E(0,0)
?E(in,out) : out == 0 --> F+?E(in+1,out)
?E(in,out) : out == 1 --> ?H(0,0,0)?U(0,0,0)A
?H(hx,hy,hz)?U(ux,uy,uz) < A --> @R(ux,uy,uz)f@R(hx,hy,hz,ux,uy,uz)?E(0,0)
