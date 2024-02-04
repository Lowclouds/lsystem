/* TABOP p. 128 Models of Compound leaves */
/* Example d
   Apical delay is D
   Internode elongation rate is R 
   To match the illustration in the book you need
   to adjust the default angle for + and -, or set
   it explicitly.
*/
D=4
R=1.23
stemsize=1.5
delta = 45  /* default angle of yaw, pitch and role */
derivation length: 8
axiom: A(0)
P1: A(d) : d>0 -> A(d-1)
P2: A(d) : d==0 -> F(1)[+A(D)][-A(D)]F(1)A(0)
P3: F(a)        -> F(a*R)
