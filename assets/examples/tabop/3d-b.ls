/* 
   TABOP Figure 1.26 
   Since we don't support words as alphabet symbols, this has been translated.
   We also use the parameterized version of increment color index, ';', to set the colors explicitely using the default color table.
   Production p is plant
   Production i is internode
   Production s is seg
   Production l is leaf
   Production e is flower, since F and f are system modules
   Production d is pedicel
   Production w is wedge
 */

n=5; delta=18
axiom: p
p1: p ->i+[p+e]--//[--l]i[++l]-[pe]++pe
p2: i->Fs[//&&l][//^^l]Fs
p3: s->sFs
p4: l->[;(18){+f-ff-f+|+f-ff-f}]
p5: e->[&&&d;(176)/w////w////w////w////w]
p6: d->FF
p7: w->[;(50)^F][{&&&&-f+f|-f+f}]
