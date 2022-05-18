#define MaxInhibit 5
n=7
axiom: A
A -> PS(MaxInhibit)A
P > S(i) -> S(i-2)P
S(i) > S(j) -> F
S(i) : i > 0-> S(i-1)
S(i) : i == 0 -> T
