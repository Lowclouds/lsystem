/*
  Contour example using @Cs...@Ce modules to define contour
  This is the simplest: create a straight line, then extrude a flat bar
  The C module creates the contour, using the rule:

  C --> [@H(1)@Cs@m(-3,0,0).@m(3,0,0).@Ce('ctr')]

  Step by step this is:
  * '[' saves the turtle state, and ']' restores it
  * '@H(1)' homes the turtle with the heading set to +X, i.e. (1,0,0)
  * '@Cs' starts the contour
  * '@m(-3,0,0)' moves the turtle to (-3,0,0)
  * '.' stores the first control point
  * '@m(3,0,0)' moves the turtle to (3,0,0)
  * '.' stores the second control point
  * '@Ce('ctr')' ends the contour, a straight segment with two points between the control points
     and stores it with the key 'ctr'

  * '@#('ctr')' selects the created contour, and subsequent drawing uses it
     instead of the default circle contour. 

  We switch back to the default contour at the end. Note tapered segment.
 */ 

derivation length:15
stemsize=0.25         

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t<=10 ->  F(t)^(80)A(t+1)
A(t) : t > 10 --> @#('default')#(1)F(t)
C --> [@H(1)@Cs@m(-3,0,0).@m(3,0,0).@Ce('ctr')]

