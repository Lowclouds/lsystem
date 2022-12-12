/*
  generate a contour and then extrude it along a Hermite spline path
   with radius modification and a small twist
*/ 
stemsize = 0.1
derivation length: 2
axiom: CF&+(90)@vFBLE
/* extrude path*/ 
p1: B --> !(0.02)@#(0)@Gs
p2: L --> @Gr(40,1,-10,1)
p3: E --> g!(0.0)/(30).@Ge(8)
/* contour generation - a shallow bump */ 
p4: C --> @Ds(0)D@De('lc')
p5: D -->>@m(-1,-0.2,0).@m(-.8,0,0).@m(-0.3,0.2,0).@m(0.3,0.2,0).@m(0.8,0,0).@m(1,-0.2,0).
