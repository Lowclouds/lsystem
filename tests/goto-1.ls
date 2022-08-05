dlength: 10
stemsize=0.01
#define RAND (random()-0.5)
#define X 5*RAND*y
#define Z 5*RAND*y
#define Y y+ 2*RAND

axiom: @m(0,5,0)
@m(x,y,z) : y< 10 --> @m(x,y,z);;@O(0.5)@m(X,Y,Z)
