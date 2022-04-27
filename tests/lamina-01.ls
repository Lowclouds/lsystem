stemsize = 0.2
pitch = 12.5
derivation length: 10
ignore: &
axiom: &(-45)A(5)
A(n) : n > 0 --> F&(pitch)A(n-1)
R(n) : n > 0 --> F&(pitch)R(n-1)
L(n) : n > 0 --> F&(pitch)L(n-1)
F > FA(n) -> F[;(20)+f(stemsize)+f|F&(pitch)R(n)][;(60)-f(stemsize)-f|F&(pitch)L(n)]
F > FR(n) -> F[;(20)+f(stemsize)+f|F&(pitch)R(n)]
F > FL(n) -> F[;(60)-f(stemsize)-f|F&(pitch)L(n)]