/* lamina. demonstrate branching siblings to the side of a 'cell' 
    rule C creates a rectangular extrusion shape
    rule A creates the central brown 'rib'
    rules R and L create the  ribs on the  sides
*/
view = {position: [25, 6, -2], target: [0,5,0]};

#define offset stemsize
stemsize = 1
pitch = 12.5
derivation length: 9
ignore: &^
axiom: CA(9)
C --> @m(0.5,0,0)@Cs.^f(1)^f(0.5)^f(1)^f(0.5)@Ce('a')@#('a')
A(n) : n > 0 --> F&(pitch)A(n-1)
R(n) : n > 0 --> F&(pitch)R(n-1)
L(n) : n > 0 --> F&(pitch)L(n-1)
/*
  the pattern, +f(offset)+f|F&(pitch) 
    yaws the turtle 90 degrees
    moves forward offset, without drawing
    yaws another 90 degrees (hence facing backwards)
    does a 180, the '|' module
    moves forward one unit while drawing
    pitches pitch degrees

   since these are all in a branch, the turtle returns 
   to the last row at the end of all that
   the F module is replaced at each step by a replica of the pattern
   if and only if it is followed by another FA(n), FR(n) or FL(n)
   this gives the central parts two steps ahead of the outer ones
*/
F > FA(n) -> F[;(20)+f(offset)+f|F&(pitch)R(n)][;(60)-f(offset)-f|F&(pitch)L(n)]
F > FR(n) -> F[;(20)+f(offset)+f|F&(pitch)R(n)]
F > FL(n) -> F[;(60)-f(offset)-f|F&(pitch)L(n)]

