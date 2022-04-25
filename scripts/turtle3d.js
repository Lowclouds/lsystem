// 
// provide a 3d turtle with extensions to support lsystem interpretation
// 

class Turtle3d {
   'use strict';

   about() {puts('hello');}

   static Turtles   = new Map(); // set of turtles
   static basename  = '_t3d';   // tid = basename+counter
   static counter   = 0;       //  a counter for constructing unique tags
   static t3dScene  = null;    //  default scene, once set
   static getFirstTurtle(id=null) {
      let t;
      if (Turtle3d.Turtles.size == 0) {
         t = new Turtle3d(Turtle3d.t3dScene);
      } else if (id == null ) {
         let mi = Turtle3d.Turtles.keys();
         t = mi.next.value();
      } else {
         t = Turtle3d.Turtles.get(id);
         if (t == null) {
            throw `Can't find turtle with id: ${id} (possibly deleted)`;
         }
      }
      return t;
   };

   constructor (scene=null, noturtle = false, shape = null ) {
      this.TurtleState = {
	 Turtle: `${Turtle3d.basename}${Turtle3d.counter++}`,
	 P: new BABYLON.Vector3.Zero(),
	 H: new BABYLON.Vector3(1,0,0),
	 L: new BABYLON.Vector3(0,0,1), 
	 U: new BABYLON.Vector3(0,1,0), // up is the yaxis in BABYLON
	 penIsDown: true,
	 isShown: true,
	 color: '0,0,0',
	 size: 0.1,
         lastSize: 0.1,
	 turtleShape: null,
         drawMode: Turtle3d.DRAW_IMMEDIATE, 
	 trackType: Turtle3d.TRACK_TUBE, // line is really slow
         trackPath: null,
         trackShapeID: 'default',
         trackShape: null,
	 trackMesh: null,
         trackTag: '',          // additional tag
         trackMaterial: 0,      // index into material list
         accumRoll: 0,
      }

      this.materialList = [];
      this.trackPaths = [];
      this.trackContours = new Map(); // for trackShapes, default to circle, radius size
      this.meshes = new Map();        // no defaults
      this.branchStack = [];    // stack of turtle state created when lsystem branches
      this.polygonStack = [];   // misnomer based on TABOP usage
      this.polygonVerts = [];   // misnomer: this is an array of facet vertices, in order
      this.tempContour = null;
      this.scene = null;
      this.initDone = initAll.call(this, scene, noturtle, shape);

      // instrumentation
      this.meshCount = [0,0];
      this.meshList = [];

      function initAll(s, nt, shape) {
         this.scene = getScene.call(this, s);
	 this.TurtleState.turtleShape = turtleShape.call(this, nt, shape);
         this.materialList.push(new BABYLON.StandardMaterial("trackMat", scene));
         this.materialList[0].diffuseColor = this.toColorVector();
         this.materialList[0].ambientColor = this.toColorVector();
         this.trackContours.set('default', generateCircle(this.size));
         this.TurtleState.trackShape = this.trackContours.get('default');
	 Turtle3d.Turtles.set(this.TurtleState.Turtle, this);
	 return true;
      }

      function turtleShape(noturtle, shape) {
         let tag = this.TurtleState.Turtle;
         let turtle=''
	 if (noturtle) {
	    return turtle;
	 } else if (shape != null) {
	    turtle = shape;
	 } else {
	    turtle = maketurtle.call(this, tag);
	 }
	 BABYLON.Tags.AddTagsTo(turtle, `${tag} turtle`); 
         return turtle;
      }

      function getScene(scene) {
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
	 let scene = this.scene;
	 var tMesh = BABYLON.MeshBuilder.CreateSphere("turtle",
                                                      {diameterX: 0.25,
                                                       diameterY: 0.125, 
                                                       diameterZ: 0.25, 
                                                       slice: 0.5, 
                                                       sideOrientation: BABYLON.Mesh.DOUBLESIDE},
                                                      scene);
         let mat =  new BABYLON.StandardMaterial("tMat", scene);
         mat.diffuseColor = new BABYLON.Color3(0.1,0.9,0.2);
         mat.ambientColor = new BABYLON.Color3(0.1,0.8,0.2);
         
         tMesh.material = mat;
	 let pts = [ newV(0,0,0), newV(0.5, 0, 0) ];
	 let axis = BABYLON.MeshBuilder.CreateTube('axis', {path: pts, radius: 0.05, cap: BABYLON.Mesh.CAP_END}, scene);
         mat =  new BABYLON.StandardMaterial("tMat", scene);
         mat.diffuseColor = new BABYLON.Color3(1,0,0);
         mat.ambientColor = new BABYLON.Color3(1,0,0);
         axis.material = mat;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} H heading`); 
	 //axis.color = BABYLON.Color3.Red();
	 axis.parent = tMesh;

	 pts[1] = newV(0, 0.5, 0);
         axis = BABYLON.MeshBuilder.CreateTube('axis', {path: pts, radius: 0.05, cap: BABYLON.Mesh.CAP_END}, scene);
         mat =  new BABYLON.StandardMaterial("tMat", scene);
         mat.diffuseColor = new BABYLON.Color3(0,1,0);
         mat.ambientColor = new BABYLON.Color3(0,1,0);
         axis.material = mat;	
	 axis.parent = tMesh;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} L binormal`); 

	 pts[1] = newV(0, 0, 0.5);
         axis = BABYLON.MeshBuilder.CreateTube('axis', {path: pts, radius: 0.05, cap: BABYLON.Mesh.CAP_END}, scene);
         mat =  new BABYLON.StandardMaterial("tMat", scene);
         mat.diffuseColor = new BABYLON.Color3(0,0,1);
         mat.ambientColor = new BABYLON.Color3(0,0,1);
         axis.material = mat;	
	 axis.parent = tMesh;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} U normal`); 

	 return tMesh;
      }
   } // end constructor

   // a destructor sort of. primarily keeps the global list of turtles up to date
   dispose () {
      this.clear();
      Turtle3d.Turtles.delete(this.TurtleState.Turtle);
      // make this turtle useless
      if (this.TurtleState.turtleShape != null) { this.TurtleState.turtleShape.dispose(true, true);}
      if (this.TurtleState.trackMesh != null) { this.TurtleState.trackMesh.dispose(true, true);}
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
   getColor() { return this.TurtleState.color;}
   getSize() { return this.TurtleState.size;}
   getTurtleShape() { return this.TurtleState.turtleShape;} // a mesh
   getTrackShapeID() {return this.TurtleState.trackShapeID;} // number or string
   getTrackShape() {return this.TurtleState.trackShape;} // array of Vector3
   getTrack() { return this.TurtleState.trackType;}
   getTurtle() {return this.TurtleState.Turtle;}
   getScene() {return this.scene;}
   getOrientation() {
      return [this.TurtleState.H, this.TurtleState.L, this.TurtleState.U]; 
   }
   isPenDown() {return this.TurtleState.penIsDown;}
   isPenUp() {return ! this.TurtleState.penIsDown;}
   isShown() {return this.TurtleState.isShown;}

   // setters

   // setColor has no concept of a color/material table, it just sets the current color
   setColor(diffuse, specular=null, emissive=null, ambient=null, alpha=1) {
      this.TurtleState.color = normalizeColor(diffuse);

      const cidx = this.TurtleState.trackMaterial;
      this.materialList[cidx].diffuseColor = this.toColorVector();

      //puts(`set color to ${this.TurtleState.color}`);
      return this;
   }

   // setMaterial sets the current color/material index into the table
   // the index is modulo the table length, so there is never a failure or 
   // notice that it is out of bounds
   setMaterial(i) {
      i = i < 0 ? this.materialList.length-1 : i % this.materialList.length;
      this.TurtleState.trackMaterial = i;
      this.TurtleState.color = normalizeColor(this.materialList[i].diffuseColor);
      return this;
   }

   addMaterial(m=null, color=null) {
      if (m == null) {
         if (this.materialList[this.TurtleState.trackMaterial] == null) {
            m = new BABYLON.StandardMaterial("trackMat", scene);
            this.TurtleState.trackMaterial = 0;
            this.TurtleState.color = normalizeColor('green');
         } else {
            m = this.materialList[this.TurtleState.trackMaterial].clone();
         }
      } 
      if (color != null) {
         color = normalizeColor(color);
      } else {
         color = this.TurtleState.color;
      }
      m.diffuseColor = this.toColorVector(color);
      this.materialList.push(m);
   }
   // get the material index
   getMaterialIdx() {
      return this.TurtleState.trackMaterial; // return the current material index
   }
   getMaterial(i) {
      return this.materialList[i % this.materialList.length]; // return the material
   }
   deleteMaterials() {
      this.materialList = [];
      this.TurtleState.trackMaterial = null;
      this.TurtleState.color = null;
   }
   // where dt, et al. are images
   setTexture(dt, st=null, et=null, at=null, hasAlpha=false) {
      
   }

   toColorVector(cv = this.TurtleState.color) {
      let c = new BABYLON.Color3();
      return c.fromArray(Array.from(cv.split(','), x=> Number(x)));
   }

   setSize(v, initial=false) {
      if (initial) {
         this.TurtleState.lastSize = v;
      } else { // to support tapered stems
         this.TurtleState.lastSize = this.TurtleState.size;
      }
      this.TurtleState.size = v;
      puts(`setSize: new size == ${v}`);
      return this;
   }

   setTrack(v, id=null) {
      switch (v) {
      case 'line':
         this.TurtleState.trackType = Turtle3d.TRACK_LINE;
         break;
      case 'tube': 
         this.TurtleState.trackType = Turtle3d.TRACK_TUBE;
         break;
      case 'cyl':
      case 'cylinder':
      case 'extrusion':
      case 'ext':
         this.TurtleState.trackType = Turtle3d.TRACK_EXT;
         if (id === null) {
            this.TurtleState.trackShapeID = 'default';
         } else {
            this.TurtleState.trackShapeID = id;
         }
         this.TurtleState.trackShape = this.trackContours.get(this.TurtleState.trackShapeID);
         break;
      default: {
	 console.log(`track type of ${v} not supported`);
	 this.TurtleState.trackType = Turtle3d.TRACK_TUBE;
	 return null;
      }
      } 
      return this;
   }
   getState () {
      let s = Object.assign({}, this.TurtleState);
      s.P = s.P.clone();
      s.H = s.H.clone();
      s.L = s.L.clone();
      s.U = s.U.clone();
      if (s.trackMesh != null) { s.trackMesh = s.trackMesh.clone();}
      if (s.trackPath != null) { s.trackPath = s.trackPath.clone();}
      return s;
   }

   setState (savedstate) {
      let ts = this.TurtleState;
      Object.assign(ts, savedstate);
      ts.P = savedstate.P.clone();  // the user may expect to re-use the saved state
      ts.H = savedstate.H.clone();
      ts.L = savedstate.L.clone();
      ts.U = savedstate.U.clone();
      ts.trackShape = this.trackContours.get(ts.trackShapeID);
      if (savedstate.trackMesh != null) { ts.trackMesh = savedstate.trackMesh;}
      if (savedstate.trackPath != null) { ts.trackPath = savedstate.trackPath;}

      const cidx = ts.trackMaterial;
      this.materialList[cidx].diffuseColor = this.toColorVector();

      let s = this.getTurtleShape();
      if (s != '') {
	 s.position = this.getPos();
	 let meshes = this.scene.getMeshesByTags(ts.Turtle);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = ts.isShown;
	 }
	 this.orientTurtle();
      }
   }

   // some internal setter functions that I'd like to hide
   setPos (val) {
      try {
         if (betterTypeOf(val) == 'array'){
	    this.TurtleState.P.fromArray(val);
         } else {			// assume it's a Vector3
	    this.TurtleState.P = val.clone(); // in case it's a local
         }
      } catch (error) {
         puts(`${error}, calling setPos(${val})`);
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
   // orient turtle so we can see what the orientation looks like
   // not required for actual functioning
   orientTurtle () {
      let shape = this.getTurtleShape();
      if (shape != "") {
	 shape.rotation = 
	    BABYLON.Vector3.RotationFromAxis(this.TurtleState.H,
					     this.TurtleState.U,
					     this.TurtleState.L);
      }
   }

   // ------------- back to external functions ----------

   // you can set your own shape - untested
   // this uses your shape, as is
   setTurtleShape(val) {
      this.TurtleState.turtleShape = val; // a mesh
      return this;
   }

   setTrackShape (id)  {
      puts(`set track shape to: ${id}, size == ${this.getSize()}`);
      let c = this.trackContours.get(id);
      if (c) {
         this.TurtleState.trackShapeID = id;
         this.TurtleState.trackShape = c;
         if (this.TurtleState.trackPath != null) {
            this.TurtleState.trackPath.shape = c
         }
         this.TurtleState.trackType=Turtle3d.TRACK_EXT;
      } else {
         puts(`Contour ${id} not found`);
      }
      puts(`set track shape to: ${id}, size == ${this.getSize()}`);
      return this;
   }
   /**
    * addTrackShape add a shape to the contours map
    * @param id  - name/identifier of contour in contour map
    * @param val - array of pts where z value is zero, pt == 3d array
    *              we convert pts to BABYLON Vector3s, insuring z=0
    */
   addTrackShape(id, val,as_vectors=false) {
      if (val.length >= 2) {
         let pts;
         if (as_vectors) {
            pts = val;
         } else {
            pts = [];
            val.forEach((e) => {pts.push(newV(e[0],e[1]));});
         }  
         this.trackContours.set(id, pts);
      } else {
         puts(`contour: ${id} not added, not enough points.`);
      }
   }

   setTag(val) {this.TurtleState.trackTag = val;}

   penUp() {
      this.TurtleState.penIsDown = false;
      return this;
   }
   penDown() {
      this.TurtleState.penIsDown = true;
      return this;
   }

   hide () {
      let t = this.TurtleState.Turtle;
      if (t && this.TurtleState.isShown) {
	 let meshes = this.scene.getMeshesByTags(t);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = false;
	 }
      }
      this.TurtleState.isShown = false;
      return this;
   }
   show () {
      let t = this.TurtleState.Turtle;
      if (t && ! this.TurtleState.isShown) {
	 let meshes = this.scene.getMeshesByTags(t);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = true;
	 }
      }
      this.TurtleState.isShown = true;
      return this;
   }

   clear() {
      let tracks =this.scene.getMeshesByTags('track'+this.getTurtle());
      for (var index = 0; index < tracks.length; index++) {
	 tracks[index].dispose();
      }
      this.trackPaths = [];
      this.meshCount = [0,0];
      this.meshList = [];
      return this;
   }


   // newMesh() {
   //    if (this.TurtleState.trackMesh != null) {
   //       //this.meshList.push(this.TurtleState.trackMesh);
   //       this.TurtleState.trackMesh = null;
   //    }
   // }

   home () {
      let tshape = this.TurtleState.turtleShape;
      let newPos = newV(0, 0, 0);

      this.setPos(newPos);
      this.setH(newV(1, 0, 0));
      this.setU(newV(0, 1, 0));
      this.setL(newV(0, 0, 1));
      if (tshape != "") {        
    	 tshape.position = newPos;
	 this.orientTurtle();
      }
      return this;
   }

   reset (all=false)  {
      this.clear();
      this.home();
      let ts = this.TurtleState;
      ts.drawMode = Turtle3d.DRAW_IMMEDIATE;
      ts.trackType = Turtle3d.TRACK_TUBE;
      ts.trackPath = null;
      if (all) {
         ts.penIsDown = true;
         ts.isShown = true;
         ts.size = 0.1;
         ts.lastSize = ts.size;
         ts.trackShapeID = 'default';
         ts.trackShape = this.trackContours.get('default');
         ts.trackMaterial = 0;
         ts.color = '0,0,0';
         ts.accumRoll = 0;

         this.branchStack=[];
         this.polygonStack=[];
         this.polygonVerts=[];
         this.tempContour = null;
      }
      return this;
   }

   // to support the G/g modules in TABOP
   // we add the addpathpt param to turn off
   // point capture
   forward (dist, addpathpt = true) {
      let pos  = this.TurtleState.P;
      let oldP = pos.clone(); 
      let newP = pos.clone();
      let tH = this.TurtleState.H;

      tH.scaleAndAddToRef(dist, newP);

      this.TurtleState.P.copyFrom(newP);
      this.draw(oldP, newP);
      if (addpathpt) {
         switch ( this.TurtleState.drawMode ) {
         case Turtle3d.CAPTURE_PATH:
            this.addPathPt(this.TurtleState, newP);
            break;
         case Turtle3d.CAPTURE_POLYGON:
            this.updatePolygon(newP);
            break;
         case Turtle3d.CAPTURE_CONTOUR:
            this.updateContour(newP);
            break;
         }
      }
      return this;
   }

   back (dist) {
      return this.forward(-1*dist);
   }
   
   // goto never captures a point on it's own
   goto (a1,a2,a3) {
      let pos;
      if (a1 != undefined && a2 != undefined && a3 != undefined) {
         pos = new BABYLON.Vector3(a1,a2,a3);
      } else if (betterTypeOf(a1) == 'array') {
	 pos = BABYLON.Vector3.FromArray(a1);
      } else { //assume a1 is a vector
         pos = a1;
      }

      let oldP = this.TurtleState.P.clone();
      this.setPos(pos);
      //console.log(`oldP=${oldP}, newP=${this.TurtleState.P}`);
      this.draw(oldP, pos);
      return this;
   }

   // set heading, i.e. H, parallel to vector (a1,a2,a3),
   //  or if a1 is an array then treat that as the vector,
   //  else if a1 is a vector, use that
   // adjust L and U to follow, so that in the canonical case,
   // H == [1,0,0] -> [0,1,0], it looks like a simple pitch, 
   // i.e. a rotation about L
   // If you care about L and U after setting H, you should call 
   // setUp after setheading
   setHeading (a1,a2,a3) {
      let v;
      if (a1 != undefined && a2 != undefined && a3 != undefined) {
         v = new BABYLON.Vector3(a1,a2,a3);
      } else if (betterTypeOf(a1) == 'array') {
	 v = BABYLON.Vector3.FromArray(a1);
      } else { //assume a1 is a vector
         v=a1;
      }
      v.normalize();
      let H = this.getH();
      let p1 = v.cross(H).scale(-1); // left axis
      if (p1.length() < 1.0e-10) {
         return;		// v is nearly parallel to H
      }
      p1.normalize();
      let p2 = v.cross(p1).normalize().scale(-1); // up axis
      // puts(`v: ${v}; perp1: ${p1}; perp2: ${p2}`);
      this.setH(v);
      this.setL(p1);
      this.setU(p2);

      this.orientTurtle();
      return this;
   }

   // given a mesh, setHeading towards it
   lookat (mesh) {
      let v = mesh.position.subtract(this.getPos());
      this.setHeading(v.x,v.y,v.z);
      return this;
   }

   // this sets U so it is in the H-up plane, up being the input vector
   // H is unchanged, L follows H and U and
   // the plane of H and U is perpendicular to L
   setUp (a1,a2,a3) {
      let up;
      if (a1 != undefined && a2 != undefined && a3 != undefined) {
         up = new BABYLON.Vector3(a1,a2,a3);
      } else if (betterTypeOf(a1) == 'array') {
	 up = BABYLON.Vector3.FromArray(a1);
      } else { //assume a1 is a vector
         up=a1;
      }
      up.normalize();
      let H = this.getH();
      //let angle = -1*acosd(dot(z, h));
      let p1 = H.cross(up); // p1 is perp to H-up
      if (p1.length() < 1.0e-10) {
         console.warn(`up (${a1}, ${a2}, ${a3}) is parallel to heading, can't set U`);
         return	;	
      }
      p1.normalize();	
      let p2 = p1.cross(H);	// the new up
      // H doesn't change
      this.setL(p1); //rigidrotation(this.getL(), v, angle));
      this.setU(p2); //rigidrotation(z, v, angle));
      this.orientTurtle();
      return this;
   }    
   // a special case of setUp
   // this sets L so it is parallel to xz plane, i.e. level
   // H is unchanged. If H-U are in a plane parallel to the y-axis,
   // then the plane of H and U is vertical, so L must be parallel
   // to the xz plane
   levelL() {
      this.setUp(new BABYLON.Vector3(0,1,0));
      return this;
   }
   // adjust heading according to tropism vector and length of segment
   // TABOP pgs 58-61
   // this is a scaled torque on the heading vector: eHxT, where e is a constant
   // H is the length of the next forward move, and T is a unit tropism vector
   // length of segment defaults to 1
   // applyTropism() {
   // }

   //  yaw, pitch, roll, adjusted for left-handed system
   // yaw: rotate around U, positive angle is from H towards L
   yaw (angle) {
      angle *= -1;              // lh system
      let H = this.TurtleState.H.clone();
      let L = this.TurtleState.L.clone();
      this.TurtleState.H = rotateTG(H, smult(-1, L), angle);
      this.TurtleState.L = rotateTG(L, H, angle);
      this.orientTurtle();
      return this;
   }
   // pitch: rotate around L, positive is U towards H
   pitch (angle) {
      angle *= -1;              // lh system
      let H = this.TurtleState.H.clone();
      let U = this.TurtleState.U.clone();
      this.TurtleState.H = rotateTG(H, U, angle);
      this.TurtleState.U = rotateTG(U, smult(-1, H), angle);
      this.orientTurtle();
      return this;
   }
   // roll: rotate around H, positive is L towards U
   roll (angle) {
      angle *= -1;              // lh system
      let L = this.TurtleState.L.clone();
      let U = this.TurtleState.U.clone();
      this.TurtleState.L = rotateTG(L, smult(-1,U), angle);
      this.TurtleState.U = rotateTG(U, L, angle);
      this.orientTurtle();
      this.TurtleState.accumRoll += angle;
      this.TurtleState.accumRoll %= 360;
      return this;

   }

   rt (angle) {
      return this.yaw(-1*angle);
   }

   draw(oldPos, newPos) {
      let ts = this.TurtleState;
      if (this.isPenDown() && ts.drawMode == Turtle3d.DRAW_IMMEDIATE) {
         this.drawImmediate(ts, oldPos, newPos);
      }
      // update visual turtle position
      let tmesh = ts.turtleShape;
      if (tmesh) {tmesh.position = newPos;}
      ts.lastSize=ts.size;
   }

   drawImmediate(ts, oldPos, newPos) {
      let t = ts.Turtle;
      let ttag = ts.trackTag;
      let type = ts.trackType;
      let tag = `track${t} ${ttag}`;
      let segment;

      switch (type ) {
      case Turtle3d.TRACK_LINE:
	 segment = BABYLON.MeshBuilder.CreateLines('tpath',
                                                   {points: [oldPos, newPos],
                                                    tessellation: 32}, this.scene);
	 segment.color = this.toColorVector();
	 BABYLON.Tags.AddTagsTo(segment, tag , this.scene);
	 segment.isVisible = true;
         break;
      case Turtle3d.TRACK_TUBE:
         let radiusFunc = (i,distance) => {
            return (i == 0) ? ts.lastSize : ts.size;
         }
         segment = BABYLON.MeshBuilder.CreateTube(t, 
                                                  {path: [oldPos, newPos], 
                                                   radiusFunction: radiusFunc,
                                                   // tessellation: 16,
                                                   updatable: true,
                                                   cap: BABYLON.Mesh.CAP_ALL},
                                                  this.scene);
         this.meshCount[0]++;
	 segment.isVisible = true;
         segment.material = this.materialList[ts.trackMaterial];
         BABYLON.Tags.AddTagsTo(segment, tag, this.scene);
         break;
      case Turtle3d.TRACK_EXT:
         let pathpts = [oldPos, newPos];
         let s = ts.size;
         let ls = ts.lastSize;
         function getscale(i,distance) {
            return (i == 0) ? ts.lastSize : ts.size;
         }
         function getrotation(i,distance) {
            return (i==0) ? 0 : ts.accumRoll;
         }
         segment = BABYLON.MeshBuilder.ExtrudeShapeCustom(t, 
                                                                {shape: ts.trackShape, 
                                                                 path: pathpts, 
                                                                 updatable: true, 
                                                                 scaleFunction: getscale, 
                                                                 rotationFunction: getrotation,
                                                                 closePath: false,
                                                                 sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                                                                });
         segment.isVisible=true;
         segment.material = this.materialList[ts.trackMaterial];
         BABYLON.Tags.AddTagsTo(segment, tag, this.scene);
         ts.accumRoll = 0;
         ts.lastSize = ts.size;
         break;
      }
   }

   drawTrack() {
      let ts = this.TurtleState;
      let t = ts.Turtle;
      let tp = ts.trackPath;
      if (tp === null || tp.points.length < 2) {
         return;
      }
      var pathpts = tp.points;
      //puts(`trackPath.length: ${pathpts.length}`);
      //puts(`pathpts: ${pathpts}`);
      var srm = tp.srm;
      //puts(`srm: ${srm}`);

      function getscale(i,distance) {
         return srm[i].s;
      }
      function getrotation(i,distance) {
         return srm[i].r;
      }

      const extrusion = BABYLON.MeshBuilder.ExtrudeShapeCustom(t, 
                                                               {shape: tp.shape, 
                                                                path: pathpts, 
                                                                updatable: true, 
                                                                scaleFunction: getscale, 
                                                                rotationFunction: getrotation,
                                                                closePath: false,
                                                                sideOrientation: BABYLON.Mesh.DOUBLESIDE});
      //
      let matUsed = [];
      let matLocations = [];        // array of [path index, mat index] telling where material used
      let lastMat = null; //srm[1].m;
      for (let i = 1; i< srm.length; i++) {
         let e = srm[i];
         if (! matUsed.includes(e.m)) {
            matUsed.push(e.m);
         }
         if (lastMat != e.m) {
            lastMat = e.m;
            matLocations.push([i,matUsed.indexOf(e.m)]); // associate path index w/ multimaterial index
         }
      };
      //puts(matLocations);
      if (matUsed.length == 1) {
         extrusion.material = this.materialList[matUsed[0]];
      } else {                  // need multiMaterial
         let multimat = new BABYLON.MultiMaterial("mm", this.scene);
         matUsed.forEach((e) => {
            multimat.subMaterials.push(this.materialList[e]);
         });
         const totalVertexCnt = extrusion.getTotalVertices();
         const totalIndices = extrusion.geometry.getTotalIndices();
         const subIndicesPerPoint = Math.floor(totalIndices/(pathpts.length-1)); // a bad, but convenient estimate
         let subVrtxRemainder = totalIndices - (subIndicesPerPoint * (pathpts.length-1));
         // create submeshes w/approximate materials
         let pi;            // path index
         let ppi = 1;           // previous path index
         let matIdx = matLocations[0][1]; // first mat index
         let indexDiff;        // # indices between pi and ppi
         let runningIndexCnt = 0;
        // puts(`totalVertexCnt: ${totalVertexCnt}, total Indices: ${totalIndices}, subIndicesPerPoint: ${subIndicesPerPoint}, remainder:  ${subVrtxRemainder}`);
         let sm;                // submesh index to create;
         for (sm = 1; sm < matLocations.length; sm++) {
            pi = matLocations[sm][0]; // current path index
            indexDiff = (pi -ppi) * subIndicesPerPoint + subVrtxRemainder;
            matIdx = matLocations[sm-1][1];
            // puts(`sm: ${sm}, pi: ${pi}, indexDiff: ${indexDiff}, matIdx: ${matIdx}, runningVcnt: {$runningIndexCnt}`);
            // puts(`SubMesh(${matIdx}, 0, ${totalVertexCnt}, ${runningIndexCnt}, ${indexDiff}, extrusion)`);
            new BABYLON.SubMesh(matIdx, 0, totalVertexCnt, runningIndexCnt, indexDiff, extrusion);
            runningIndexCnt += indexDiff
            subVrtxRemainder = 0; // add all leftover vertices at front.
            ppi = pi;
         }
         pi = pathpts.length-1;
         indexDiff = totalIndices - runningIndexCnt;
         matIdx = matLocations[sm-1][1];
         // puts(`sm: ${sm}, pi: ${pi}, indexDiff: ${indexDiff}, matIdx: ${matIdx}, runningVcnt: ${runningIndexCnt}`);
         // puts(`SubMesh(${matIdx}, 0, ${totalVertexCnt}, ${runningIndexCnt}, ${indexDiff}, extrusion)`);
         new BABYLON.SubMesh(matIdx, 0, totalVertexCnt, runningIndexCnt, indexDiff, extrusion);
         
         extrusion.material = multimat;
      }
      extrusion.id= t + this.trackPaths.length;
      BABYLON.Tags.AddTagsTo(extrusion, `track${t} path`, this.scene);
      this.trackPaths.push(extrusion); // 

      // position the turtle at end of path
      let tmesh = this.TurtleState.turtleShape;
      if (tmesh) {tmesh.position = pathpts[pathpts.length-1];}
   }

   newBranch(udata=null) {
      this.branchStack.push({tstate: this.getState(), userData: udata});
   }
   endBranch() {
      const last = this.branchStack.pop(); //this.branchStack[this.branchStack.length-1];
      this.setState(last.tstate);
      this.TurtleState.trackPath = last.tstate.trackPath;
      return last.userData;
   }

   newTrack(ctype='p0') {
      let ptype;
      switch (ctype) {
      case 'p0':
         ptype = Turtle3d.PATH_POINTS;
         break;
      case 'p1':
         ptype = Turtle3d.PATH_HERMITE_OPEN;
         break;
      case 'p2':
         ptype = Turtle3d.PATH_HERMITE_CLOSED;
         break;
      case 'p3':
         ptype = Turtle3d.PATH_BSPLINE_OPEN;
         break;
      case 'p4':
         ptype = Turtle3d.PATH_BSPLINE_CLOSED;
         console.warn('Hermite and B-spline curves not implemented');
         break;
      default:
         console.error('Undefined track type: ' + ptype);
         return;
      }

      if (this.TurtleState.trackShape == null) {
         this.TurtleState.trackShape = this.trackContours.get(this.TurtleState.trackShapeID);
      }
      let tp = new TrackPath({s: this.TurtleState.trackShape, type: ptype});
      
      this.TurtleState.trackType = Turtle3d.TRACK_EXT;
      this.TurtleState.drawMode = Turtle3d.CAPTURE_PATH;
      this.TurtleState.trackPath = tp;
      this.TurtleState.accumRoll = 0;

      //puts(`trackshape is: ${this.TurtleState.trackShape}`);
      //puts(`tp.shape is: ${tp.shape}`);
   }

   endTrack() {
      let ts = this.TurtleState;
      let tp = ts.trackPath;
      switch (tp.type) {
      case Turtle3d.PATH_POINTS:
         break;
      case Turtle3d.PATH_HERMIT_OPEN:
      case Turtle3d.PATH_HERMIT_CLOSED:  
      case Turtle3d.PATH_BSPLINE_OPEN:
      case Turtle3d.PATH_BSPLINE_CLOSED:
         console.warn('Hermite and B-spline curves not implemented');
         tp.type = Turtle3d.PATH_POINTS;
         break;
      default:
         console.error('Unexpected path type: ' + tp.type);
         break;
      }
      this.drawTrack();
      ts.drawMode = Turtle3d.DRAW_IMMEDIATE; // back to immediate draw
      ts.trackPath = null;
   }

   /** 
    * addPathPt at a point when in path mode
    * ts = TurtleState
    * newPos = position to add
    **/
   addPathPt(ts, newPos) {
      // puts(`addPathPt from ${oldPos} to ${newPos}`);
      // assuming 'extrusion'
      let tp = ts.trackPath;
      if (tp.points.length == 0) { // push first point
         //puts(`added initial path pt: ${oldPos}, size: ${ts.lastSize}`);
         tp.points.push(newPos);
         tp.srm.push({s: ts.lastSize, r: 0, m: 0})
      } else {
         let lastPos = tp.points[tp.points.length-1];
         tp.distance+= BABYLON.Vector3.Distance(newPos, lastPos);
         let roll = ts.accumRoll;
         let lastroll = tp.srm[tp.srm.length - 1].r * radtodeg;
         let rolldiff = roll - lastroll; // total additional roll
         // puts(tp.srm);
         let npts = Math.abs(Math.trunc(roll / tp.maxTwist)); // number of pts
         let rollinc = roll / (npts+1); // divide by # sections
         // puts(`tp.srm.length: ${tp.srm.length}, roll: ${roll}, lastroll: ${lastroll}, rolldiff: ${rolldiff}, rollinc: ${rollinc}, npts: ${npts}`);
         if (npts > 0) {
            // add intermediate points
            let vecdiff = newPos.subtract(lastPos).scaleInPlace(1/(npts+1));
            // insert intermediate points
            let r = rollinc;
            let lpt = lastPos;
            //puts(`adding ${npts} points, with incremental roll of ${rollinc}`);
            let troll=0;
            for (let pti = 0; pti < npts+1; pti++) {
               lpt = lpt.add(vecdiff);
               tp.points.push(lpt);
               tp.srm.push({s: ts.size,
                            r: r * degtorad,
                            m: ts.trackMaterial
                           });
               troll += rollinc;
               // puts(`inserted path pt: ${lpt}, total roll: ${troll}`);
            }
         } else {
            // add new position
            tp.points.push(newPos);
            tp.srm.push({s: ts.size,
                         r: rollinc * degtorad,
                         m: ts.trackMaterial
                        }); 
            // puts(`added path pt: ${newPos}`);
         }
         ts.accumRoll = 0;
      }      
   }

   drawDisc(d = 1, arc = 1, qual = 64, scaling = null) {
      let mesh,p, opts = {};
      opts.radius = d/2;
      opts.tessellation = qual;
      opts.arc = arc;
      opts.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
      opts. frontUVs = new BABYLON.Vector4(0.5,0,1,1);
      opts.backUVs = new BABYLON.Vector4(0,0,0.5,1);

      mesh = BABYLON.MeshBuilder.CreateDisc("disc", opts, this.Scene );

      this.meshCommonSetup(mesh, scaling);
   }

   drawSphere(d=1, arc=1, qual=32, slice=1, scaling=null) {
      let mesh, p, opts = {};
      opts.diameter = d;
      opts.segments = qual;
      opts.arc = arc;
      opts.slice = slice;
      opts.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
      opts. frontUVs = new BABYLON.Vector4(0.5,0,1,1);
      opts.backUVs = new BABYLON.Vector4(0,0,0.5,1);
      opts.updatable = true;

      mesh = BABYLON.MeshBuilder.CreateSphere("sphere", opts, this.Scene );
      
      this.meshCommonSetup(mesh, scaling);
   }

   // drawCapsule(d=1, arc=1, qual=32, slice=1, scaling=null) {
   //    let mesh, p, opts = {};
   //    opts.diameter = d;
   //    opts.segments = qual;
   //    opts.arc = arc;
   //    opts.slice = slice;
   //    opts.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
   //    opts. frontUVs = new BABYLON.Vector4(0.5,0,1,1);
   //    opts.backUVs = new BABYLON.Vector4(0,0,0.5,1);

   //    mesh = BABYLON.MeshBuilder.CreateSphere("sphere", opts, this.scene );
      
   //    this.meshCommonSetup(mesh, scaling);
   // }

   meshCommonSetup (mesh, scaling, rotate=true, pos = null) {
      let ts = this.TurtleState;
      let t = ts.Turtle;
      let ttag = ts.trackTag;
      let tag = `track${t} ${ttag}`;

      mesh.material = this.materialList[ts.trackMaterial];
      

      if (scaling) {
         mesh.scaling.x = scaling.x;
         mesh.scaling.y = scaling.y;
         mesh.scaling.z = scaling.z;
      }

      //mesh.rotation = BABYLON.Vector3.RotationFromAxis(ts.H, ts.L.scale(1), ts.U.scale(-1));
      let p;
      if (pos) {
         p = pos;
      } else {
         p = ts.P;
      }
      mesh.position.x = p.x;
      mesh.position.y = p.y;
      mesh.position.z = p.z;
      // puts(`placed mesh at: ${p}`)
      BABYLON.Tags.AddTagsTo(mesh, tag, this.scene);
   }

   // implements the '{' polygon module
   // this creates a mesh, which could be 3D, but we do a simple polygon
   // triangulation, which assumes the polygon is convex except possibly 
   // at the starting point - so we do a fan triangulation. This also 
   // assumes the vertices are relatively flat, but does not require strict 
   // flatness.
   
   // You could simulate a mesh with bunches of 3-gons, but that would be 
   // pretty inefficient.
   newPolygon() {
      // save state
      this.polygonStack.push({s: this.getState(), a: Array.from(this.polygonVerts)});
      this.polygonVerts = new Array();
      this.TurtleState.drawMode = Turtle3d.CAPTURE_POLYGON;
   }

   // implements the '.' module
   updatePolygon(pos=null) {
      if (this.polygonStack.length > 0) { // i.e. capturing a polygon
         if (pos === null) {
            pos = this.getPos();
         }
         //puts(`adding ${pos} to polygonVerts`);
         this.polygonVerts.push(otoa(pos));
      }
   }

   // implements the '}' module
   endPolygon () {
      let pmesh;
      // polygonVerts is same as popped array
      if (this.polygonVerts.length > 2) {
         let vertexData = new BABYLON.VertexData();
         // this works in the xy plane only
         // let everts = earcut.flatten([this.polygonArray]);
         // puts(`${this.polygonArray}`);
         // puts(`${everts.vertices}`);
         // let verts = earcut(everts.vertices, everts.holes, 3);
         // puts(`${verts}`);
         // vertexData.positions = everts.vertices;
         // vertexData.indices = verts;

         vertexData.positions = this.polygonVerts.flat();
         vertexData.indices = fanTriangulate(this.polygonVerts);
         // for (let i = 0; i < this.polygonVerts.length; i++) {
         //    vertexData.indices[i] = i; // we assume they're in order;
         // }
         vertexData.normals = [];
         BABYLON.VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);
         puts(`positions: ${vertexData.positions}`);
         puts(`indices: ${vertexData.indices}`);
         puts(`normals: ${vertexData.normals}`);

  
         pmesh = new BABYLON.Mesh("poly", this.scene);
         vertexData.applyToMesh(pmesh,true);

         // set position to first captured polygon point - well, no
         // leave it in place. 
         this.meshCommonSetup(pmesh, false, false, newV(0,0,0));
                              //BABYLON.Vector3.FromArray(this.polygonVerts[0]));

         // make sure the material has backFaceCulling set to false
         this.materialList[this.TurtleState.trackMaterial].backFaceCulling = false;
         puts(`created a new polygon(${this.polygonStack.length})`);
      } else {
         puts('polygon creation failed: polygonVerts.length = ' + this.polygonVerts.length );
      }
      // restore state
      let pstate = this.polygonStack.pop();
      //this.setState(pstate.s);
      if (this.polygonStack.length > 0) {
         this.polygonVerts=pstate.a;
      } else {
         this.polygonVerts = [];
      }
   }

   /**
    *  Create and save a contour path used for generalized cylinder/trackPath extrusions
    *  newContour initializes the path. Types 1-4 are from TABOP/cpfg user manual
    * ***  All collected points are projected onto the XY plane. ***
    *  @param id   - the id of the path, can be number or string, typically single letter
    *  @param type - type of path. 
    *                default, TURTLE3D.CAPTURE_PATH, is simple path, i.e. points added
    *                form the path; user must close path explicitly, by adding initial
    *                point at the end before ending path.
    *                type TURTLE3D.CAPTURE_HERMITE_OPEN: an open Hermite spline, 
    *                points in array are Hermite spline control points.
    *                type TURTLE3D.CAPTURE_HERMITE_CLOSED: a closed Hermite spline
    *                types TURTLE3D.CAPTURE_BSPLINE_OPEN/CLOSED are open/closed B-splines
    * 
    * Notes: you shouldn't call this inside of a track or inside a contour, since it
    * steals points from those paths. Conversely, you shouldn't start a 
    * track/generalized cylinder while defining a contour. 
    * Branching or starting a new contour within a contour is also not advised.
    **/
   beginContour(id, type=Turtle3d.PATH_POINTS, udata=null) {
      this.branchStack.push({tstate: this.getState(), userData: udata});
      this.tempContour = new Contour(id, type);
      this.TurtleState.drawMode = Turtle3d.CAPTURE_CONTOUR;
   }
   updateContour(pos=null) {
      if (this.tempContour != null ) {
         if (pos == null) {
            pos = this.getPos().clone();
         }
         pos.z=0;               // enforce z==0
         this.tempContour.pts.push(pos);
      }
   }
   /**
     end a contour. 
    */
   endContour() { 
      let id = this.tempContour.id;
      if (this.tempContour != null) {
         let id = this.tempContour.id;
         let pts;
         let olds;
         switch (this.tempContour.type) {
         case Turtle3d.PATH_POINTS:
            pts = Array.from(this.tempContour.pts);
            olds = this.branchStack.pop();
            this.setState(olds.tstate); // this destroys tempContour
            this.addTrackShape(id, pts, true);
            break;
         case Turtle3d.PATH_HERMITE_OPEN:
         case Turtle3d.PATH_HERMITE_CLOSED:
         case Turtle3d.PATH_BSPLINE_OPEN:
         case Turtle3d.PATH_BSPLINE_CLOSED:
         default:
            puts(`contour type: ${this.tempContour.type} not implemented`);
         }
         this.tempContour = null;
         return olds.udata;
      } else {
         throw new Error(`Ended contour with id: ${id}, expected ${this.tempContour.id}`);
      }
   }

   storePoint(pos=null) {
      let pt = vclamp(pos==null? this.getPos() : pos);

      switch (this.TurtleState.drawMode) {
      case Turtle3d.CAPTURE_PATH:
         this.addPathPt(this.TurtleState, pt);
         break;
      case Turtle3d.CAPTURE_POLYGON: 
         this.updatePolygon(pt);
         puts(`added pt ${pt} to polygon${this.polygonStack.length}`, TRTL_CAPTURE);
         break;
      case Turtle3d.CAPTURE_CONTOUR:
         if ( this.tempContour ) {
            this.updateContour(pt);
            puts(`added contour pt ${pt}`, TRTL_CAPTURE | TRTL_CONTOUR);
         } else {
            console.error(`Contour not initialized: can't add point`);
         }
         break;
      case Turtle3d.DRAW_IMMEDIATE:
         console.warn('storePoint called when no point capture mode in progress');
         break;
      default:
         puts(`Capture type ${type} not implemented`, TRTL_CAPTURE);
         break;
      }
   }
}

Turtle3d.prototype.fd = Turtle3d.prototype.forward;
Turtle3d.prototype.bk = Turtle3d.prototype.back;
Turtle3d.prototype.lt = Turtle3d.prototype.yaw;
Turtle3d.prototype.pu = Turtle3d.prototype.penUp;
Turtle3d.prototype.pd = Turtle3d.prototype.penDown;

function defconst (aclass, map) {
   Object.keys(map).forEach(key => {
      Object.defineProperty(aclass, key, {
         value: map[key],
         writable: false,
         enumerable: true,
         configurable: false
      });
   });
}

defconst(Turtle3d, {
   DRAW_IMMEDIATE: 0,           // TurtleState.drawMode
   CAPTURE_NONE: 0,             // synonym of DRAW_IMMEDIATE
   CAPTURE_PATH: 1,
   CAPTURE_POLYGON: 2,
   CAPTURE_CONTOUR: 3,

   TRACK_LINE: 0,               // TurtleState.trackType
   TRACK_TUBE: 1,
   TRACK_EXT: 2,

   PATH_POINTS: 0,              // trackPath.type
   PATH_HERMIT_OPEN: 1,
   PATH_HERMIT_CLOSED:  2,
   PATH_BSPLINE_OPEN: 3,
   PATH_BSPLINE_CLOSED: 4,

});
/*
// define your tags here or elsewhere
const  MAIN_ALL         =1;  //0
const  LSYS_PARSE       =2;  // 1
const  LSYS_IN_ITEMS    =4;  // 2
const  LSYS_IN_PROD     =8;  // 3
const  LSYS_IN_DECOMP  =16;  // 4
const  LSYS_IN_HOMO    =32;  // 5
const  LSYS_IN_WANT    =64;  // 6
const  LSYS_PARSE_PROD=128; // 7  
const  LSYS_PARSE_MOD =256; // 8  
const  LSYS_PARSE_SUCC=512; // 9  

const  LSYS_REWRITE = 1024; // 10
const  LSYS_EXPAND  = 2048; // 11
const  LSYS_MATCH   = 4096; // 12
const  LSYS_CONTEXT = 8192; // 13

const  TRTL_CAPTURE  =  16384; // 14
const  TRTL_MATERIAL =  2**15;
const  TRTL_TEXTURE  =  2**16; 
const  TRTL_TRACK    =  2**17; 
const  TRTL_CONTOUR  =  2**18; 
const  TRTL_DRAW  =     2**19;
const  TRTL_POLYGON  =  2**20; 

const  NTRP_INIT     =  2**21;
const  NTRP_SETTING  =  2**22;
const  NTRP_MOTION   =  2**23;
const  NTRP_HEADING  =  2**25;
const  NTRP_SIZE     =  2**26;
const  NTRP_BRANCH   =  2**27;
const  NTRP_PROGRESS =  2**28;
*/
// leaving space here for different triangulation routines


                           
// Turtle3d.prototype.getTurtle = function(id=null) {
//    let t;
//    if (Turtle3d.Turtles === null) {
//       t = new Turtle3d(Turtle3d.t3dScene).getTurtle();
//    } else {
//       t = 
//    }
//    return Turtle3d.Turtles.get();
// }

// opts
//   s: shape array, default is dodecagon
//   maxTwist: maxTwist in degrees before inserting intermediate pts, default 5.625
function TrackPath(opts={}) {
   
   if (! opts.s ) {
      this.shape = generateCircle();
   } else {
      this.shape = opts.s;
   }
   if (! opts.maxTwist) {
      this.maxTwist = 5.625;
   } else {
      this.maxTwist = opts.maxTwist;
   }
   if (! opts.type) {
      this.type = Turtle3d.PATH_POINTS;
   } else {
      this.type = opts.type;
   }
   this.points=[];
   this.srm = [];               // scale, rotation, material
   this.distance = 0;           // sum of straight-line lengths
   //this.accumRoll = r;
   //puts(`maxTwist: ${this.maxTwist}`);
   this.clone = function () {
      let tpc = new TrackPath(this.accumRoll, {s: Array.from(this.shape)});
      tpc.type = this.type;
      tpc.points = Array.from(this.points);
      tpc.srm = Array.from(this.srm);
      tpc.maxTwist = this.maxTwist;
      tpc.distance = this.distance;
      return tpc;
   };
};

function Contour(id, type=0) {
   this.id = id;
   this.type = type;
   this.pts = new Array ();  // vector 3 array with z=0;
   this.controlPts = new Array(); // same as above
   this.clone = function () {
      let cclone = new Contour(id, type);
      cclone.pts = Array.from(this.pts);
      cclone.controlPts = Array.from(this.controlPts);
      return cclone;
   }
}

function generateCircle(r=1, q=12) {
   var p = [];
   let a = 2*Math.PI/q;         // arc of each section
   for (let i = 0; i < q; i++) {
      let v = newV(r*Math.cos(i*a), r*Math.sin(i*a), 0)
      p.push(vclamp(v));
   }
   p.push(p[0]);
   return p;
}

function generateMint(r=1, d=0.2, q=8) {
   const cs45 = cosd(45);
   if (d > r*(1 - cs45)) {
      puts(`d must be <= ${r*(1-cs45)}`);
      return null;
   }
   let p = [];
   const a = (r+d)*cs45;
   const alpha = acosd(a/r);
   const dOne = a - r*sind(alpha);
   const midPt = d*cs45;

   p.push(newV(dOne, 0, 0));
   p.push(newV(midPt, midPt, 0));
   p.push(newV(0, dOne, 0));
   p.push(newV(-1 * midPt, midPt, 0));
   p.push(newV(-1 * dOne, 0, 0));
   p.push(newV(-1*midPt, -1*midPt, 0));
   p.push(newV(0, -1*dOne, 0));
   p.push(newV(midPt, -1*midPt, 0));

   p.push(p[0]);
   return p;
}

function showColorTable(tu) {
   tu.penUp();
   tu.home();
   tu.goto(0,1,0);
   let size = tu.materialList.length;
   let rows = Math.round(Math.sqrt(size) + 0.5);
   puts (`ct size: ${size}, rows: ${rows}`);
   let m = 0;
   tu.setSize(0.025, true);
   tu.penDown();
   for (let r = 0; r < rows; r++) { 
      let c; let pos;
      for (c = 0; m < size && c < rows; c++, m++) {
         tu.setMaterial(254);   // black
         tu.newPolygon();
         for (let s=0; s<4; s++) {
            tu.fd(1);
            tu.yaw((s % 2 == 1) ?120 : 60);
            tu.updatePolygon(); 
         }
         tu.setMaterial(m);
         tu.endPolygon();
         tu.fd(1);
      }
      tu.bk(c);                 // go back
      tu.yaw(90);
      tu.fd(1);                 // goto next row
      tu.yaw(-90);
   }
}
// some helper functions
//var puts =console.log;          // nod to TCL
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
function atan2d(y,x) {return radtodeg * Math.atan2(y,x);}   
function smult (s, v) {return v.scale(s);} // v is a BABYLON.Vector3

      
// create a new BABYLON.Vector3;
function newV(x=0,y=0,z=0) {return new BABYLON.Vector3(x,y,z);}
// add two or three BABYLON.Vector3;
function vadd (u, v, w=null ) {
    let r = u.add(v);
    if (w != null) { r.addInPlace(w);}
    return r;
}
function vmax(v){ return Math.max(...v); }
function clamp (v, epsilon = eps) {
    let va = [];
    v.toArray(va);
    va.forEach((e,ndx) => {
	if (Math.abs(e) < epsilon) {va[ndx]=0;}})
    //{ if {abs($e) < $epsilon} {set e 0}; lappend vc $e}
    return v.fromArray(va);
}
function vclamp(v) {
   const eps = 1e-9;
   if (Math.abs(v.x) < eps) {v.x=0;}
   if (Math.abs(v.y) < eps) {v.y=0;}
   if (Math.abs(v.z) < eps) {v.z=0;}
   return v;
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
// create array from object 
function otoa (o) {
   let a = new Array();
   a.push(o.x); a.push(o.y); a.push(o.z);
   return a;
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

function crossrh (v, w) {
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
    return new BABYLON.Vector3.FromArray(res);
}

function crosslh (v, w) {
   if (betterTypeOf(v) == 'array') {
      v = BABYLON.Vector3.FromArray(v);
   }
   if (betterTypeOf(w) == 'array') {
      w = BABYLON.Vector3.FromArray(w);
   }
   let res = [];
   res[0] = v.y*w.z - v.z*w.y;
   res[1] = v.x*w.z - v.z*w.x;
   res[2] = v.y*w.x - v.x*w.y 
   return new BABYLON.Vector3.FromArray(res);
}

function normalizeColor(v) {
   let c;
   switch (betterTypeOf(v)) {
   case 'string': {
      switch  (v.toLowerCase()) {
      case 'blue': {c = BABYLON.Color3.Blue().asArray().join(); break;}
      case 'gray': {c = BABYLON.Color3.Gray().asArray().join(); break;}
      case 'green': {c = BABYLON.Color3.Green().asArray().join(); break;}
      case 'magenta': {c = BABYLON.Color3.Magenta().asArray().join(); break;}
      case 'purple': {c = BABYLON.Color3.Purple().asArray().join(); break;}
      case 'red': {c = BABYLON.Color3.Red().asArray().join(); break;}
      case 'teal': {c = BABYLON.Color3.Teal().asArray().join(); break;}
      case 'white': {c = BABYLON.Color3.White().asArray().join(); break;}
      case 'yellow': {c = BABYLON.Color3.Yellow().asArray().join(); break;}
      case 'black':{c = BABYLON.Color3.Black().asArray().join(); break;}
      default: {
         c = v.split(',').map(s => Number(s));
         if (c.length == 3 && c.every(n => n != NaN)) {
            let m = vmax(c);
            if (m >= 0 && m < 256)  { // assume we were handed std rgb triplet
               c = c.map(x => x/255); // so scale it
            }
            c = c.join();
         } else {
            puts(`unrecognized color: ${v}, defaulting to black`);
            c = '0,0,0';
         }
         break;
      }
      }
      break;
   }
   case 'array': {
      if (v.length == 3) {
	 c = v.join();
      } else {
         c = '0,0,0';
      }
      break;
   }
   case 'object': { 	// assume it's a color3 object
      c = v.asArray().join();
      break;
   }
   }
   return c;
}

// fan  triangulate from the first vertex
// assume the points are in some sensible order
function fanTriangulate(verts) {
   let indices=[0,1,2]; //
   let v=3;
   while (v < verts.length) {
      indices.push(0);
      indices.push(v-1);
      indices.push(v);
      v++;
   }
   return indices;
}

