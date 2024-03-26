/*
    TABOP Figure 1.25 again, using the view statement to place the camera
    For this version, we create one polygon in production D, and save it as the mesh, 'leaf', using the parameterized version of the module, '}', i.e. {....}(name). Note that leaf is quoted, otherwise the name would have been the value of a variable, leaf.
    Then, in production L, instead of creating a new polygon, we insert it using the ~('leaf') module. This is much faster and less memory intensive for large trees.
*/ 

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
p5: D -> {-f+f+f-|-f+f+f}('leaf')@m(0,0,0)@R(0,1,0,-1,0,0)

