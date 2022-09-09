#define MAXINHIBIT 5
derivation length: 15
delta = 45
axiom: A
A   --> PS(MAXINHIBIT)A
P>S(n)  -> S(n-2)P
S(i) < P : i == 0 --> [+@vFA][-@vFA]
S(i) > S(j) -->  F
S(n) : n> 0 --> S(n-1)
S(i) > P : i==0 --> *

