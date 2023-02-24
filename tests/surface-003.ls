stemsize = 0.1
ignore: ]
derivation length: 3
axiom: @R(1,0,0,0,1,0)CBLEH
/* begin extrusion using lc contour */
p1: B --> !(0.02)@#('lc')@Gs
/* set tangents of hermite spline*/
p2: L --> @Gr(40,1,-10,1)
/* end extrusion and save it as surface 'leaf' */
p3: E --> g!(0.0).@Ge(8,'leaf')M

p4: C --> @DsD@De('lc')
p5: D -->>@m(-1,-0.2,0).@m(-.8,0,0).@m(-0.3,0.2,0).@m(0.3,0.2,0).@m(0.8,0,0).@m(1,-0.2,0).
/* move to where we want and insert 'leaf' */
p6: M < H -> +(45)^(45)!(0.1)F&(45)@v;(32)~('leaf',2)
