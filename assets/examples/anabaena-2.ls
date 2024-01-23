/* from Modeling Morphogenesis in Multicellular
Structures with Cell Complexes and L-systems
Przemyslaw Prusinkiewicz and Brendan Lane
http://algorithmicbotany.org/papers/complexes.pfm2012.pdf
*/ 

#define H 0 /* Heterocyst cell type */
#define V 1 /* Vegetative cell type */
#define K (random(0,2.0)) /* Diffusion coefficient */
#define nu 0.5 /*  Turnover rate */
#define R 1.1 /* Cell growth factor */
#define theta 0.1 /* Threshold for heterocyst differentiation */
#define sMAX 0.8 /* Cell size at division */
#define dt 0.5 /* Time step */

Axiom: C(H, 1, 1) W(0) C(V, 1, 1) W(0) C(H, 1, 1)
p1: C(aL, cL, sL) < W(J) > C(aR, cR, sR) -> W(K * (cL - cR))
p2: C(a, c, s) : a == H -> C(H, 1, 1)
p3: W(JL) < C(a, c, s) > W(JR) :
    { c = c+ ((JL - JR) - nu)*dt; s = s*R^dt; } a == V and c < theta -> C(H,1,1)
p4: W(JL) < C(a, c, s) > W(JR) :
    { c = c + ((JL-JR) - nu)*dt; s = s*R^dt;} a == V and s > sMAX -> C(V,c,s/2)W(0)C(V,c,s/2)
p5: W(JL) < C(A,c,s) > W(JR) :
    { c = c+((JL-JR) - nu)*dt; s = s*R^dt;}: A == V  -> C(V,c,s)
