/*
   This uses a track path type of 1, i.e. an open hermite spline.
   It is noticeably slower than a track type of 0, which is just
   a path through the points

 */ 
n=30;delta=22.5;stemsize=0.1
ignore: +-F
axiom: {(1)F1F1F1}(1)
p1: 0 < 0 > 0 -> 0
p2: 0 < 0 > 1 -> 1[+F1F1}(1)]
p3: 0 < 1 > 0 -> 1
p4: 0 < 1 > 1 -> 1
p4: 1 < 0 > 0 -> 0
p4: 1 < 0 > 1 -> 1F1
p4: 1 < 1 > 0 -> 0
p4: 1 < 1 > 1 -> 0
p5: + -> -
p5: - -> +
