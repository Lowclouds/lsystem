/*view = {position: [35,10,-5], target: [0,10,0]};*/

delta=22.5
stemsize=0.2
derivation length: 6
ignore: ;
axiom: D;(15)A
p1: A-> ,,[&FL!A]/////[&FL!A]///////[&FL!A]
p2: F-> S/////F
p3: S -> FL
p4: L -> [;(20)^(delta *(1+random()))@v/(20 *(0.5-random()))~('leaf')]
p5: D -> {-f+f+f-|-f+f+f}('','leaf')@m(0,0,0)@R(0,1,0,-1,0,0)

