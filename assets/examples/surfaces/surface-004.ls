/*
  This constructs a cone in NP (= 5) sections that grows upward at an angle of TUBEANGLE degrees.
  It illustrates the use of math expressions and #defines.
  Note the use of the M module to enable various stages in the development. The B and H 
  modules are both inhibited, i.e. won't expand, until the M marker module precedes them,
  ignoring the ] and @Ce modules.
*/

#define NP 5
#define BETA (360/NP)
#define sHALFB sin(d2r*BETA)
#define d2r PI/180
#define GAMMA (d2r*(180 - BETA)/2) 
#define cB cos(GAMMA)
#define sB sin(GAMMA)
#define Q 8
#define AINC d2r * BETA/Q

#define TUBELEN 10
#define TUBEBASE 2
#define TUBEANGLE 8
#define TOP_RADIUS (TUBEBASE/2 + TUBELEN * sin(d2r*TUBEANGLE))
#define TOP_SIZE 2*TOP_RADIUS
#define LOBELEN 3
view = {auto: '-Y'}

stemsize = TUBEBASE
ignore: ]@Ce
derivation length: 18
axiom: @HCBH
/* begin extrusion using lc contour @m(TUBEBASE,0,0) ??*/
p1: M < B -->  ;(65)@H(1)^(TUBEANGLE)!(TUBEBASE)@#('pc'){(0).!(TOP_SIZE)f(TUBELEN)}('petal')M
/* end extrusion and save it as surface 'petal' 
p3: E --> .f(TUBELEN)}~('petal')M
*/
/* contour definition */ 
p4: C --> @CsD(0)@Ce('pc')

p5: D(i) : i <= Q --> @m((cos(GAMMA + (i * AINC))) , sin((GAMMA + (i * AINC)))-1,0).D(i+1)
/*
p5: D(i)  i <= Q --> 
*/
p6: D(i) : i > Q -> M

/* move to where we want and insert 'petal' */
p7: M < H -> @H(1)I(NP)
p8: I(p) : p > 0 --> g(-1*TUBEBASE/2)^(90)~('petal',1)&(90)g(TUBEBASE/2)^(90)\(BETA)&(90)I(p-1)
p9: I(p) : p == 0 --> *
p10: M -> *
