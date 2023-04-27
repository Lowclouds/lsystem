/*
 Test size functions including taper
 production p1 uses discrete steps
 production p3 uses a Babylon path extrusion
*/ 
#define SCALE 0.5
#define SCALE 0.5
n=14
ignore: {
axiom: #(1)[#(0.5)A(1)]
p1: #(s) < A(n) : n>0.01 --> F(1)#(s*SCALE)A(s*SCALE)
p2: A(n) : n <= 0.01 --> ]@m(0,0,2)#(1)[;(18)#(0.5){(0)B(1)}
p3: #(s) < B(n) : n>0.01 --> f(1)#(s*SCALE)B(s*SCALE)
p4: #(s) < B(n) : n<=0.01 --> 
