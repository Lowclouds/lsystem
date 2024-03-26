/*
  Contour example using @Cs...@Ce modules to define a contour
  This example uses the multiplicity module, @Cm, to rotate and 
  replicate a contour around the origin to create a closed curve.
  It first creates an arc segment, then replicates it thirty times, @Cm(30),
  around a circle. The multiplicity module replicates all the 
  control points present at the end of the base contour.
  The user-defined C module creates the contour, using the rule:

  C --> [@H@Cs(0,1)D@Cm(NTEETH)@Ce('ctr')]
  
  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@H' homes the turtle with the heading set to +Y, i.e. (0,1,0)
  * '@Cs(0,1)' starts the contour, specifying to use exactly the points
     in the buffer at the end, and, importantly, that the contour is closed 
  * User-defined module 'D' invokes the rule creating the arc segment control points
  * '@m(x,y,z).' this sequence moves to (x,y,z) and stores a control point
  * '@Ca' creates an arc through three points 
  * '@Cm(NTEETH)' scales and replicates the arc segment NTEETH times around a circle
     of radius 0.5, i.e. with a size of 1.
  * '@Ce('ctr')' creates a contour with however many points the arc created; 
     the contour is stored with the key, "ctr"

  *  '@#('ctr')' selects the saved contour and subsequent drawing uses it
 */ 
#define NTEETH 30
#define DIAMETER 5
view = {auto: 'z'}
derivation length:8

axiom: CS
S -> f(10)-(90)/(90)E(DIAMETER)
E(d) : d>0 -> [@#('ctr')#(d,1)F]E(d-1)
E(d) : d == 0 -> *

C --> [@H@Cs(0,1)D@Cm(NTEETH)@Ce('ctr')]
D --> @m(-1,0,0).@m(-0.95,0,0).@m(0,-1,0).@m(0.95,0,0).@Ca@m(1,0,0)
