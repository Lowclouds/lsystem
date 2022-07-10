/* TABOP pg. 34 fig. d */ 
view = {position: [150,60,0], target: [0,55,-10]};

derivation length: 24
delta=25.75;stemsize=0.1
ignore: +-F
axiom: F0F1F1
p1: 0 < 0 > 0 -> 1
p2: 0 < 0 > 1 -> 0
p3: 0 < 1 > 0 -> 0
p4: 0 < 1 > 1 -> 1F1
p4: 1 < 0 > 0 -> 1
p4: 1 < 0 > 1 -> 1[+F1F1]
p4: 1 < 1 > 0 -> 1
p4: 1 < 1 > 1 -> 0
p5: + -> -
p5: - -> +
