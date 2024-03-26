/*
  Contour example using @Cs...@Ce modules to define contour
  This creates an arc contour using the arc segment module, @Ca(0), which requires
  three contour points to create a circular arc.

  The C module creates the contour, using the rule 

  C --> [@Cs.&(30)f^(60)f@Ca(0)@Ce('ctr')]

  Step by step:
  * '[' saves the turtle state, and ']' at the end restores it
  * '@Cs' starts the contour with default parameters
  * '.' stores the first control point
  * '&(30)f' pitches down, moves one unit and stores the second control point
  * '^(60)f' pitches up 60 degrees, moves one unit and stores the third control point
  * '@Ca(0)' creates an arc segment between the three points, inserting the default
    number of points per segment, 16
  * @Ce('ctr') ends the contour, storing it with the key, "ctr".
    
  * @#('ctr') selects the created contour, and subsequent drawing uses it
  instead of the default circle contour
 */ 

derivation length: 4
stemsize=0.25         

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t<=10 ->  F(t)^(60)A(t+1)
A(t) : t > 10 --> @#('default')F(t)
C --> [@Cs.&(30)f^(60)f@Ca(0)@Ce('ctr')]

