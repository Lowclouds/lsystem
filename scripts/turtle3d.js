class Turtle3d {
   constructor (scene=null,noturtle=false,shape=null) {
      this.TurtleState = {
	 Turtle: `_t3d${Turtle3d.prototype.t3dIDTag++}`,
	 P: new BABYLON.Vector3.Zero(),
	 H: new BABYLON.Vector3(1,0,0),
	 L: new BABYLON.Vector3(0,0,1), 
	 U: new BABYLON.Vector3(0,1,0), // up is the yaxis in BABYLON
	 PenIsDown: true,
	 IsShown: true,
         TrackMaterial: null,
	 Color: '0,0,0',
	 Size: 0.25,
	 Shape: null,
	 Track: 'cylinder',
	 TrackMesh: null
      }
      Scene: null;
      Tmesh: null;
      CurrentMesh: null;
      initDone: initAll.call(this, scene,noturtle,shape);

      function initAll(s, nt, shape) {
	 this.TurtleState.Shape = getshape.call(this, noturtle, shape);
	 this.Scene = getscene.call(this, scene);
         this.TrackMaterial = new BABYLON.StandardMaterial("trackMat", scene),
         let c = new BABYLON.Color3();
         c.fromArray(Array.from(this.Color.split(','), x=> Number(x)));
         this.TrackMaterial.diffuseColor = c;
	 if (Turtle3d.Turtles == null) {Turtle3d.Turtles  = new Map();}
	 Turtle3d.Turtles.set(this.TurtleState.Turtle, this);
	 return true;
      }

      function getshape(noturtle, shape) {
	 if (noturtle) {
	    return '';
	 } else if (shape != null) {
	    return shape;
	 } else {
	    return maketurtle.call(this, this.TurtleState.Turtle);
	 }
      }

      function getscene(scene) {
	 if (scene == null) {
	    if (Turtle3d.t3dScene == null) {
	       throw "Can't create a turtle without a scene"
	    } else {
	       return Turtle3d.t3dScene;
	    }
	 } else {
	    if (Turtle3d.t3dScene == null) {
	       Turtle3d.t3dScene = scene;
	    }
	    return scene
	 }
      }

      function maketurtle (tag) {
	 let scene = this.Scene;
	 var local_origin = BABYLON.MeshBuilder.CreateBox("local_origin",{size: 0.25},scene);
	 BABYLON.Tags.AddTagsTo(local_origin, `${tag} local_origin`); 
	 let pts = [ newV(0,0,0), newV(1, 0, 0) ];
	 let axis;
	 let xaxis = BABYLON.MeshBuilder.CreateLines('xaxis', {points: pts}, scene);
	 BABYLON.Tags.AddTagsTo(xaxis, `${tag} H heading`); 
	 xaxis.color = BABYLON.Color3.Red();
	 xaxis.parent = local_origin;
	 pts[1] = newV(0, 1, 0);
	 axis = BABYLON.MeshBuilder.CreateLines('yaxis',{points: pts}, scene);
	 axis.parent = local_origin;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} L binormal`); 
	 axis.color = BABYLON.Color3.Green();
	 pts[1] = newV(0, 0, 1);
	 axis = BABYLON.MeshBuilder.CreateLines('zaxis',{points: pts}, scene);
	 axis.parent = local_origin;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} U normal`); 
	 axis.color = BABYLON.Color3.Blue();

	 return local_origin;
      }
   } // end constructor

   // a destructor sort of. primarily keeps the global list of turtles up to date
   dispose () {
      this.clear();
      Turtle3d.Turtles.delete(this.TurtleState.Turtle);
      // make this turtle useless
      if (this.TurtleState.Shape != null) { this.TurtleState.Shape.dispose(true, true);}
      if (this.TurtleState.TrackMesh != null) { this.TurtleState.TrackMesh.dispose(true, true);}
      delete this.TurtleState.P;
      delete this.TurtleState.H;
      delete this.TurtleState.L;
      delete this.TurtleState.U;
   }
   // getters and setters
   getPos() { return this.TurtleState.P;}
   getH() { return this.TurtleState.H;}
   getL() { return this.TurtleState.L;}
   getU() { return this.TurtleState.U;}
   getColor() { return this.TurtleState.Color;}
   getSize() { return this.TurtleState.Size;}
   getShape() { return this.TurtleState.Shape;}
   getTrack() { return this.TurtleState.Track;}
   getTurtle() {return this.TurtleState.Turtle;}
   getScene() {return this.Scene;}
   getOrientation() {
      return [this.TurtleState.H, this.TurtleState.L, this.TurtleState.U]; 
   }
   isPenDown() {return this.TurtleState.PenIsDown;}
   isPenUp() {return ! this.TurtleState.PenIsDown;}
   isShown() {return this.TurtleState.IsShown;}

   // setters
   setColor(v) {
      switch (betterTypeOf(v)) {
      case 'string': {
	 let c;
	 switch  (v.toLowerCase()) {
	 case 'blue': {c = BABYLON.Color3.Blue().join(); break;}
	 case 'gray': {c = BABYLON.Color3.Gray().join(); break;}
	 case 'green': {c = BABYLON.Color3.Green().join(); break;}
	 case 'magenta': {c = BABYLON.Color3.Magenta().join(); break;}
	 case 'purple': {c = BABYLON.Color3.Purple().join(); break;}
	 case 'red': {c = BABYLON.Color3.Red().join(); break;}
	 case 'teal': {c = BABYLON.Color3.Teal().join(); break;}
	 case 'white': {c = BABYLON.Color3.White().join(); break;}
	 case 'yellow': {c = BABYLON.Color3.Yellow().join(); break;}
	 case 'black':{c = BABYLON.Color3.Black().join(); break;}
	 default: {
            c = v.split(',');
            if (c.length == 3 && 
                c.every(n => Number(n) != NaN && 
                        Number(n) < 256 && 
                        Number(n) >= 0)) {
               c=v;
            } else {
               puts(`unrecognized color: ${v}, defaulting to black`);
               c = '0,0,0';
            }
	 }
         }
	 this.TurtleState.Color = c;
      }
	 break;
      case 'array': {
	 this.TurtleState.Color = v.join();
      }
	 break;
      case 'object': { 	// assume it's a color3 object
	 this.TurtleState.Color = v.asArray().join();}
      }
      puts(`set color to ${this.TurtleState.Color}`);
   }
   setSize(v) {this.TurtleState.Size = v;}
   setTrack(v) {
      switch (v) {
      case 'line':
      case 'cyl': { this.TurtleState.Track = v; return true;}
      default: {
	 console.log(`Track type of ${v} not supported`);
	 this.TurtleState.Track = 'line';
	 return false;
      }
      } 
   }
   getState () {
      let s = Object.assign({}, this.TurtleState);
      s.P = s.P.clone();
      s.H = s.H.clone();
      s.L = s.L.clone();
      s.U = s.U.clone();
      if (s.TrackMesh != null) { s.TrackMesh = s.TrackMesh.clone();}
      return s;
   }

   setState (savedstate) {
      Object.assign(this.TurtleState, savedstate);
      let s = this.getShape();
      if (s != '') {
	 s.position = this.getPos();
	 let meshes = this.Scene.getMeshesByTags(this.TurtleState.Turtle);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = this.isShown;
	    this.orientTurtle();
	 }
      }
   }

   // some internal setter functions that I'd like to hide
   setPos (val) {
      if (betterTypeOf(val) == 'array'){
	 this.TurtleState.P.fromArray(val);
      } else {			// assume it's a Vector3
	 this.TurtleState.P = val.clone(); // in case it's a local
      }
   }
   setH (val) {
      if (betterTypeOf(val) == 'array'){
	 this.TurtleState.H.fromArray(val);
      } else {			// assume it's a Vector3
	 this.TurtleState.H = val.clone(); // in case it's a local
      }
   }
   setL (val) {
      if (betterTypeOf(val) == 'array'){
	 this.TurtleState.L.fromArray(val);
      } else {			// assume it's a Vector3
	 this.TurtleState.L = val.clone(); // in case it's a local
      }
   }

   setU (val) {
      if (betterTypeOf(val) == 'array'){
	 this.TurtleState.U.fromArray(val);
      } else {			// assume it's a Vector3
	 this.TurtleState.U = val.clone(); // in case it's a local
      }
   }
   //
   orientTurtle () {
      let shape = this.getShape();
      if (shape != "") {
	 shape.rotation = 
	    BABYLON.Vector3.RotationFromAxis(this.TurtleState.H,
					     this.TurtleState.U,
					     this.TurtleState.L);
      }
   }

   setTurtle(val) {this.TurtleState.Turtle = val;}

   penUp() {this.TurtleState.PenIsDown = false;}
   penDown() {this.TurtleState.PenIsDown = true;}

   hide () {
      let t = this.TurtleState.Turtle;
      if (t && this.TurtleState.IsShown) {
	 let meshes = this.Scene.getMeshesByTags(t);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = false;
	 }
      }
      this.TurtleState.IsShown = false;
   }
   show () {
      let t = this.TurtleState.Turtle;
      if (t && ! this.TurtleState.IsShown) {
	 let meshes = this.Scene.getMeshesByTags(t);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = true;
	 }
      }
      this.TurtleState.IsShown = true;
   }

   clear() {
      let tracks =this.Scene.getMeshesByTags('track'+this.TurtleState.Turtle);
      for (var index = 0; index < tracks.length; index++) {
	 tracks[index].dispose();
      }
   }

   draw(oldPos, newPos) {
      let t = this.TurtleState.Turtle;
      let s = this.TurtleState.Shape;
      let type = this.TurtleState.Track;
      if (this.isPenDown()) {
	 let segment;
	 if (type == 'line') {
	    segment = BABYLON.MeshBuilder.CreateLines('tpath',
                                                      {points: [oldPos, newPos],
                                                       tessellation: 32}, scene);
	    segment.color = this.TurtleState.Color;
	    BABYLON.Tags.AddTagsTo(segment, `track${t}`, scene);
	    segment.isVisible = true;


         } else if (type == 'cylinder') {
            
            segment = BABYLON.MeshBuilder.CreateTube(t, 
                                                     {path: [oldPos, newPos], 
                                                      radius: this.TurtleState.Size,
                                                      updatable: true,
                                                      cap: BABYLON.Mesh.CAP_ALL},
                                                     scene);
	    segment.isVisible = true;
            if (this.trackMaterial != NULL) {
               segment.material == this.trackMaterial;
            }
            if (this.Tmesh == null) {
               this.Tmesh = segment;
	       BABYLON.Tags.AddTagsTo(this.Tmesh, `track${t}`, scene);
            } else {
	       BABYLON.Tags.AddTagsTo(segment, `track${t}`, scene);
               //                 this.Tmesh = BABYLON.Mesh.MergeMeshes([this.Tmesh, segment],true, true);
            }
	 }
      }
      if (s) {s.position = newPos;}
   }

   home () {
      let shape = this.TurtleState.Shape;
      let oldstate = this.TurtleState;
      let newPos = newV(0, 0, 0);
      if (shape != "") {        
    	 shape.position = newPos;
      }

      this.setPos(newPos);
      this.setH(newV(1, 0, 0));
      this.setU(newV(0, 1, 0));
      this.setL(newV(0, 0, 1));
      if (shape != "") {        
    	 shape.position = newPos;
	 this.orientTurtle();
      }
   }

   forward ( dist) {
      let pos  = this.TurtleState.P;
      let oldP = pos.clone(); 
      let newP = pos.clone();
      let tH = this.TurtleState.H;

      tH.scaleAndAddToRef(dist, newP);

      this.TurtleState.P.copyFrom(newP);
      this.draw(oldP, newP);
   }

   back (dist) {return this.forward(-1*dist);}

   setHeading (v) {
      if (betterTypeOf(v) == 'array') {
	 v = BABYLON.Vector3.FromArray(v);
      }
      v.normalize();
      let H = this.getH();
      //let angle = acosd( dot(H,v));
      let p1 = v.cross(H) // y-axis
      if (p1.length() < 1.0e-10) {
         return;		// p1 is nearly parallel to H
      }
      p1.normalize();
      let p2 = v.cross(p1).normalize(); // z-axis
      // puts(`v: ${v}; perp1: ${p1}; perp2: ${p2}`);
      this.setH(v);
      this.setL(p2);
      this.setU(p1);

      this.orientTurtle();
   }

   setUp (up) {
      if (betterTypeOf(up) == 'array') {
	 up = BABYLON.Vector3.FromArray(up);
      }
      up.normalize();
      let H = this.getH();
      //let angle = -1*acosd(dot(z, h));
      let p1 = H.cross(up);
      if (p1.length() < 1.0e-10) {
         return	;	// parallel
      }
      p1.normalize();	
      let p2 = p1.cross(H);	// the new up
      // H doesn't change
      this.setL(p1); //rigidrotation(this.getL(), v, angle));
      this.setU(p2); //rigidrotation(z, v, angle));
      this.orientTurtle();
   }    

   // roll, pitch, and yaw
   roll (angle) {
      let L = this.TurtleState.L;
      let U = this.TurtleState.U;
      this.TurtleState.L = rotateTG(L, smult(-1,U), angle);
      this.TurtleState.U = rotateTG(U, L, angle);
      this.orientTurtle();
   }
   pitch (angle) {
      let H = this.TurtleState.H;
      let U = this.TurtleState.U;
      this.TurtleState.H = rotateTG(H, U, angle);
      this.TurtleState.U = rotateTG(U, smult(-1, H), angle);
      this.orientTurtle();
   }
   yaw (angle) {
      angle = -1*angle;
      let H = this.TurtleState.H;
      let L = this.TurtleState.L;
      this.TurtleState.H = rotateTG(H, smult(-1, L), angle);
      this.TurtleState.L = rotateTG(L, H, angle);
      this.orientTurtle();
   }
   goto (pos) {
      if (betterTypeOf(pos) == 'array') {
	 pos = BABYLON.Vector3.FromArray(pos);
      }
      let oldP = this.TurtleState.P.clone();
      this.setPos(pos);
      //console.log(`oldP=${oldP}, newP=${this.TurtleState.P}`);
      this.draw(oldP, pos);
   }

}

Turtle3d.prototype.t3dIDTag=0;    //  a counter for constructing unique tags
Turtle3d.prototype.t3dScene=null;	// ea default scene, once set
Turtle3d.prototype.fd = Turtle3d.prototype.forward;
Turtle3d.prototype.Turtles = null;

    // some helper functions
function puts(o) {console.log(o);}
function betterTypeOf (o) {
    return Object.prototype.toString.call(o).slice(8,-1).toLowerCase(); 
}

const radtodeg = 180/Math.PI;
const degtorad = Math.PI/180;
const eps = Number.EPSILON;
function cosd(deg) {return Math.cos(degtorad*deg);}
function sind(deg) {return Math.sin(degtorad*deg);}
function acosd (v) { return radtodeg * Math.acos(v);}
function asind (v) { return radtodeg * Math.asin(v); }
function smult (s, v) {return v.scale(s);} // v is a BABYLON.Vector3

// create a new BABYLON.Vector3;
function newV(x=0,y=0,z=0) {return new BABYLON.Vector3(x,y,z);}
// add two or threeo BABYLON.Vector3;
function vadd (u, v, w=null ) {
    let r = u.add(v);
    if (w != null) { r.addInPlace(w);}
    return r;
}
function vmax(v){ return Math.max(v.x, v.y, v.z); }
function clamp (v, epsilon = eps) {
    let va = [];
    v.toArray(va);
    va.forEach((e,ndx) => {
	if (Math.abs(e) < epsilon) {va[ndx]=0;}})
    //{ if {abs($e) < $epsilon} {set e 0}; lappend vc $e}
    return v.fromArray(va);
}

function dot (v, w) { 
    let d = BABYLON.Vector3.Dot(v,w);
    return ((d <= eps) ? 0 : d);
}
function crossproductB (v, w, lhand=true) {
    if (true) {
	return BABYLON.Vector3.Cross(v,w);
    } else {
	return smult(-1, BABYLON.Vector3.Cross(v,w));
    }
}
//rotate per Turtle Geometry
function rotateTG (vec, perpvec, angle) {
    return vadd( smult(cosd(angle), vec), smult(sind(angle), perpvec));
}

// rotate x theta degrees around v
function rigidrotation (x, v, theta) {
    let ctheta = cosd(theta);
    let stheta = sind(theta);
    let vcx = crossproduct(v, x).normalize();
    return clamp( vadd(smult((dot(x, v) * (1-ctheta)), v),
     		       smult( ctheta, x), smult(stheta, vcx)));
}

function crossproduct (v, w) {
    if (betterTypeOf(v) == 'array') {
	v = BABYLON.Vector3.FromArray(v);
    }
    if (betterTypeOf(w) == 'array') {
	w = BABYLON.Vector3.FromArray(w);
    }
    let res = [];
    // rh 
    res[0] = v.y*w.z - v.z*w.y;
    res[1] = v.z*w.x - v.x*w.z;
    res[2] = v.x*w.y - v.y*w.x;
    // lh 
    // res[0] = v.y*w.z - v.z*w.y;
    // res[1] = v.z*w.x - v.x*w.z;
    // res[2] =  v.y*w.x - v.x*w.y 
    return new BABYLON.Vector3.FromArray(res);
}
