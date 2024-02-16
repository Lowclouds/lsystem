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
stemsize = 0.1
derivation length: 2
axiom: CF&+(90)!(0.02)@vFBLE
/* extrude path */ 
p1: B --> @#('lc')@Gs  
p2: L --> @Gr(40,1,-10,1)
p3: E --> g!(0.0)/(45).@Ge(8)
/* contour generation - a shallow bump */ 
p4: C --> @CsD@Ce('lc')
p5: D -->>@m(-1,-0.2,0).@m(-.8,0,0).@m(-0.3,0.2,0).@m(0.3,0.2,0).@m(0.8,0,0).@m(1,-0.2,0).
