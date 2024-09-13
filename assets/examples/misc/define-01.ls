/*
  array variable definition
  Simply assign an array value to a variable name just as in JavaScript
  However, note that in mathjs array indexing starts at 1, not 0, so you need to do that, too,
  otherwise, it's just like a JS array
 */ 

lsystem: 1
derivation length:5
stemsize=STEM
delta = 30

a1 = [0,{y:1},[2];

axiom: A
p1: A --> B(a1[1])[;(32)C(a1[2])][;(16)D(a1[3])]
p2: B(x) : x < 3 --> B(x+1)F(x)
p3: B(x) --> *
p4: C(y)  : y.y < 4 --> C(y.y+1)-F(y.y)
p5: C(y) --> *
p6: D(z) : z[1] < 5 --> D(z[1]+1)+F(z[1])
p7: D(z) --> *


// space -- non ws
line1
 abc
line2
//tab -- non tab
line1
	abc
line2
// space or tab -- non tab
line1
 	abc
// space or tab -- newline
line1
 	
line2
// empty line: bare newline
line1

line2
