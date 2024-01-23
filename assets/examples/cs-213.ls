/* TABOP pg. 34 fig. c */ 
view = {position: [90,45,0], target: [0,30,0]};

derivation length: 26
n=26;delta=25.75;stemsize=0.1
ignore: +-F
axiom: F1F1F1
p1: 0 < 0 > 0 -> 0
p2: 0 < 0 > 1 -> 1
p3: 0 < 1 > 0 -> 0
p4: 0 < 1 > 1 -> 1[+F1F1]
p4: 1 < 0 > 0 -> 0
p4: 1 < 0 > 1 -> 1F1
p4: 1 < 1 > 0 -> 0
p4: 1 < 1 > 1 -> 0
p5: + -> -
p5: - -> +
