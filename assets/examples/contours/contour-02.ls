/*
  Contour example using @Cs...@Ce modules to define contour
  This recreates the default circle contour using the arc segment module @Ca(1,angle)
  It requires two control points, a center and a point on the radius.

  The C module creates the contour, using the rule:

  C --> [@Cs.f@Ca(1,360)@Ce('ctr')]

  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@Cs' starts the contour with default parameters
  * '.f' stores the first control point, moves forward one unit and stores the second
  * '@Ca(1,360)' creates a 360 degree arc segment around the first control point, starting
     at the second control point. The segment has the default 16 points which are spliced
     back into the control points.
  * '@Ce('ctr')' ends the contour, saving it with key, "ctr". The final contour has 16
     points, since the default of 0 for number of contour points means to use exactly
     the generated control points.

  * '@#('ctr')' selects the created contour, and subsequent drawing uses it
     instead of the default circle contour
 */ 

derivation length:4
stemsize=1        

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t<=10 ->  F(t)^(60)A(t+1)
A(t) : t > 10 --> @#('default')F(t)
C --> [@Cs.f@Ca(1,360)@Ce('ctr')]

