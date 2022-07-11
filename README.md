# L-system Explorer
## Overview

  Implements much of the system described in 'The Algorithmic Beauty of Plants' by Przemyslaw Prusinkiewicz and Aristid Lindenmayer, as well as parts of the system described in the CPFG user manual for their version of the system, which was the primary source for reverse-engineering the L-Studio functionality. Many great references for L-systems can be found here: [AlgorithmicBotany](http://algorithmicbotany.org/papers/ "Algorithmic Botany"). The best reference for this implementation, and it is far more complete than what is here, is the CPFG manual in the L-Studio package available from the algorithmicbotany site. This paper by Prusinkiewicz, Mech, and Hanan, [CPFGManual](https://prism.ucalgary.ca/bitstream/handle/1880/45607/1997-599-01.pdf?sequence=2 "Mech dissertation"), is also a useful reference - and the best for understanding the splined paths.

 [Babylonjs](https://babylonjs.com) is a major reason this exists at all, since all of the underlying geometry is built on top of it. The 3D turtle extrudes configurable shapes as it moves around, and uses the underlying scene, camera, lighting, materials, and textures. You can save generated meshes to disk and open them in Blender, and someday, may be able to import gltf meshes as turtle shapes or as surfaces. Thank you, Babylonjs team. 

  It uses mathjs for interpreting parameter values and expressions, so pretty much anything the mathjs expression evaluator can do is possible in expressions and parameters.

## What is an L-System?
   This is best explained by referring you to the source, [AlgorithmicBotany](http://algorithmicbotany.org/papers/#abop), but, in a nutshell, it is a system for modeling branchnging structures, like plants. It turns out that many interesting real and theoretical objects can be modeled using the notion of an L-System. L-System Explorer is broken into three parts: the parsing and rewriting of the L-System description/model, an underlying 3D turtle that can draw the geometry, and an interpreter that reads the expanded model and executes the appropriate turtle commands. 
   The model is a string (implemented here as an array) of modules, where a module is a single or multi-character word. A number of modules are reserved for the underlying geometry operations, while all remaining characters are available for writing model productions (see above.) 
   
## Features
  * Most of the basic turtle geometry:
  
      * Motion

        Forward with/without drawing, and with/without capturing control point, global goto with/without drawing

        FfGg@M(x,y,z)@m(x,y,z) 
      * Orientation

        Yaw, pitch, roll, reverse direction, set heading  

    	+-&^/\|@v@R(hx,hy,hz[,ux,uy,uz])
      * Settings

    	Increase/decrease/set color/material, increase/decrease/set line width/stemsize

        ;,#!
      * Geometry
  
        Create circle/sphere; define start/define end/use contour, start/end polygon, start/end path, capture control point.

        @o@O@Ds@De@#{}{([01]}.
  * Bracketed.
    This means that branches are represented by bracketed strings, i.e. FF[+FF][-FF]FF, which is goes forward two steps, branches twice at the same point, then goes forward two more steps. Each branch turns (yaws) +/- delta degrees and proceeds two steps.
  * Context sensitive. 
    A production may be dependent on its predecessor(s) or follower(s). There is no fixed limit on the number of preceding or following modules to match. For example, AB < C > D, matches the module 'C', if and only if it is preceded by the modules 'AB' and followed by the module 'D'.
  * Parametric. 
    Instead of fixed values for, say, moving forward or turning, the value can be a parameter generated by the L-System itself, and computed by an arbitrary expression (if supported by mathjs.) For example, F(10*sin(x)^2 + 8*cos(x)^2), is a valid module parameterization, assuming 'x' is defined in the context.
  * Conditional tests.
    A production can be made conditional on any function of the parameters in the predecessor. For example, A(n) > B(m) : m > 2*n --> A(n+1)
	
  * Complex production example:

    A(x) < B(y) > C(z) : x+y+z > 10 --> E((x+y)/2)F((y+z)/2)

  * Sub L-Systems. 
    There is provisional support for sub-L-systems, not well-tested yet.
  * Hermite Splines.
    These work, but adjustment of tangents is not fully implemented, and may never be.
  *	Contours.
    It is possible to define and use L-System generated contours for path shapes, which is not supported in L-Studio
  * Piecewise path.
    Paths can be extruded along paths where the points are not explicit spline control points. The path uses the underlying BABYLON Path3D (which looks very much like a CatmullRom spline).

## Missing or changed features
  * It does not implement stochastic L-systems, but that can be closely approximated by parametric expressions and could be made essentially equivalent (using conditional expressions and the rand function
  * BSpline paths
  * The '{(0)' module does not start a polygon, but a piecewise path. Polygons must use the unparameterized '{' module.
  * Setting the variable 'n' will set the derivation length, if it is not set. This allows you to use examples in The Algorithmic Beauty of Plants more easily
  * Decomposition. This feature, cool as it is, is on the back, back burner and may never see the light of day.

## Features in the  works:

   * Animations
   * Homomorphisms
   * Array specified contours and surfaces
   * L-system surface generation
   * Textures - currently just standard materials
   * A set of examples/tests, many taken from the book, 'The Algorithmic Beauty of Plants'
   
   
  
