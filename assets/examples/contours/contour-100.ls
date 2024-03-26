/*
  Contour example using @Cs...@Ce modules to define a contour
  This example uses the multiplicity module, @Cm, to rotate and 
  replicate a contour around the origin to create a closed curve.
  It first creates an arc segment, then replicates it three times, @Cm(3),
  around a circle. The multiplicity module replicates all the 
  control points present at the end of the base contour.
  The user-defined C module creates the contour, using the rule:

  C --> [@H@Cs(0,1)D@Ca@Ce('ctr')]
  
  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@H' homes the turtle with the heading set to +Y, i.e. (0,1,0)
  * '@Cs(0,1)' starts the contour, specifying to use exactly the points
     in the buffer at the end, and, importantly, that the contour is closed 
  * User-defined module 'D' invokes the rule creating the arc segment control points
  * '@m(x,y,z).' this sequence moves to (x,y,z) and stores a control point
  * '@Ca' creates an arc through three points 
  * '@Cm(3)' scales and replicates the arc segment 3 times around a circle
     of radius 0.5, i.e. with a size of 1.
  * '@Ce('ctr')' creates a contour with however many points the arc created; 
     the contour is stored with the key, "ctr"

  *  '@#('ctr')' selects the saved contour and subsequent drawing uses it
 */ 

view = {auto: 'z'}
derivation length:2
stemsize=1

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t<=10 ->  F(t)^(60)A(t+1)
A(t) : t > 10 --> *
C --> [@H@Cs(0,1)D@Cm(3)@Ce('ctr')]
D --> @m(-1,0,0).@m(0,1,0).@m(1,0,0).@Ca
