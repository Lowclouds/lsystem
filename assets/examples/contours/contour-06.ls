/*
  Contour example using @Cs...@Ce modules to define contour
  This example creates a U-shape using the Catmull-Rom spline module. 
  In this case, @Cc uses all the control points to create the new 
  spline segment, inserting the output back into the control point buffer.
  The C module creates the contour, using the rule:

  C --> [@H@CsD@Cc@Ce('ctr')]
  
  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@H' homes the turtle with the heading set to +Y, i.e. (0,1,0)
  * '@Cs' starts the contour
  * 'D' invokes the rule containing the control point locations
  * '@m(x,y,z).' this sequence moves to (x,y,z) and stores a control point
  * '@Cc' creates a Catmull-Rom spline using all previous control points
    and inserts the segment default, 16, points back.
  * '@Ce('ctr')' creates a contour with sixteen points, slightly U-shaped
     the contour is stored with the key, 'ctr'

  *  '@#('ctr')' selects the saved contour and subsequent drawing uses it
 */ 

view = {auto: 'z'}
derivation length: 4
stemsize=0.5         

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t<=10 ->  F(t)^(60)A(t+1)
A(t) : t > 10 --> *
C --> [@H@CsD@Cc@Ce('ctr')]
D --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).
