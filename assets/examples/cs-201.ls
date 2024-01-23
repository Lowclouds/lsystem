/*
  Stepping through this expansion, you get a simulation of
  both acropetal movement of b, and basipetal movement of c
  When b and c meet, they exchange positions
*/
axiom:baaaaaaaac
p1: b>c -> c
p2: b<c -> b
p3: b<a -> b
p4: a>c -> c
p6: b -> a
p7: c -> a
