stemsize=2
#define CENTRAL_ANGLE 20
#define STEPSIZE 1
#define ITER 50
derivation length: ITER
axiom: ;(1)CSH(ITER)}
S -> @#('ctr'){(0)
H(l) : l==0 --> *
H(l) : l > 0 --> \(CENTRAL_ANGLE)F(STEPSIZE)H(l-1)
C --> [@H@CsD@Ce('ctr')]
D --> @m(-1,-0.1,0).@m(-1, 0.1,0).@m(1,0.1,0).@m(1,-0.1,0).@m(-1,-0.1,0).
