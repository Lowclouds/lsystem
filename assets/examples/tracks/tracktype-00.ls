/*
   This uses a track path type of 0, which is similar to a catmull-rom spline 
   through the points  
 */ 
n=30;delta=22.5;stemsize=0.1
ignore: +-F
axiom: {(0)F1F1F1}(0)
p1: 0 < 0 > 0 -> 0
p2: 0 < 0 > 1 -> 1[+F1F1}(0)]
p3: 0 < 1 > 0 -> 1
p4: 0 < 1 > 1 -> 1
p4: 1 < 0 > 0 -> 0
p4: 1 < 0 > 1 -> 1F1
p4: 1 < 1 > 0 -> 0
p4: 1 < 1 > 1 -> 0
p5: + -> -
p5: - -> +
