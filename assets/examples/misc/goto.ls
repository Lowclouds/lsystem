dlength: 10
stemsize=0.01
#define RAND (random()-0.5)
#define X 5*RAND*y
#define Z 5*RAND*y
#define Y y+RAND

axiom: @M(0,5,0)
@M(x,y,z) : y< 10 --> @M(x,y,z);;@O(0.5)@M(X,Y,Z)
