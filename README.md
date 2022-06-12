# Lsystem
Implements much of the system described in 'The Algorithmic Beauty of Plants' by Przemyslaw Prusinkiewicz and Aristid Lindenmayer,
as well as parts of the system described in the CPFG user manual for their version of the system. Many great references for L-systems can be found here: http://algorithmicbotany.org/papers/
The best reference for this implementation, and it is far more complete than what is here, is this paper by Prusinkiewicz, Mech, and Hanan, https://prism.ucalgary.ca/bitstream/handle/1880/45607/1997-599-01.pdf?sequence=2

This implements fully parameterized modules, as well as context-sensitive tests, so it supports productions like the following:

A(x) < B(y) > C(z) : x+y+z > 10 --> E((x+y)/2)F((y+z)/2)

It uses mathjs for interpreting parameter values and expressions, so pretty much anything mathjs can do is possible in expressions.

It does not implement stochastic L-systems, but that can be closely approximated by parametric expressions and could be made essentially equivalent.
There is provisional support for sub-L-systems, not well-tested yet, and support for open Hermite spline paths. There is support for L-system generated 
path contours for all path types. 

Features in the  works:
  Animations
  Homomorphisms
  Array specified contours and surfaces
  L-system surface generation
  Textures - currently just standard materials
  
