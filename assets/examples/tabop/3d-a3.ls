/*
  This variant of TABOP Fig 1.25 uses L-system defined contours and surface meshes for the leaves, instead of polygons.
  Production L inserts the defined surface, 'leaf', with a random scale
  Production C creates the contour, 'lc' in the XZ plane.
  Production B initiates an extrusion of the contour along a Hermite spline path, also in the XZ plane.
  Production E ends the extrusion, storing it as surface mesh 'leaf', and then restores the contour, position, orientation, and size context, and inserting a marker that initiates expansion of the bush with production A.
 */
delta=22.5
stemsize=0.2
derivation length: 11
ignore: ;
axiom: CN
p1: A -> ,,[&FL!A]/////[&FL!A]///////[&FL!A]
p2: F-> S/////F
p3: S -> FL
p4: L -> [;(20)+(delta *(3+random()))@v/^^~('leaf',0.5+1.5*random())]
p5: M < N --> ;(15)A
p6: M > A --> *

p7: C --> @R(1,0,0,0,1,0)@DsD@De('lc')B
p8: D -->>@m(-1,-0.2,0).@m(-.8,0,0).@m(-0.3,0.2,0).@m(0.3,0.2,0).@m(0.8,0,0).@m(1,-0.2,0).
p9: B --> !(0.02)@#('lc')@GsR
p10: R--> @Gr(40,1,-10,1)E
p11: E --> g!(0.0).@Ge(8,'leaf')@#('default')!(stemsize)@m(0,0,0)@R(0,1,0,-1,0,0)M
