#define r1 0.9
#define r2 0.8
#define a0 45
#define a2 45
#define d 137.5
#define wr 0.8
vx= 1
vy = 2
vz = 0
α = 0
dist = 15
view = {target: 'mesh', position: [vx, vy, vz]}
lsystem: 1
dlength: 13
stemsize: 1.5

EndEach: {
        α = (α + 10)%360; dist = 1.2 * dist; 
        vx = dist * cos(α); vy = 1.25 vy; vz = dist * sin(α);
        view.position = [vx, vy, vz]; }

axiom: A(10,1.5)
p1: A(l,w) -> !(w)F(l)[&(a0)B(l*r2,w*wr)]/(d)A(l*r1,w*wr)
p2: B(l,w) -> !(w)F(l)[-(a2)@vC(l*r2,w*wr)]C(l*r1,w*wr)
p3: C(l,w) -> !(w)F(l)[+(a2)@vB(l*r2,w*wr)]B(l*r1,w*wr)


