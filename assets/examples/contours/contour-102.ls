/*
  Contour example using @Cs...@Ce modules to define contour
  This example uses the multiplicity module to replicate a segment into
  a closed curve. It first creates a Hermite spline segment, then 
  replicates it four times around a circle. The multiplicity module 
  replicates all the control points present at the end of the contour.

  The C module creates the contour, using the rule:

C --> [@H(1)@Cs(0,1)D@Cm(4)@Ce('ctr')]
  
  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@H(1)' homes the turtle with the heading set to +X, i.e. (1,0,0)
  * '@Cs(0,1)' starts the contour, specifying to use exactly the points
     in the buffer at the end, and, importantly, that the contour is closed 
  * 'D' invokes the rule creating the control points
  * '@m(x,y,z)^(20).' this sequence moves to (x,y,z), pitches up 20 degrees,
     and stores a control point. &(40) pitches down 40 degrees
  * '@Ct(4,4)' creates a Hermite spline with multipliers, 4 and 4.
  * '@Cm(4)' scales and replicates the arc segment 4 times around a circle
     of radius 0.5
  * '@Ce('ctr')' creates a contour with however many points the arc created 
     the contour is stored with the key, "ctr"

  *  '@#('ctr')' selects the saved contour and subsequent drawing uses it

  Note: We need to make sure the heading is set using ^ and &, because the 
  @m(x,y,z) module does not change the heading and Hermite spline uses the 
  heading in the spline creation.  

  Note 2: Try setting the number of total contour points using @Cs(n,1) and 
  compare with the default of 0. When set to 0, the multiplicity calculation 
  uses exactly the points of the original contour, which are generated by the
  underlying Hermite spline. When set explicitly, the points are spread out 
  evenly over the entire length of the contour so that sections with tight turns
  may not get enough points to render correctly.
 */ 

view = {auto: 'z'}
derivation length:2
stemsize=1

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t == 1 -> A(2)
A(t) : t<=10 ->  F(t)^(60)A(t+1)
A(t) : t > 10 --> *
C --> [@H(1)@Cs(220,1)D@Cm(4)@Ce('ctr')]
D --> @m(-1,0,0)^(20).@m(1,0,0)&(40).@Ct(4,4)
