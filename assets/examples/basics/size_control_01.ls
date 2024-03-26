/*
  Size and taper using simple forward, non-track/spline drawing and the default
  circle contour shape. This switches from creating a tube to extruding a shape,
  which, in turn, effects size control, but the default unit circle looks just
  like a tube.
  Turn on the YZ grid for better visualization
*/
zpos = 0
#define ZINC 3
#define position @m(0,0,zpos)

axiom: U PAPBPCPD
A ->  F#(2)F
B -> #(2)F(2)
C ->  F#(2,1)F
D -> #(2,1)F(2)

/* this moves the start position and resets the stemsize to default */
P : * {zpos = zpos+ZINC} -> position #(0.1,1)

U -> @#('default')