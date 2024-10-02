/*
  array variable definition
  Simply assign an array value to a variable name just as in JavaScript

  Two caveats when using arrays:
  First, note that in mathjs array indexing starts at 1, not 0, so you need to do that, too.

  Second, arrays can contain other types, BUT, if an array element is an array, then all the
  elements at that level in the array must ALSO be arrays, since mathjs will try to convert
  it to its Matrix type. So, for example, a = [1, [2], [[3]]], is invalid, 

 */ 
#define aInc 0.1415
#define bScale 1.15
#define alpha α
#define beta β
#define DELTA δ
#define theta θ

/*
 a0 is a global variable, because it is defined before the first
 lsystem: keyword
 */ 
a0 = [0, 1, 2]

lsystem: 1
derivation length:5
delta = 30
/*
  a1 is local to this lsystem, and it is a mathjs 1x3 Matrix
 */ 
a1 = [[0],[1],[2]]

/*
  a2 is also local to lsystem 1, and has various types
 */
a2 = [0, '1', {z: 2}]

Start: { alpha = 1; beta = 0; DELTA = aInc; theta = bScale };
StartEach: { beta = alpha + beta * theta;
             alpha = alpha + DELTA;
           }            
EndEach: { a0[1] = alpha + alpha ;}
End: { a0[1] = 'done';}

axiom: A

p1: A --> B(a0[1])[;(32)C(a1[2,1])][;(16)D(a2[3])]$(2)E$
p2: B(x) : x < 3 --> B(x+1)F(x)
p3: B(x) --> *
p4: C(y)  : y < 4 --> C(y+1)-F(y)
p5: C(y) --> *
p6: theta(z) : z.z < 5 --> theta(z.z+1)+F(z.z)
p7: theta(z) --> *

endlsystem

lsystem: 2

/*
  b0 is local to lsystem 2, so, we can't reference it when evaluating in lsystem 1
  All of lsystem 1's local variables are visible here, because it is a sub-lsystem
 */
b0 = ['\"default\"', {y: 2}, 3]

/* 
  Note that the string 'default', above, needs to include the quotes. This is an 
  unavoidable consequence of parsing and evaluation of parameters. Without the  
  quotes, the string value, when substituted, is mistaken for a variable name.
*/
axiom: E   /* this is only required for correct parsing. the actual axiom is not used */
p1: E -> Q(a0[1], a1[2,1], a2[3], b0[1])
p2: Q(x,y,z,c) -> ;(50)@#(c)@M(x,y,z.z)

endlsystem
