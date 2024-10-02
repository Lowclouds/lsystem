/*
  Size and taper using simple forward, drawing but with a custom user-defined shape. 
  Since the size of the contour is not 1, the size specification acts like a scalar.
  The contour shape is a 4x2 rectangle, so setting the size to 2, scales it to an 8x4
  rectangle. To control size more sensibly using the size modules #() and !(),
  construct your contours to fit into a unit circle. Or, just remember that for 
  custom contours, and all spline paths/tracks, the size is a scale factor, not
  an absolute size.
  Turn on the YZ and ZX grids for better visualization
*/

zpos = {x: 0, y:0, z: 0}
#define ZINC 10
#define position @m(zpos.x, zpos.y, zpos.z)

axiom: U P(zpos)AP(zpos)BP(zpos)CP(zpos)D
A ->  F#(2)F
B -> #(2)F(2)
C ->  F#(2,1)F
D -> #(2,1)F(2)

/* this moves the start position and resets the stemsize to default 
P : * {pos.z = pos.z+ZINC} -> position #(0.1,1)
*/
P(pos) : * {pos.z = pos.z+ZINC} -> position #(0.1,1)

/* define a closed shape that is not unit-sized:  a rectangle, and select it*/ 
U -> @Cs(0,1)(@m(-2,-1,0).@m(-2,1,0).@m(2,1,0).@m(2,-1,0).@m(-2,-1,0).@Ce(1) @#(1)
