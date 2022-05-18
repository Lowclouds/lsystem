#define MAXINHIBIT 5
derivation length: 15
delta = 45
axiom: A
A   --> PS(MAXINHIBIT)A
P>S(i)  -> S(i-2)P
S(0) < P --> [+@vFA][-@vFA]
S(i) > S(j) -->  F
S(i) : i > 0 --> S(i-1)
S(0) > P --> *

