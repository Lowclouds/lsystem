# L-system Explorer
## Overview

  L-system Explorer implements much of the system described in 'The Algorithmic Beauty of Plants' by Przemyslaw Prusinkiewicz and Aristid Lindenmayer, as well as most of the system described in the L-Studio/vlab documentation, my primary source for reverse-engineering. Many great references for L-systems can be found here: [Algorithmic Botany](http://algorithmicbotany.org/papers/ "Algorithmic Botany"). The best reference for this implementation, and it is far more complete than what is here, is the CPFG manual in the L-Studio package available from the algorithmicbotany site. This paper by Prusinkiewicz, Mech, and Hanan, [Mech Dissertation ](https://prism.ucalgary.ca/bitstream/handle/1880/45607/1997-599-01.pdf?sequence=2 "Mech dissertation"), is also a useful reference - and the best for understanding the splined paths.

 [Babylonjs](https://babylonjs.com) is a major reason this exists at all, since all of the underlying geometry is built on top of it. The 3D turtle extrudes configurable shapes as it moves around, and uses the underlying scene, camera, lighting, materials, and textures. You can save generated meshes to disk and open them in Blender, and, someday, may be able to import gltf meshes as turtle shapes or as surfaces. Thank you, Babylonjs team. 

 It uses mathjs for interpreting parameter values and expressions, so pretty much anything the mathjs expression evaluator can do is possible in expressions and parameters. Likewise, things that mathjs can't do are, for the most part, also not possible.

## What is an L-System?
   This is best explained by referring you to the source, [Algorithmic Botany](http://algorithmicbotany.org/papers/#abop), but, in a nutshell, it is a system for modeling branching structures, such as, say, plants. It turns out that many interesting real and theoretical objects, fractals, e.g., can be modeled using the formalism of an L-System. L-System Explorer is broken into three parts: the parsing and rewriting of the L-System description/model, an underlying 3D turtle that can draw the geometry, and an interpreter that reads the expanded(rewritten) model and executes the appropriate turtle functions. 
   The model is a string (implemented here as an array) of modules, where a module is a single or multi-character word. A number of modules(characters) are reserved for the underlying geometry operations, while all remaining characters are available for writing model productions. 

## Setting it up
 The implementation runs completely in your browser. To set it up locally, you can 

 * install npm
 * Clone the repository, see the green Code button, above.
 * In a console, cd to the repository directory and run \'npm i\'. This will install all the dependencies locally.
 * then enter \'npm run dev\'
 * open a browser and navigate to localhost:8080

## Features
  * Most of the basic turtle control, motion, and geometry, with associated reserved modules. 
      * Motion

        Forward with/without drawing, and with/without capturing control point, global goto with/without drawing.

        ~~~
        F f G g @M(x,y,z) @m(x,y,z)
        ~~~
      * Orientation

        Yaw, pitch, roll, reverse direction, set up, set heading
        
        ~~~
        +  -  &  ^  /  \  |  @v  @R(hx,hy,hz[,ux,uy,uz])
        ~~~
      * Settings

    	Increase/decrease/set color/material, increase/decrease/set line width/stemsize

        ~~~
        ; , # !
        ~~~
      * Geometry

        Create circle/sphere; define start/define end/use contour, start/end polygon, start/end path, capture control point. These elements are implicitly instanced for performance.

        ~~~
        @o @O @Ds @De  @#  {} {([0-4])}.
        ~~~
      * Hermite Splines.

        These work, but adjustment of tangents is not fully implemented, and may never be. An extension of TABOP allows you to save an extrusion as a single mesh and then instantiate it by name. This greatly improves performance.
      
      *	Contours.
        It is possible to define and use L-System generated contours for path shapes, which is not supported in L-Studio. 
      * Piecewise path.

        Contours can be extruded along paths where the points are not explicit spline control points. This path uses the underlying BABYLON Path3D (which looks very much like a CatmullRom spline).
  * L-system development
      * Branching

        This means that branches are represented by bracketed strings, e.g. 

        ~~~
        FF[+FF][-FF]FF
        ~~~
        which is goes forward two steps, branches twice at the same point, then goes forward two more steps. Each branch turns (yaws) +/- delta degrees and proceeds two steps.
      * Context sensitive. 

        A production may be dependent on its predecessor(s) or follower(s) in the string. There is no fixed limit on the number of preceding or following modules to match. For example, AB < C > D, matches the module 'C', if and only if it is preceded by the modules 'AB' and followed by the module 'D'.
      * Parametric. 

        Instead of fixed values for, say, moving forward or turning, the value can be a parameter generated by the L-System itself, and computed by an arbitrary expression (if supported by mathjs.) For example, F(10*sin(x)^2 + 8*cos(x)^2), is a valid module parameterization, assuming 'x' is defined in the context.
      * Conditional tests.

        A production can be made conditional on any function of the parameters in the predecessor. For example, 

        *A(n) > B(m) : m > 2*n --> A(n+1)* , matches only if B(m) follows A(n) and m > 2*n

        Complex production example:
          
        A(x) < B(y) > C(z) : x+y+z > 10 --> E((x+y)/2)F((y+z)/2)

      * Sub L-Systems. 

        There is support for sub-L-systems, although scaling of an Lsystem is not yet implemented.
  * UI
      * Stepwise interpretation of an L-system

        This is a poor man's animation, but sometimes useful in debugging an L-system. By controlling the 'speed' of interpretation in iterations/frame, you can get a decent sense of the evolution of the system. Coupled with the multiple turtle mode, this looks pretty good. Creating movies of animations is again on the backburner.
      * Multiple turtle mode.

        Instead of a left-to-right, effectively depth-first, drawing, this mode does a breadth-first traversal of the branches as they arise in the system, so the tree grows in a more natural fashion. For L-systems without branches, like most fractals, there is no difference. This can interact badly with polygon creation that crosses branch boundaries, and with the cut operator, %, so, this mode is turned off by default.

## Missing or changed features
  * It does not implement stochastic L-systems, but that can be closely approximated by parametric expressions and could be made essentially equivalent (using conditional expressions and the rand function).
  * BSpline paths - feasible, though.
  * The '{(0)' module does not start a polygon, but a piecewise path. Polygons must use the unparameterized '{' module.
  * The '}' and @Ge modules now take a second parameter that causes the generated polygon or extrusion to be saved as a mesh/surface. For example ... }('','leaf') ... ~('leaf') ... will construct a 'leaf' mesh and save it.
  * The '\~' module is now parameterized, so the syntax is now '\~(some-identifier)' instead of ~S. Identifiers may be numbers or strings, so \~('leaf') module will insert a saved mesh called 'leaf' at the current turtle location.
  * Setting the variable 'n' will set the derivation length, if it is not set. This allows you to use examples in The Algorithmic Beauty of Plants more easily
   * Environment programs are implemented as JS classes, dynamically imported, not external programs

## Features in the  works:

   * Animations - but see step mode with multiple turtle mode
   * Array specified contours and surfaces
   * L-system surface generation
   * Textures - currently just standard materials

## Changes since last version
    
   * Start, StartEach, EndEach, and End statements - limited by math.js capabilities
   * Support for some Unicode symbols for variable names
   * Homomorphisms
   * Environmental queries of turtle state
   * 'Environmental programs' (see [vlab] docs(https://www.algorithmicbotany.org/virtual_laboratory/docs/)
   * Array and JS object support

----- Previous versions ------------

   * Homomorphisms and decomposition 9/6/24
   * Switched to using Webpack to build and debug, much nicer.
   * Switched to using Svelte and Bootstrap: much easier implementing new UI features
   * New layout using svelte-splitpanes and bootstrap menu bars and icons
   * Added all my test/example files to front end to learn and browse
   * Fixed many broken features - see shell-2.ls, for one
   * Added better model save feature, including choice to use clones instead of instances.
   * Ability to save some settings, like auto-load and build of demo system
   * Added 1x1 grids to XY, YZ, and XZ planes to check size of finished models
   * Changed contour module from @D to @C - and may have missed converting some examples
     
