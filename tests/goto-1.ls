dlength: 10
stemsize=0.25
r=3
#define X r*(random()-0.5)*y
#define Z r*(random()-0.5)*y

axiom: f(2)@m(0,2,0)@O(0.5)
@m(x,y,z) : y< 10 --> @m(x,y,z);;;@m(X,y+random(),Z);;;@O(0.5)
