/* 
   Five simple contours
   Simple contour of a curve through 5 points using something close to a Catmull-Rom spline
   Simple contour of an arc through 3 points
   Simple contour of an arc of centered at 0,-3,0; starting at -3,-1,0 and swept 90 degrees
   Simple contour of Hermite Spline with two control points and tangent vectors
   Contour with multiplicty 4, with each quadrant a Hermite spline
*/
#define STEPL 0.5
#define STEPA 3
#define LEAFL 30
#define STEPW 0.1
#define STEM 1
#define ISTEM 0.1

#define NLEAVES 5

stemsize=STEM
w = STEPW
c = 0

lsystem: 1
derivation length: 38
ignore: $
axiom: $(2)C$S
M<S --> ;(85)[F(5)B(1)]
A(t,lw) : t<=5 ->  #(t*lw)F(STEPL)&(STEPA)A(t+1,lw)
A(t,lw) : (t>=LEAFL-5) and (t <= LEAFL) -->  #((LEAFL-t)*lw)F(STEPL)&(STEPA)A(t+1,lw)
A(t,lw) --> F(STEPL)&(STEPA)A(t+1,lw)
B(u) : u <= NLEAVES --> F(5)\(60)L#(STEM - u*ISTEM)B(u+1)
B(u) : u > NLEAVES --> F(1)#(0.1)F(1)#(0.25)
L : * {c = c + 1; w = (c==5) ? 0.7 : STEPW} --> [-(30)@v;(20)@#(c){(0)A(1,w)}(0)]

endlsystem

lsystem: 2
axiom: A
C --> C(1)C(2)C(3)C(4)C(5)
C(i) : i == 1 --> @DsD(i)@De(i)@m(0,0,0)
D(i) : i == 1 --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).3
C(i) : i == 2 --> @DsD(i)@De(i)@m(0,0,0)
D(i) : i == 2 --> @m(-3,-1,0).@m(-2,0,0).@m(3,-1,0).@Da(0)
C(i) : i == 3 --> @DsD(i)@De(i)@m(0,0,0)
D(i) : i == 3 --> @m(0,-3,0).@m(-3,-1,0).@Da(1,90)
C(i) : i == 4 --> @DsD(i)@De(i)@m(0,0,0)
D(i) : i == 4 --> @m(-3,-1,0)@R(1,1,0).@m(3,-1,0)@R(1,-1,0).@Dt
C(i) : i == 5 --> @Ds(24,1)D(i)@De(i)@m(0,0,0)M
D(i) : i == 5 --> @m(-3,1,0)@R(-1,1,0).@m(3,1,0)@R(1,1,0).@Dt@Dm(4)

endlsystem
