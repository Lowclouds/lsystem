/*
  Contour example using @Cs...@Ce modules to define contour

  This creates a contour using the Hermite spline module, @Ct(m1,m2)
  The C user module creates the contour, using the rule: 
  C --> [@H(1)@Cs(60)@Cn(60).f^(30)g(3)&(90)f@Ct(1,3)@Ce('ctr')]  

 Working through the rule step by step:
  * '[' the initial bracket saves the current turtle state, restoring it with the final ']'
  * '@H(1) homes the turtle and sets the heading +X, or (1,0,0)
  * '@Cs(60)' starts a contour and tells it to use 60 evenly spaced points in the final output.
  * '@Cn(60)' tells it to use 60 points when constructing a segment, the hermit spline, in this case.
  * '.' stores the first control point, (0,0,0)
  * 'f' moves forward 1 unit and stores the second control point, (1,0,0) w/heading (1,0,0) 
  * '^(30)' pitches up 30 degrees in the XY plane
  * 'g(3)' moves forward 3 units neither drawing nor storing a control point
  * '&(90)' pitches down 90 degrees, again in the XY plane
  * 'f' moves forward without drawing and stores the third control point,
     (4.098, 0.634, 0) with a heading/tangent of {0.5, -0.866, 0}
  * '@Ct(1,3)' sets the hermite spline multipliers to 1 and 3, and creates the spline with 60 points
    These points are spliced into the control points giving a total of 61 control points.
  * '@Ce('ctrl')' ends the contour resulting in 60 evenly spaced points, saved as 'ctr'.

  Note, that the contour is created in the XY plane: this works better for extrusions.

  * @#('c00') selects the created contour, and subsequent drawing uses it
  instead of the default circle contour

  See Babylon Hermite Spline doc here: 
   https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#hermite-spline
 */ 

view = {auto: 'Z'}
#define MAXSTEPS 10
derivation length: 1
stemsize=0.25         

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t<=MAXSTEPS ->  F(t)^(60)A(t+1)
A(t) : t > MAXSTEPS --> *
C --> [@H(1)@Cs(60)@Cn(60).f^(30)g(3)&(90)f@Ct(1,3)@Ce('ctr')]

