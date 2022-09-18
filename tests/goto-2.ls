dlength: 10
stemsize=0.01
#define RAND (random()-0.5)
#define X 8*RAND*y
#define Z 8*RAND*y
#define Y y+ 3*RAND
#define RANDC fix(255 * random())
#define RANDS 2*random()

axiom: @m(0,5,0)
@m(x,y,z) : y< 10 --> @m(x,y,z);(RANDC)@O(RANDS)@m(X,Y,Z)
