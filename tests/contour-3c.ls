#define STEPL 0.5
#define STEPA 3
#define LEAFL 30
#define STEPW 0.1
#define STEM 0.7
#define ISTEM 0.1

#define NLEAVES 5

stemsize=STEM
c = 0

lsystem: 1
derivation length: 35
ignore: $
axiom: $(2)C$S
M<S --> ;(85)[F(5)B(1)]
A(t) : t<=5 ->  #(t*STEPW)F(STEPL)&(STEPA)A(t+1)
A(t) : (t>=LEAFL-5) and (t <= LEAFL) -->  #((LEAFL-t)*STEPW)F(STEPL)&(STEPA)A(t+1)
A(t) --> F(STEPL)&(STEPA)A(t+1)
B(u) : u <= NLEAVES --> F(5)\(60)L#(STEM - u*ISTEM)B(u+1)
B(u) : u > NLEAVES --> F(1)#(0.1)F(1)#(0.25)
L : * {c = c + 1} --> [-(30)@v;(20)@#(c){(0)A(1)}(0)]

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
D(i) : i == 5 --> @m(-3,-1,0)@R(1,1,0).@m(3,-1,0)@R(1,-1,0).@Dt@Dm(3)

endlsystem
