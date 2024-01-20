/*
  This demonstrates basipetal flow, i.e. from the top to the 
  base. Note that it implicitly skips branches entirely as
  it encounters them in the '>' after context search
*/
#ignore +-
axiom: A[+A]A[-A]A[+A]B
p1: A > B -> B
