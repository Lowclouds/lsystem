
lsystem: d
derivation length:1
stemsize=STEM

define: {
   var a1 = [0,1,2];
  }

axiom: A
p1: A --> B(a1[0])[C(a1[1])][D(a1[2])]
p2: B(x) : x < 3 --> B(x+1)A
p3: C(y)  : y < 3 --> C(y+1)A
p4: D(z) : z < 3 --> D(z+1)A


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
