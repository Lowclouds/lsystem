/* TABOP Sec 1.10.2 L-system 1.1: Anabaena catenula, Fig 1.35 
   note bug fix in production 3 to leave F(0,0,CH) module unchanged
   Note, too, that I can't reproduce the behavior from TABOP
   I've added coloring modules which, I think, indicate the problem,
   but don't help with fixing it.

   The given derivation length gets you right up to where the model breaks down.
*/

#define CH 900                  /* high concentration */
#define CT 0.4                  /* concentration threshold */
#define ST 3.9                  /* segment size threshold */
#define COLOR 56 + round(c/CH * 112)
/*
view = { position: [85,15,-100], target: [100,1,0]};
*/
view = {auto: [1,.1,0]};

stemsize = 0.8
ignore: f@O;,

derivation length: 159
axiom: -(90);(112)F(0,0,CH)F(4,1,CH)F(0,0,CH)
p1: F(s,t,c) : t==1 and s>=6 --> ;(COLOR)F(s/3*2,2,c)f(1)F(s/3,1,c)
p2: F(s,t,c) : t==2 and s>= 6 --> ;(COLOR)F(s/3,2,c)f(1)F(s/3*2,1,c)
p3: F(h,i,k) < F(s,t,c) > F(o,p,r) :s < 6 and (s>ST or c>CT) --> ;(COLOR)F(s+0.1,t,c+0.25*(k+r-3*c))
p4: F(h,i,k) < F(s,t,c) > F(o,p,r) : not (s>ST or c>CT) --> F(0,0,CH);(152)@O(1)F(0,0,CH)
p5: @O(s) : s<3 --> ;(round(152+s))@O(s*1.1)
p5: @O(s) : s>=3 --> ;(round(156))@O(s)
p6: ;(x) -> *