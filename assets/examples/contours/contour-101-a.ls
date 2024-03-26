/*
  Contour example using @Cs...@Ce modules to define contour
  This example uses the multiplicity module to replicate a segment into
  a closed curve. It first creates a Hermite spline segment, then replicates it
  three times around a circle. The multiplicity module replicates all
  the control points present at the end of the contour.
  The C user module creates the contour, using the rule:

  C -->  [@H(1)@Cs(60,1)@Cn(60).f^(30)g(3)&(90)f@Ct(1,3)@Cm(3)@Ce('ctr')]
  
  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@H(1)' homes the turtle with the heading set to +X i.e. (1,0,0)
  * '@Cs(60,1)' starts the contour, specifying to create a final total of 60 
     points, even if more or fewer are generated by the spline, and,
     importantly, that the contour is closed [ 1==closed]
  * @Cn(60) tells it to use 60 points when creating the spline.
  * '.' stores the current location, i.e. the origin.
  * 'f^(30)' moves one unit forward, stores a point; ^(30) pitches up 30 degrees.
  * 'g(3)&(90)f moves 3 unit forward, then pitches 90 degrees down, then
     forward 1 unit, storing a point at the end.
  * @Ct(1,3) creates the Hermite spline using the supplied multpliers, 
    (i.e. the vector lengths) at the endpoints of the spline, i.e. the last two points.
  * '@Cm(3)' scales and replicates the generated points 3 times around a circle
     of radius 0.5
  * '@Ce('ctr')' creates a contour with however many points the arc created 
     the contour is stored with the key, "ctr"

  *  '@#('ctr')' selects the saved contour and subsequent drawing uses it
 */ 
#define ANGLE 60
#define ASTEPS 5
view = {auto: 'x'}
derivation length:64
stemsize=1

axiom: Cf(10)-(90)/(90)[@#('ctr'){(0)A(1)}(0)]
A(t) : t<=10 ->  F(t)T(ASTEPS,t)
A(t) : t > 10 --> *
T(a,t) : a>0 --> F(1/ASTEPS)^(ANGLE/ASTEPS)T(a-1,t)
T(a,t) : a==0 -> A(t+1)
C --> [@H(1)@Cs(0,1)@Cn(60).f^(30)g(3)&(90)f@Ct(1,3)@Cm(3)@Ce('ctr')]