dlength: 10
stemsize=0.005
#define X 5*(random()-0.5)*y
#define Z 5*(random()-0.5)*y

axiom: @M(0,2,0)@O(0.5)
@M(x,y,z) : y< 10 --> @M(x,y,z);;@M(X,y+1,Z);;@O(0.5)
