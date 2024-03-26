/*
  generate a contour and then extrude it along a Hermite spline path
   with radius modification and a small twist
  the axiom creates the contour with module C
  moves up, pitches 90, orients up, sets stem width, which
  causes a taper, moves forward, then starts extrusion

  p1: B is the beginning of the extrusion, selecting 
      contour 'lc' 
  p2: L sets an extrusion radius curve with the @Gr module
      this curve widens quickly then tapers to zero
  p3: E ends the Hermite path, adding a path twist before
      closing with the @Ge module
*/ 
view = {auto: 'Z'}
#define MAXSTEPS 10
derivation length: 2
stemsize=0.25         

axiom: Cf(10)-(90)/(90)[@#('ctr')A(1)]
A(t) : t==1 -> A(2)
A(t) : t>1 and t<=MAXSTEPS ->  F(t)^(60)A(t+1)
A(t) : t > MAXSTEPS --> *
/* contour generation - a shallow bump */ 
p4: C --> [@CsD@Ce('ctr')]
p5: D --> @H(0)@m(-1,1,0)&(179).@R(1,0,0)@m(0,0.5,0).@Ct(1,2).@m(1,1,0)^(89).@Ct(2,1)
