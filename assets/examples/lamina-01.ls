/* lamina. demonstrate branching siblings to the side of a 'cell' */
view = {position: [15, 6, -2], target: [0,5,0]};

#define offset stemsize/2
stemsize = 1
pitch = 12.5
derivation length: 9
ignore: &^
axiom: CA(9)
C --> @m(0.25,0,0)@Ds.^f(1)^f(0.5)^f(1)^f(0.5)@De('a')@#('a')
A(n) : n > 0 --> F&(pitch)A(n-1)
R(n) : n > 0 --> F&(pitch)R(n-1)
L(n) : n > 0 --> F&(pitch)L(n-1)
F > FA(n) -> F[;(20)+f(offset)+f|F&(pitch)R(n)][;(60)-f(offset)-f|F&(pitch)L(n)]
F > FR(n) -> F[;(20)+f(offset)+f|F&(pitch)R(n)]
F > FL(n) -> F[;(60)-f(offset)-f|F&(pitch)L(n)]

