//
// provide a 3d turtle with extensions to support lsystem interpretation
//
// depends on 
//   colortable/initColorTable.js
//   logtag.js - eliminate this by replacing puts(..) with console.log(..)
//
class Turtle3d {
   static Turtles   = new Map(); // set of turtles
   static basename  = '_t3d';   // tid = basename+counter
   static counter   = 0;       //  a counter for constructing unique tags
   static t3dScene  = null;    //  default scene, once set
   static materials = [];      // global materials
   static trackContours = new Map(); // for trackShapes, default to circle, radius size
   static meshes = new Map();        // no defaults
   static polygonStack = [];   // per TABOP usage, stores state of polygon creation
   static polygonVerts = null;   // array of vertices on edge of polygon, in order

   static initColorTable(scene) {
      for (let i = 0; i < ColorTable.length; i++) {
         let m = new BABYLON.StandardMaterial("trackMat",scene);
         m.twoSidedLighting = true;
         m.diffuseColor = BABYLON.Color3.FromArray(ColorTable[i]);
         Turtle3d.materials[i] = m;
      }
   }

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

   #defaultSphere = `__sphere_1_32_1`;

   constructor (scene=null, opts = {noturtle: false, shape: null, globalPolygons: false}) {
      this.Turtle = `${Turtle3d.basename}${Turtle3d.counter++}`;
      this.turtleShape =  null,

      this.TurtleState = {
         P: new BABYLON.Vector3.Zero(),
         H: new BABYLON.Vector3(1,0,0),
         L: new BABYLON.Vector3(0,0,1),
         U: new BABYLON.Vector3(0,1,0), // up is the yaxis in BABYLON
         penIsDown: true,
         isShown: true,
         color: '0,0,0',
         size: 0.1,
         lastSize: 0.1,
         drawMode: Turtle3d.DRAW_IMMEDIATE,
         trackType: Turtle3d.TRACK_TUBE, // line is really slow
         trackPath: null,
         trackShapeID: '"default"',
         trackShape: null,
         trackMesh: null,
         trackTag: '',          // user-defined tag(s)
         trackMaterial: 0,      // index into material list
         lastNormal: newV(0,0,1),
         accumRoll: 0,
      }

      const noturtle = opts.noturtle || false;
      const shape = opts.shape || null;
      const globalPolygons = opts.globalPolygons || false;

      this.materialList = [];
      this.extrusionID = 0;
      this.branchStack = [];    // stack of turtle state created when lsystem branches
      this.tempContour = null;
      this.polygonStack = [],   // per TABOP usage, stores state of polygon creation
      this.polygonVerts = null,   // array of vertices on edge of polygon, in order
      this.useGlobalPolygons = globalPolygons;
      this.scene = null;


      this.initDone = initAll.call(this, scene, noturtle, shape);

      // instrumentation
      this.meshCount = [0,0];
      this.meshList = [];

      function initAll(s, nt, shape) {
         this.scene = getScene.call(this, s);
         this.turtleShape = makeTurtleShape.call(this, nt, shape);
         if (Turtle3d.materials.length == 0) {
            Turtle3d.initColorTable(this.scene);
         } 
         Turtle3d.materials.forEach((e,i) => this.materialList[i] = e);
            // this.materialList.push(new BABYLON.StandardMaterial("trackMat", scene));
            // this.materialList[0].diffuseColor = this.toColorVector();
            // this.materialList[0].ambientColor = this.toColorVector();
         
         Turtle3d.trackContours.set('"default"', generateCircle(0.5,0.5));
         this.TurtleState.trackShape = Turtle3d.trackContours.get('"default"');
         Turtle3d.Turtles.set(this.Turtle, this);
         return true;
      }

      function makeTurtleShape(noturtle, shape) {
         let tag = `${this.Turtle} turtle`;
         let turtle=null
         if (noturtle) {
            return turtle;
         } else if (shape != null) {
            turtle = shape;
         } else {
            turtle = defaultTurtle.call(this, tag);
         }
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

      function defaultTurtle (tag) {
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
         BABYLON.Tags.AddTagsTo(tMesh, tag)

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
   // this leaves contours and meshes created/imported by this turtle intact
   dispose (doClear = true) {
      if (doClear) {this.clear();} // disposes drawn meshes
      Turtle3d.clearTracksByTag(`${this.Turtle} && turtle`); // disposes the turtleShape
      Turtle3d.Turtles.delete(this.Turtle);   // delete from global map
      // make this turtle useless and get rid of references to stuff
      delete this.Turtle;
      delete this.TurtleState;
      delete this.materialList;
      delete this.branchStack;
      delete this.tempContour;
      delete this.polygonStack;
      delete this.polygonVerts;
   }

   // getters and setters
   getPos() { return this.TurtleState.P;}
   getH() { return this.TurtleState.H;}
   getL() { return this.TurtleState.L;}
   getU() { return this.TurtleState.U;}
   getColor() { return this.TurtleState.color;}
   getColorVector() { return this.toColorVector(this.TurtleState.color);}
   getSize() { return this.TurtleState.size;}
   getTurtleShape() { return this.turtleShape;} // a mesh
   getTrackShapeID() {return this.TurtleState.trackShapeID;} // number or string
   getTrackShape(id=null) {
      if (id==null) {
         return this.TurtleState.trackShape; // current track shape; array of Vector3 
      } else {
         return Turtle3d.trackContours(id);
      }
   }
   getTrack() { return this.TurtleState.trackType;}
   getTurtle() {return this.Turtle;}
   getScene() {return this.scene;}
   getOrientation() {
      return [this.TurtleState.H, this.TurtleState.L, this.TurtleState.U];
   }
   isPenDown() {return this.TurtleState.penIsDown;}
   isPenUp() {return ! this.TurtleState.penIsDown;}
   isShown() {return this.TurtleState.isShown;}

   isTrackStarted() {return this.TurtleState.trackPath != null;}
   /* 
      a few static functions to select tracks/meshes across turtles
    */ 
   static getTracksByTag(tag, scene=Turtle3d.t3dScene) {
      return scene.getMeshesByTags(tag);
   }
   static clearTracksByTag(tag, scene=Turtle3d.t3dScene) {
      let tracks = scene.getMeshesByTags(tag);
      for (var index = 0; index < tracks.length; index++) {
         tracks[index].dispose();
      }
      // turtle mesh lists will not be happy after this.
   }
   static getBoundingInfoByTag(tag, scene=Turtle3d.t3dScene) {
      return getbi(Turtle3d.getTracksByTag(tag, scene));
   }

   getTrackMeshes() {
      return this.scene.getMeshesByTags(this.getTurtle() +'&& track '+ '&& !colortable' );
   }

   getColorTableMeshes() {
      return this.scene.getMeshesByTags(this.getTurtle() + ' && colortable'); 
   }

   getTrackBoundingInfo() {
      return getbi(this.getTrackMeshes());
   }

   
   // setters

   // colors and materials
   // setColor sets the diffuse color of the current material
   // this is not called by turtleInterp, which uses setMaterial
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
            m.twoSidedLighting = true;
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
      return this;
   }
   // get the material index
   getMaterialIdx() {
      return this.TurtleState.trackMaterial; // return the current material index
   }
   getMaterial(i) {
      let idx = i || this.TurtleState.trackMaterial;
      return this.materialList[idx % this.materialList.length]; // return the material
   }
   deleteMaterials() {
      this.materialList = [];
      this.TurtleState.trackMaterial = null;
      this.TurtleState.color = null;
      return this;
   }
   // where dt, et al. are images
   setTexture(dt, st=null, et=null, at=null, hasAlpha=false) {
      return this;
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
      puts(`setSize: new size == ${v}, lastSize: ${this.TurtleState.lastSize}`, TRTL_SETGET);
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
         this.TurtleState.trackShape = Turtle3d.trackContours.get(this.TurtleState.trackShapeID);
         break;
      default: {
         console.warn(`track type of ${v} not supported`);
         this.TurtleState.trackType = Turtle3d.TRACK_TUBE;
         return null;
      }
      }
      return this;
   }
   getState () {
      let s = Object.assign({}, this.TurtleState);
      s.P = this.TurtleState.P.clone();
      s.H = this.TurtleState.H.clone();
      s.L = this.TurtleState.L.clone();
      s.U = this.TurtleState.U.clone();
      s.lastNormal = this.TurtleState.lastNormal.clone();
      if (this.TurtleState.trackMesh != null) { s.trackMesh = this.TurtleState.trackMesh.clone();}
      if (this.TurtleState.trackPath != null) { s.trackPath = this.TurtleState.trackPath.clone();}
      return s;
   }

   setState (savedstate) {
      let ts = this.TurtleState;
      Object.assign(ts, savedstate);
      // ts.P = savedstate.P.clone();  // the user may expect to re-use the saved state
      // ts.H = savedstate.H.clone();
      // ts.L = savedstate.L.clone();
      // ts.U = savedstate.U.clone();
      this.setTrackShape(ts.trackShapeID);
      if (savedstate.trackMesh != null) { ts.trackMesh = savedstate.trackMesh;}
      if (savedstate.trackPath != null) { ts.trackPath = savedstate.trackPath;}

      let s = this.getTurtleShape();
      if (s != null) {
         s.position.copyFrom(this.getPos());
         if (ts.isShown) {
            this.show();
         } else {
            this.hide();
         }
         this.#orientTurtle();
      }
   }

   // some private setters
   #setPos (val) {
      try {
         if (betterTypeOf(val) == 'array'){
            this.TurtleState.P.fromArray(val);
         } else {   // assume it's a Vector3
            this.TurtleState.P = val.clone(); // in case it's a local
         }
      } catch (error) {
         puts(`${error}, calling setPos(${val})`);
      }
   }
   #setH (val) {
      if (betterTypeOf(val) == 'array'){
         this.TurtleState.H.fromArray(val);
      } else {   // assume it's a Vector3
         this.TurtleState.H = val.clone(); // in case it's a local
      }
   }
   #setL (val) {
      if (betterTypeOf(val) == 'array'){
         this.TurtleState.L.fromArray(val);
      } else {   // assume it's a Vector3
         this.TurtleState.L = val.clone(); // in case it's a local
      }
      this.TurtleState.lastNormal.copyFrom(this.TurtleState.L).scaleInPlace(-1);
   }

   #setU (val) {
      if (betterTypeOf(val) == 'array'){
         this.TurtleState.U.fromArray(val);
      } else {   // assume it's a Vector3
         this.TurtleState.U = val.clone(); // in case it's a local
      }
   }
   // orient turtle so we can see what the orientation looks like
   // not required for actual functioning
   #orientTurtle () {
      let shape = this.getTurtleShape();
      if (shape != null) {
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
      let t = this.Turtle;
      BABYLON.Tags.AddTagsTo(val, t, this.scene);
      this.turtleShape = val; // a mesh
      return this;
   }

   setTrackShape (id)  {
      let c = Turtle3d.trackContours.get(id);
      if (c) {
         this.TurtleState.trackShapeID = id;
         this.TurtleState.trackShape = c;
         if (this.TurtleState.trackPath != null) {
            this.TurtleState.trackPath.shape = c
         }
         this.TurtleState.trackType=Turtle3d.TRACK_EXT;
      } else {
         puts(`Warning: Contour ${id} not found`);
      }
      puts(`set track shape to: ${id}, size == ${this.getSize()}`, TRTL_SETGET);
      return this;
   }
   // is the provided shape closed - i.e. is last point == first point
   // we need the array of points here
   static isShapeClosed(shape) {
      if (shape?.length > 1) {
         return shape[0] == shape[shape.length-1];
      } else {
         return undefined;
      }
   }
   /**
    * addTrackShape add a shape to the contours map
    * @param id  - name/identifier of contour in contour map
    * @param val - array of pts where z value is zero, pt == 3d array
    *              we convert pts to BABYLON Vector3s, insuring z=0
    */
   addTrackShape(id, val,as_vectors=false) {
      if (val.length >= 2) {
         let pts = [];
         if (as_vectors) {
            val.forEach((v) => pts.push(v.clone()));
         } else {
            val.forEach((e) => {pts.push(newV(e[0],e[1],e[2]));});
         }
         Turtle3d.trackContours.set(id, pts);
      } else {
         console.warn(`contour: ${id} not added, not enough points.`);
      }
   }

   /*
     add your own tags to turtle tracks
    */
   setTag(val) {this.TurtleState.trackTag = val;}
   getTag() {return this.TurtleState.trackTag;}
   addTag(tag) {this.TurtleState.trackTag += ` ${tag}`;}
   removeTag(tag) {
      this.TurtleState.trackTag.replace(tag,'');
   }
                

   penUp() {
      this.TurtleState.penIsDown = false;
      return this;
   }
   penDown() {
      this.TurtleState.penIsDown = true;
      return this;
   }

   hide () {
      let t = this.Turtle;
      if (t && this.TurtleState.isShown) {
         let meshes = this.scene.getMeshesByTags(t + ' && turtle');
         for (var index = 0; index < meshes.length; index++) {
            meshes[index].isVisible = false;
         }
      }
      this.TurtleState.isShown = false;
      return this;
   }
   show () {
      let t = this.Turtle;
      if (t && ! this.TurtleState.isShown) {
         let meshes = this.scene.getMeshesByTags(t + ' && turtle');
         for (var index = 0; index < meshes.length; index++) {
            meshes[index].isVisible = true;
         }
      }
      this.TurtleState.isShown = true;
      return this;
   }

   clear() {
      let tracks =this.getTrackMeshes();
      for (var index = 0; index < tracks.length; index++) {
         tracks[index].dispose();
      }
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
      let tshape = this.turtleShape;
      let newPos = newV(0, 0, 0);

      this.#setPos(newPos);
      this.#setH(newV(1, 0, 0));
      this.#setU(newV(0, 1, 0));
      this.#setL(newV(0, 0, 1));
      if (tshape != null) {
         tshape.position = newPos;
         this.#orientTurtle();
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
         ts.trackMaterial = 0;
         ts.color = '0,0,0';
         ts.accumRoll = 0;

         this.polygonStack=[];
         this.polygonVerts=null;
         Turtle3d.polygonStack=[];
         Turtle3d.polygonVerts=null;
         Turtle3d.clearMeshes();
         Turtle3d.resetContours();
         ts.trackShapeID = '"default"';
         ts.trackShape = Turtle3d.trackContours.get(ts.trackShapeID);
         this.branchStack=[];
         this.tempContour = null;
      }
      return this;
   }

   // to support the G/g modules in TABOP
   // we add the addpathpt param to turn off
   // point capture
   forward (dist, addpathpt = true) {
      let ts   = this.TurtleState;
      let pos  = ts.P;
      let oldP = pos.clone();
      let newP = pos.clone();
      let tH   = ts.H;

      tH.scaleAndAddToRef(dist, newP)
      ts.P.copyFrom(newP);
      this.draw(oldP, newP);

      if (addpathpt) {
         switch ( ts.drawMode ) {
         case Turtle3d.CAPTURE_PATH:
            // if (ts.trackPath.type == Turtle3d.PATH_POINTS &&
            //    ts.trackPath.points.length == 0) {
            //    ts.trackPath.addPathPt(ts, oldP);
            // }
            ts.trackPath.addPathPt(ts, newP);
            break;
            // case Turtle3d.CAPTURE_POLYGON:
            //    this.updatePolygon(newP);
            // break;              
         case Turtle3d.CAPTURE_CONTOUR:
            this.tempContour?.addPoint(ts, newP); // add contour pt if initialized
            break;
         }
         puts(`forward: adding pt ${newP} to polygon`, TRTL_CAPTURE, TRTL_POLYGON);
         this.updatePolygon(newP);
      }

      return this;
   }

   back (dist) {
      return this.forward(-1*dist);
   }

   // goto never captures a point on it's own
   //      never changes heading/orientation
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
      this.#setPos(pos);
      //console.log(`oldP=${oldP}, newP=${this.TurtleState.P}`);
      this.draw(oldP, pos.clone());
      return this;
   }
   
   // 
   // gotoRelative(h1,l1,u1) {
      
   // }

   // set heading, i.e. H, parallel to vector (a1,a2,a3),
   //  or if a1 is an array then treat that as the vector,
   //  else if a1 is a vector, use that
   // adjust L and U to follow, so that in the canonical case,
   // H == [1,0,0] -> [0,1,0], it looks like a simple pitch,
   // i.e. a rotation about L
   // If you care about L and U after setting H, you should call
   // setUp after setHeading
   setHeading (a1,a2,a3) {
      let v;
      if (a1 != undefined && a2 != undefined && a3 != undefined) {
         v = new BABYLON.Vector3(a1,a2,a3);
      } else if (betterTypeOf(a1) == 'array') {
         v = BABYLON.Vector3.FromArray(a1);
      } else { //assume a1 is a vector
         v=a1;
      }
      let H = this.getH();
      let p1 = v.cross(H).scale(-1); // left axis
      if (p1.length() < 1.0e-10) {
         // v is nearly parallel to H
         if (BABYLON.Vector3.Dot(v, H) < 0) {
            // ok parallel but reversed }
            this.yaw(180);
         }
      } else {
         v.normalize();
         p1.normalize();
         let p2 = v.cross(p1).normalize().scale(-1); // up axis
         // puts(`v: ${v}; perp1: ${p1}; perp2: ${p2}`);
         this.#setH(v);
         this.#setL(p1);
         this.#setU(p2);
         this.#orientTurtle();
      }
      return this;
   }

   // given a mesh, setHeading towards it
   // or, given a vector, array of x,y,z, or three coordinates 
   // of a vector, point in the direction of the vector
   lookAt (a1, a2, a3) {
      let target;
      switch (arguments.length) {
      case 1:
         if (betterTypeOf(a1) == 'array') {
            target = BABYLON.Vector3.FromArray(a1);
         } else { // assume vector3 or mesh
            if (a1?._isMesh) {
               target = a1.position;
            } else {
               target = a1;
            }
         }
         break;
      case 3:
         target = BABYLON.Vector3.FromArray([a1,a2,a3]);
         break;
      default:
         console.warn(`lookAt requires either a Vector3, Mesh, a 3-element array, or x,y,z as arguments`);
         return;
      }
      this.setHeading(target.subtract(this.getPos()));
      return this;
   }

   // this sets U so it is in the H-up plane, up being the input vector
   // H is unchanged, L follows H and U and
   // the plane of H and U is perpendicular to L
   setUp (a1,a2,a3) {
      let up;
      if (a1 != undefined ) {
         if (a2 != undefined && a3 != undefined) {
            up = new BABYLON.Vector3(a1,a2,a3);
         } else if (betterTypeOf(a1) == 'array') {
            up = BABYLON.Vector3.FromArray(a1);
         } else { //assume a1 is a vector
            up=a1;
         }
      } else {
         throw new Error('setUp needs a Vector3, an array of three numbers, or 3 numbers as input');
      }

      up.normalize();
      let H = this.getH();
      let p1 = H.cross(up); // p1 is perp to H-up
      if (p1.length() < 1.0e-10) {
         console.warn(`up (${a1}, ${a2}, ${a3}) is parallel to heading, can't set U`);
         return this;
      }
      p1.normalize();
      let p2 = p1.cross(H); // the new up
      // H doesn't change
      this.#setL(p1);
      this.#setU(p2);
      this.#orientTurtle();
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
   //  Note: this differs from Babylon's notion of a YXZ or a ZXY standard.
   // This is a ZYX system, where Y masquerades as Z, Z as Y. X also is positive
   // forwards, and Z points up, rather than the aircraft norm of down. In other
   // words, what you learned in your vector analysis class in the late 1970's
   // The mechanism, rotateTG, is based on Turtle Geometry by Abelson and diSessa
   // which is where the HLU notation comes from: Heading, Left, Up

   // yaw: rotate around U, positive angle is from H towards L
   yaw (angle) {
      angle *= -1;              // lh system
      let H = this.TurtleState.H.clone();
      let L = this.TurtleState.L.clone();
      this.#setH(rotateTG(H, smult(-1, L), angle));
      this.#setL(rotateTG(L, H, angle));
      this.#orientTurtle();
      return this;
   }
   // pitch: rotate around L, positive is U towards H
   pitch (angle) {
      angle *= -1;              // lh system
      let H = this.TurtleState.H.clone();
      let U = this.TurtleState.U.clone();
      this.#setH(rotateTG(H, U, angle));
      this.#setU(rotateTG(U, smult(-1, H), angle));
      this.#orientTurtle();
      return this;
   }
   // roll: rotate around H, positive is L towards U
   roll (angle) {
      angle *= -1;              // lh system
      let L = this.TurtleState.L.clone();
      let U = this.TurtleState.U.clone();
      this.#setL(rotateTG(L, smult(-1,U), angle));
      this.#setU(rotateTG(U, L, angle));
      this.#orientTurtle();
      this.TurtleState.accumRoll += angle;
      this.TurtleState.accumRoll %= 360;
      return this;
   }

   rt (angle) {
      return this.yaw(-1*angle);
   }

   // handle L-system branching
   newBranch(udata=null) {
      this.branchStack.push({tstate: this.getState(), userData: udata});
      return this;
   }
   endBranch() {
      if (this.TurtleState.trackPath != null) {
         puts('endBranch with open trackPath, calling endTrack', TRTL_TRACK)
         this.endTrack();
      }
      const last = this.branchStack.pop(); //this.branchStack[this.branchStack.length-1];
      if (last) {
         this.setState(last.tstate);
         //this.TurtleState.trackPath = last.tstate.trackPath;
         return last.userData;
      } else {
         console.warn('endBranch called with no branch started!');
         return null;
      }
   }

   // drawing
   draw(oldPos, newPos) {
      let ts = this.TurtleState;
      if (this.isPenDown() && ts.drawMode == Turtle3d.DRAW_IMMEDIATE) {
         this.drawImmediate(ts, oldPos, newPos);
      }
      // update visual turtle position
      let tmesh = this.turtleShape;
      if (tmesh) {tmesh.position = newPos;}
      ts.lastSize=ts.size;
   }

   drawImmediate(ts, oldPos, newPos) {
      let t = this.Turtle;
      let type = ts.trackType;
      let segment;
      let doSetMaterial = true;

      switch (type ) {
      case Turtle3d.TRACK_LINE:
         segment = BABYLON.MeshBuilder.CreateLines('tpath',
                                                   {points: [oldPos, newPos],
                                                    tessellation: 32}, this.scene);
         segment.color = this.toColorVector();
         doSetMaterial = false;
         break;
      case Turtle3d.TRACK_TUBE:
         let radiusFunc = (i,distance) => {
            return ((i == 0) ? ts.lastSize : ts.size)/2;
         }
         segment = BABYLON.MeshBuilder.CreateTube(t,
                                                  {path: [oldPos, newPos],
                                                   radiusFunction: radiusFunc,
                                                   // tessellation: 16,
                                                   updatable: true,
                                                   cap: BABYLON.Mesh.CAP_ALL},
                                                  this.scene);
         this.meshCount[0]++;
         break;
      case Turtle3d.TRACK_EXT:
         let pathpts = [oldPos, newPos];
         let s = ts.size/2;
         let ls = ts.lastSize/2;
         let sidedness = BABYLON.Mesh.DOUBLESIDE;
         let cap = BABYLON.Mesh.NO_CAP; 
         if (Turtle3d.isShapeClosed(ts.trackShape)) {
            sidedness = BABYLON.Mesh.DEFAULTSIDE;
            cap = BABYLON.Mesh.CAP_ALL;
         }

         function getscale(i,distance) {
            return (i == 0) ? ls : s;
         }
         function getrotation(i,distance) {
            puts(`drawImmediate: rotation : ${ts.accumRoll}`, TRTL_CONTOUR, TRTL_DRAW);
            return (i==0) ? 0 : ts.accumRoll;
         }
         puts(`drawImmediate: TRACK_EXT ${pathpts}, roll: ${ts.accumRoll}`, TRTL_DRAW);
         segment = BABYLON.ExtrudeShapeCustom(t,
                                         {shape: ts.trackShape,
                                          path: pathpts,
                                          updatable: true,
                                          scaleFunction: getscale,
                                          rotationFunction: getrotation,
                                          closePath: false,
                                          sideOrientation: sidedness,
                                          cap: cap,
                                          firstNormal: ts.lastNormal
                                         });
         // segment.isVisible=true;
         // segment.material = this.materialList[ts.trackMaterial];
         // BABYLON.Tags.AddTagsTo(segment, tag, this.scene);
         ts.accumRoll = 0;
         // ts.lastSize = ts.size;
         break;
      }
      puts(`drawImmediate: mesh type: ${type}, position: ${segment.position}`, TRTL_DRAW);
      this.meshCommonSetup(segment, {setmaterial: doSetMaterial, pos: BABYLON.Vector3.Zero()});
   }
   
   drawTrack(id = null) {
      let t = this.Turtle;
      let tp = this.TurtleState.trackPath;
      if (tp === null || tp.points.length < 2) {
         return;
      }
      puts(`drawTrack: using shape ${tp.shape}`, TRTL_TRACK);

      let sidedness = BABYLON.Mesh.DOUBLESIDE;
      let cap = BABYLON.Mesh.CAP_ALL;
      if (Turtle3d.isShapeClosed(tp.shape)) {
         sidedness = BABYLON.Mesh.DEFAULTSIDE;
         cap = BABYLON.Mesh.NO_CAP;
      }

      let pathpts = tp.points;
      let doSetMaterial = true;

      puts(`trackPath.length: ${pathpts.length}`, TRTL_TRACK);
      //puts(`pathpts: ${pathpts}`);
      let srm = tp.srm;         // scale, rotation, material at each [control] point
      //puts(`srm: ${srm.toString()}`, TRTL_TRACK);

      function getscale(i,distance) {
         return srm[i].s/2;
      }
      function getrotation(i,distance) {
         return srm[i].r;
      }
      
      // const newmesh = ExtrudeShapeFixCustom(t,
      const newmesh = BABYLON.MeshBuilder.ExtrudeShapeCustom(t,
                                              {shape: tp.shape,
                                               path: pathpts,
                                               updatable: true,
                                               scaleFunction: getscale,
                                               rotationFunction: getrotation,
                                               closePath: false,
                                               sideOrientation: sidedness,
                                               cap: cap,
                                               firstNormal: tp.firstNormal,
                                               adjustFrame: true});
      /*
        that was the easy part. now figure out if we need to do multi-materials and create
        sub-meshes if we do. Doesn't apply to splines.
      */
      if (tp.type == Turtle3d.PATH_POINTS) {
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
            newmesh.material = this.materialList[matUsed[0]];
         } else {                  // need multiMaterial
            let multimat = new BABYLON.MultiMaterial("mm", this.scene);
            matUsed.forEach((e) => {
               multimat.subMaterials.push(this.materialList[e]);
            });
            const totalVertexCnt = newmesh.getTotalVertices();
            const totalIndices = newmesh.geometry.getTotalIndices();
            // this is a potentially bad, but easy estimate
            const subIndicesPerPoint = Math.floor(totalIndices/(pathpts.length-1));
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
               // puts(`SubMesh(${matIdx}, 0, ${totalVertexCnt}, ${runningIndexCnt}, ${indexDiff}, newmesh)`);
               new BABYLON.SubMesh(matIdx, 0, totalVertexCnt, runningIndexCnt, indexDiff, newmesh);
               runningIndexCnt += indexDiff
               subVrtxRemainder = 0; // add all leftover vertices at front.
               ppi = pi;
            }
            pi = pathpts.length-1;
            indexDiff = totalIndices - runningIndexCnt;
            matIdx = matLocations[sm-1][1];
            // puts(`sm: ${sm}, pi: ${pi}, indexDiff: ${indexDiff}, matIdx: ${matIdx}, runningVcnt: ${runningIndexCnt}`);
            // puts(`SubMesh(${matIdx}, 0, ${totalVertexCnt}, ${runningIndexCnt}, ${indexDiff}, newmesh)`);
            new BABYLON.SubMesh(matIdx, 0, totalVertexCnt, runningIndexCnt, indexDiff, newmesh);

            newmesh.material = multimat;
         }
      } else {
         newmesh.material = this.materialList[srm[1].m];
      }
      newmesh.id= t + this.newmeshID++;
      if (!id) {
         this.meshCommonSetup(newmesh, {setmaterial: doSetMaterial, pos: BABYLON.Vector3.Zero()});
      } else {
         Turtle3d.addMesh(id, newmesh);
         puts(`added new mesh: ${newmesh.id} with id: ${id} to meshes`, TRTL_POLYGON, TRTL_MESH)
      }
            // position the turtle at end of path
      let tmesh = this.turtleShape;
      if (tmesh) {tmesh.position = pathpts[pathpts.length-1];}
      this.TurtleState.lastSize = this.TurtleState.size;
   }

   
   newTrack(ctype='p0') {
      let ptype;
      let tp;
      let ts = this.TurtleState;
      if (ts.trackShape == null) {
         ts.trackShape = Turtle3d.trackContours.get(ts.trackShapeID);
      }

      ts.trackType = Turtle3d.TRACK_EXT;
      ts.drawMode = Turtle3d.CAPTURE_PATH;
      ts.accumRoll = 0; // keep track of twist

      switch (ctype) {
      case 'p0':
         ptype = Turtle3d.PATH_POINTS;
         tp = new TrackPath({s: ts.trackShape, type: ptype});
         break;
      case 'p1':
         ptype = Turtle3d.PATH_HERMITE_OPEN;
         tp = new HermiteSpline(this, {s: ts.trackShape, type: ptype});
         break;
      case 'p2':
         ptype = Turtle3d.PATH_HERMITE_CLOSED;
         tp = new HermiteSpline(this, {s: ts.trackShape, type: ptype});
         break;
      case 'p3':
         ptype = Turtle3d.PATH_BSPLINE_OPEN;
      case 'p4':
         ptype = Turtle3d.PATH_BSPLINE_CLOSED;
         console.warn('B-spline curves not implemented');
         break;
      default:
         console.error('Undefined track type: ' + ptype);
         return;
      }

      ts.trackPath = tp;
      ts.trackPath.addPathPt(ts, ts.P.clone());
      puts(`trackshape is: ${ts.trackShape}`, TRTL_TRACK);
      puts(`tp.shape is: ${tp.shape}`, TRTL_TRACK);

      return this;
   }

   endTrack(id = null) {
      let ts = this.TurtleState;
      let tp = ts.trackPath;
      puts(`endTrack, type: ${tp.type}`, TRTL_TRACK);
      if (tp) {
         switch (tp.type) {
         case Turtle3d.PATH_POINTS:
            break;
         case Turtle3d.PATH_HERMITE_OPEN:
         case Turtle3d.PATH_HERMITE_CLOSED:
            tp.generatePath();
            break;
         case Turtle3d.PATH_BSPLINE_OPEN:
         case Turtle3d.PATH_BSPLINE_CLOSED:
            console.warn('B-spline curves not implemented');
            tp.type = Turtle3d.PATH_POINTS;
            break;
         default:
            console.error('Unexpected path type: ' + tp.type);
            break;
         }
         this.drawTrack(id);
         ts.drawMode = Turtle3d.DRAW_IMMEDIATE; // back to immediate draw
         ts.trackPath = null;
      } else {
         console.warn('endTrack: no track in progress');
      }
      return this;
   }

   setTrackMultipliers(m0,m1) {
      let tp = this.TurtleState.trackPath;
      if (tp.type == Turtle3d.PATH_HERMITE_OPEN || tp.type == Turtle3d.PATH_HERMITE_CLOSED) {
         tp.setMultipliers(m0,m1);
      }
      return this;
   }

   setTrackRadiusSpline(angle0,len0,angle1,len1) {
      let tp = this.TurtleState.trackPath;
      if (tp.type == Turtle3d.PATH_HERMITE_OPEN || tp.type == Turtle3d.PATH_HERMITE_CLOSED) {
         tp.setRadiusSpline (angle0,len0,angle1,len1) 
      }
      return this;
   }

   setTrackQuality (q=30) {
   }

   drawDisc(d = 1, arc = 1, qual = 64, scaling = null) {
      let mesh,p, opts = {};
      opts.radius = d/2;
      opts.tessellation = qual;
      opts.arc = arc;
      //opts.sideOrientation = BABYLON.Mesh.DOUBLESIDE;
      opts. frontUVs = new BABYLON.Vector4(0.5,0,1,1);
      opts.backUVs = new BABYLON.Vector4(0,0,0.5,1);

      mesh = BABYLON.MeshBuilder.CreateDisc("disc", opts, this.Scene );

      this.meshCommonSetup(mesh, {scaling: scaling, setmaterial: true, pos: this.TurtleState.P, rotate: true});
      return this;
   }

   #makeSphere(mname, opts={}) {
      opts.diameter = opts?.diameter ?? 1;
      opts.segments = opts?.segments ?? 32;
      opts.arc      = opts?.arc ?? 1;
      opts.slice    = opts?.slice ?? 1;
      opts.frontUVs = opts?.frontUVs ?? new BABYLON.Vector4(0.5,0,1,1);
      opts.backUVs  = opts?.backUVs ?? new BABYLON.Vector4(0,0,0.5,1);
      opts.sideOrientation = opts?.sideOrientation ?? BABYLON.Mesh.DOUBLESIDE;
      // opts.updatable = true;
      let mesh = BABYLON.MeshBuilder.CreateSphere("sphere", opts, this.Scene );
      Turtle3d.addMesh(mname, mesh);

      return mesh;
   }

   drawSphere(d=1, arc=1, qual=32, slice=1, scaling=1) {
      let opts = {};
      opts.diameter = d;
      opts.segments = qual;
      opts.arc = arc;
      opts.slice = slice;
      let mname = `__sphere_${opts.arc}_${opts.segments}_${opts.slice}`;
      let mesh = Turtle3d.getMesh(mname); 
      if (! mesh) {
         mesh = this.#makeSphere(mname, opts);
      }
      if (typeof scaling === 'number') {
         scaling *= d;
      } else {                  // assume vector3
         scaling.scaleInPlace(d);
      }

      this.insertMesh(mname, scaling);
      //this.meshCommonSetup(mesh, {scaling: scaling, setmaterial: true, pos: this.TurtleState.P, rotate: true});
      return this;
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

   //    this.meshCommonSetup(mesh, {scaling: scaling, setmaterial: true, pos: this.TurtleState.P, rotate: true});
   // }

   //meshCommonSetup (mesh, scaling = null, setmaterial = true, pos = null, rotate=false) {
   meshCommonSetup (mesh, opts = {scaling: null, 
                                  setmaterial: true,
                                  backFaceCulling: true,
                                  pos: null,
                                  rotate:false,
                                  tags: null}) {
      let ts = this.TurtleState;
      let t = this.Turtle;
      let ttag = ts.trackTag;
      let tags = opts.tags || `${t} track ${ttag}`;

      if (opts.setmaterial) {
         mesh.material = this.materialList[ts.trackMaterial];
         mesh.material.backFaceCulling = opts.backFaceCulling;
      }

      if (opts.scaling) {
         if (typeof opts.scaling === 'number') {
            mesh.scaling.x = opts.scaling;
            mesh.scaling.y = opts.scaling;
            mesh.scaling.z = opts.scaling;
         } else { // assume Vector3
            mesh.scaling.x = opts.scaling.x;
            mesh.scaling.y = opts.scaling.y;
            mesh.scaling.z = opts.scaling.z;
         }
         puts(`scaled mesh by: ${typeof opts.scaling === 'number' ? opts.scaling : opts.scaling.toString()}`, TRTL_DRAW)
      }

      if (opts.pos) {
         mesh.position.copyFrom(opts.pos);
         puts(`placed mesh at: ${opts.pos.toString()}`, TRTL_DRAW)

      }

      if (opts.rotate) {
         mesh.rotation = BABYLON.Vector3.RotationFromAxis(ts.H, ts.U, ts.L.scale(1));
         puts(`rotated mesh to match turtle`, TRTL_DRAW)
      }

      mesh.isVisible = true;
      BABYLON.Tags.AddTagsTo(mesh, tags, this.scene);
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
      let pbase;
      if (this.useGlobalPolygons) {
         pbase = Turtle3d;
      } else {
         pbase = this;
      }
      if (pbase.polygonVerts !== null) {
         pbase.polygonStack.push(pbase.polygonVerts);
      }
      pbase.polygonVerts = new Array();
      puts(`Push polygonVerts and create new polygonVerts array`, TRTL_POLYGON);
      return this;
   }

   // implements the '.' module
   updatePolygon(pos=null) {
      let pbase;
      if (this.useGlobalPolygons) {
         pbase = Turtle3d;
      } else {
         pbase = this;
      }
      if (pbase.polygonVerts !== null) {
         if (pos === null) {
            pos = this.getPos();
         }
         puts(`adding ${pos} to polygonVerts`, TRTL_POLYGON);
         pbase.polygonVerts.push(otoa(pos));
      } else {
         puts('polygon not started!', TRTL_POLYGON);
      }

      return this;
   }

   // implements the '}' module
   endPolygon (id = null) {
      let ts = this.TurtleState;
      let pbase;
      if (this.useGlobalPolygons) {
         pbase = Turtle3d;
      } else {
         pbase = this;
      }
      let pmesh;
      if (pbase.polygonVerts && pbase.polygonVerts.length > 2) {
         let vertexData = new BABYLON.VertexData();
         // this works in the xy plane only
         // let everts = earcut.flatten([this.polygonArray]);
         // puts(`${this.polygonArray}`);
         // puts(`${everts.vertices}`);
         // let verts = earcut(everts.vertices, everts.holes, 3);
         // puts(`${verts}`);
         // vertexData.positions = everts.vertices;
         // vertexData.indices = verts;

         vertexData.positions = pbase.polygonVerts.flat();
         vertexData.indices = fanTriangulate(pbase.polygonVerts);

         vertexData.normals = [];
         BABYLON.VertexData.ComputeNormals(vertexData.positions, vertexData.indices, vertexData.normals);
         // puts(`positions: ${vertexData.positions}`);
         // puts(`indices: ${vertexData.indices}`);
         // puts(`normals: ${vertexData.normals}`);

         pmesh = new BABYLON.Mesh(this.Turtle, this.scene);
         vertexData.applyToMesh(pmesh,true);

         // make sure the material has backFaceCulling set to false
         //this.materialList[this.TurtleState.trackMaterial].backFaceCulling = false;
         this.meshCommonSetup(pmesh, {setmaterial: true, backFaceCulling: false});
         puts(`created a new polygon(${pbase.polygonVerts.length})`, TRTL_POLYGON);
         if (id) {
            Turtle3d.addMesh(id, pmesh);
            puts(`added polygon: ${pmesh.id} with id: ${id} to meshes`, TRTL_POLYGON, TRTL_MESH);
         }
      } else {
         puts('polygon creation failed: polygonVerts.length = ' + pbase.polygonVerts, TRTL_POLYGON );
      }
      // restore state
      pbase.polygonVerts = pbase.polygonStack.pop() || null;
      //puts(`restored polygonVerts from stack`, TRTL_POLYGON);
      // if (pbase.polygonVerts == undefined) {
      //    pbase.polygonVerts == null;
      //    puts(`set polygonVerts to null`);
      // }
      return this;
   }

   /**
    *  Create and save a contour path used for generalized cylinder/trackPath extrusions
    *  newContour initializes the path. Types 1-4 are from TABOP/cpfg user manual
    * ***  All collected points are projected onto the XY plane. ***
    *  @param npts - the total number of points in path - these will be distributed approx.
    *                equidistant along the path.
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
   beginContour(npts, isclosed = false, udata=null) {
      this.branchStack.push({tstate: this.getState(), userData: udata});
      this.tempContour = new Contour(npts, isclosed);
      this.TurtleState.drawMode = Turtle3d.CAPTURE_CONTOUR;
      return this;
   }
   /**
      end a contour and save it
      *  @param id   - the id of the path, can be number or string, typically single letter

   */
   endContour(id) {
      if (this.tempContour != null) {
         this.tempContour.id = id ?? 0; // zero fallback id;
         let pts = this.tempContour.generatePath();
         let olds = this.branchStack.pop();
         this.setState(olds.tstate); // this destroys tempContour
         this.addTrackShape(id, pts, true);
         this.tempContour = null;
         return olds ? olds.udata : null;
      } else {
         throw new Error(`Ended contour with id: ${id}, expected ${this.tempContour.id}`);
      }
   }
   // some contour controls
   // 
   setContourMultiplicity(m) {
      if (this.tempContour) {
         this.tempContour.multiplicity = m;
      }
   }
   setContourTotalPoints(np) {
      if (this.tempContour) {
         this.tempContour.numPts = np;
      }
   }
   setContourSegmentPoints(np) {
      if (this.tempContour) {
         this.tempContour.numPts = np;
      }
   }
   setContourSegmentMultipliers(m0, m1) {
      if (this.tempContour) {
         this.tempContour.setMultipliers(m0,m1);
      }
   }
   // 
   generateContourSegment(type, opts=null) {
      if (this.tempContour) {
         switch (type) {
         case Turtle3d.CONTOUR_ARC_3PT:
            this.tempContour.generateSegment(Turtle3d.CONTOUR_ARC_3PT);
            break;
         case Turtle3d.CONTOUR_ARC_CENTER:
            this.tempContour.generateSegment(Turtle3d.CONTOUR_ARC_CENTER, opts);
            break;
         case Turtle3d.CONTOUR_HERMITE:
            this.tempContour.generateSegment(Turtle3d.CONTOUR_HERMITE, opts);
            break;
         case Turtle3d.CONTOUR_BEZIER:
            this.tempContour.generateSegment(Turtle3d.CONTOUR_BEZIER,);
            break;
         default:
         }
      }
      return this;
   }

   static resetContours() {
      Turtle3d.trackContours.forEach((v,k,m) => {
         m.delete(k);
      });
      Turtle3d.trackContours.set('"default"', generateCircle(0.5,0.5));
   }

   storePoint(pos=null, hdg=null) {
      let pt = vclamp(pos==null? this.getPos().clone() : pos);
      if (pt === this.TurtleState.P) {
         pt = pt.clone();
      }
      let ts = this.TurtleState;

      switch (ts.drawMode) {
      case Turtle3d.CAPTURE_PATH:
         puts(`storePoint adding pt ${pt} to path`, TRTL_CAPTURE, TRTL_TRACK);
         ts.trackPath.addPathPt(ts, pt.clone());
         break;
      case Turtle3d.CAPTURE_CONTOUR:
         if ( this.tempContour ) {
            puts(`storePoint adding contour pt ${pt}`, TRTL_CAPTURE | TRTL_CONTOUR);
            this.tempContour.addPoint(ts, pt);
         } else {
            console.error(`Contour not initialized: can't add point`);
         }
         break;
      case Turtle3d.DRAW_IMMEDIATE:
         puts(`storePoint adding pt ${pt} to polygon`, TRTL_CAPTURE, TRTL_POLYGON);
         this.updatePolygon(pt);
         break;
      default:
         puts(`Capture type ${type} not implemented`);
         break;
      }
      return this;
   }

   plotPoints(ptset, opts = {}) {
      opts.meshID = opts?.meshID ?? null;
      opts.line   = opts?.line ?? false;
      opts.ptsize = opts?.ptsize ?? 0.1;
      opts.color  = opts?.color ?? 'black';
      let mesh = Turtle3d.getMesh(opts.meshID);
      let mname;
      if ( mesh) {
         mname = opts.meshID;
      } else {
         mname = this.#defaultSphere;
         this.#makeSphere(mname);
      }
      let oldState = this.getState();
      
      this.setColor(opts.color);
      this.penUp();
      ptset.forEach((pt) => {
         this.goto(pt); // should not have to clone this
         this.insertMesh(mname, opts.ptsize);
      });

      this.setState(oldState);
   }

   // insert instance of named mesh at provided scale
   insertMesh(name, scale=1) {
      let mobj = Turtle3d.getMesh(name);
      if (mobj) {
         let mesh = mobj.m;
         let cntr = mobj.counter;
         mobj.counter++;
         let inst = mesh.createInstance(mobj.name + cntr);
         let mopts = {setmaterial: false, pos: this.getPos(), rotate:true, backFaceCulling: true};
         if (scale != 1) {
            mopts.scaling = scale;
         }
         let c4 = BABYLON.Color4.FromColor3(this.getColorVector(), 1);
         puts(`set instance color to ${c4}`, TRTL_MESH);
         inst.instancedBuffers.color = c4;
         inst.isVisible 
         this.meshCommonSetup(inst, mopts);
      } else {
         puts(`warning: mesh, ${name}, not found`);
      }
   }

   // add/get meshes for instancing
   static addMesh(name, mesh, opts=null) {
      //mesh.setEnabled(false);
      mesh.isVisible = false;
      if (BABYLON.Tags.HasTags(mesh)) {
         mesh.removeTags(BABYLON.Tags.GetTags(mesh));
      } else {
         BABYLON.Tags.EnableFor(mesh);
      }
      mesh.addTags('mesh Turtle3d');
      let mobj = {m: mesh, name: name, counter: 0, contactPoint: null, endPoint: null, heading: null, up: null, scale: 1};
      mesh.registerInstancedBuffer("color",4);
      mesh.instancedBuffers.color = BABYLON.Color4(1,1,1,1); //FromColor3(mesh.material.diffuseColor, 1);
      if (opts) {
         let mobjkeys = mobj.keys();
         opts.keys().forEach(k => {
            if (mobjkeys.includes(k)) {
               mobj[k] = opts[k];}});
      }
      Turtle3d.meshes.set(name, mobj);
   }
   static getMesh(name) {
      return Turtle3d.meshes.get(name);
   }
   static clearMeshes() {
      Turtle3d.meshes.forEach((v,k,m) => {
         v.m.dispose();
         m.delete(k);
      });

   }

   /*
     reset Turtle3d class variables
    */
   static reset() {
      Turtle3d.Turtles = new Map();
      Turtle3d.counter = 0;
      Turtle3d.trackContours = new Map();
      Turtle3d.polygonStack = [];
      Turtle3d.polygonVerts = null;
      Turtle3d.clearMeshes();
   }

   static showColorTable(tu) {
      let tstate = tu.getState();
      tu.penUp();
      tu.home();
      tu.goto(0,1,0);
      let size = tu.materialList.length;
      let rows = Math.round(Math.sqrt(size) + 0.5);
      puts (`ct size: ${size}, rows: ${rows}`);
      let m = 0;
      tu.setTag('colortable')
      tu.setSize(0.025, true);
      tu.penDown();
      for (let r = 0; r < rows; r++) {
         let c; let pos;
         for (c = 0; m < size && c < rows; c++, m++) {
            tu.setMaterial(254);   // black
            tu.newPolygon();
            tu.updatePolygon();
            for (let s=0; s<4; s++) {
               tu.fd(1, s<3);
               tu.yaw((s % 2 == 1) ?120 : 60);
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
      tu.removeTag('colortable');
      tu.setState(tstate);
   }
}

Turtle3d.prototype.fd = Turtle3d.prototype.forward;
Turtle3d.prototype.bk = Turtle3d.prototype.back;
Turtle3d.prototype.lt = Turtle3d.prototype.yaw;
Turtle3d.prototype.pu = Turtle3d.prototype.penUp;
Turtle3d.prototype.pd = Turtle3d.prototype.penDown;
Turtle3d.prototype.seth = Turtle3d.prototype.setHeading;


// classConst is in logtag.js
classConst(Turtle3d, {
   DRAW_IMMEDIATE: 0,           // TurtleState.drawMode
   CAPTURE_NONE: 0,             // synonym of DRAW_IMMEDIATE
   CAPTURE_PATH: 1,
   CAPTURE_POLYGON: 2,
   CAPTURE_CONTOUR: 3,

   TRACK_LINE: 0,               // TurtleState.trackType
   TRACK_TUBE: 1,
   TRACK_EXT: 2,
   TRACK_RIBBON: 3,

   PATH_POINTS: 0,              // trackPath.type
   PATH_HERMITE_OPEN: 1,
   PATH_HERMITE_CLOSED:  2,
   PATH_BSPLINE_OPEN: 3,
   PATH_BSPLINE_CLOSED: 4,
   
   /* CONTOUR_POINTS: 0  default segment type */
   CONTOUR_ARC_3PT: 0,
   CONTOUR_ARC_CENTER: 1,       // center, radius, arc length
   CONTOUR_HERMITE: 2,
   CONTOUR_BEZIER: 3,

   RIBBON_OPEN: 1,    // RibbonPath.type
   RIBBON_PRIMORDIA_OPEN: 2,
   RIBBON_PRIMORDIA_CLOSED: 3,
});
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

// Contour
// if npts == 0, don't interpolate, just use control points
// otherwise, npts is the number of points in final contour
// need to control #pts to avoid screwed up ribbons
class Contour {
   #multiplicity;
   #numPts;
   constructor (npts = 0, isclosed=false, opts=null) {
      this.id = null;
      this.closed = isclosed;
      this.#multiplicity = opts?.multiplicity ?? 1;
      this.#numPts = (npts < 1) ? 8 : npts;
      this.ptsPerSegment = 80; 
      this.multipliers = [1.2, 1.2];
      this.cpts = [];           // control points
   }

   addPoint(ts, newPos) {
      let controlPt = {
         pos: newPos,
         hdg: ts.H.clone()
      }
      this.cpts.push(controlPt);
   }

   set multiplicity(m) {
      this.#multiplicity = m >= 1 ? m : 1; 
      if (this.#numPts == 0) {
         this.#numPts = 8;      // probably not a good number
      }
   }
   get multiplicity() { return this.#multiplicity; }
   
   set totalPts(np) { this.#numPts = np >= 2 ? np : 8; }
   get totalPts() { return this.#numPts; }

   setSegmentPts(n) { this.ptsPerSegment = n; }

   setMultipliers (m0, m1){ 
      this.multipliers = [m0, m1]; 
      if (this.#numPts == 0) {
         this.#numPts = 8;      // probably not a good number
      }
   }

   generateSegment (type=0, opts=null) {
      let i, spts, path;
      let p0, p1;
      switch (type) {
      case Turtle3d.CONTOUR_ARC_3PT:                   // arc 3 pts
         i = this.cpts.length-3;
         path = BABYLON.Curve3.ArcThru3Points(this.cpts[i].pos, this.cpts[i+1].pos, this.cpts[i+2].pos, this.ptsPerSegment);
         spts = path.getPoints();
         i += 1;                // point to middle arc pt
         this.cpts.splice(i,1); // delete it
         // insert generated arc points between end points
         for (let j=1; j<spts.length-1; j++, i++) {
            let ncp = {pos: spts[j]};
            this.cpts.splice(i,0,ncp);
         }
         break;
      case Turtle3d.CONTOUR_ARC_CENTER: // arc center-radius-angle
         let angle = opts?.angle ?? 90; // default arc angle
         i=this.cpts.length-1;
         p0 = this.cpts[i-1].pos.clone(); // center of arc
         p1 = this.cpts[i].pos.clone(); // first point on arc
         let rv = p1.subtract(p0);      // radius vector 
         let arcaxis = newV(0,0,-1);  // BABYLON.Axis.Z; //hdg.cross(rv); // perp axis for rotation
         let rotQuat = BABYLON.Quaternion.RotationAxis(arcaxis, degtorad*angle/this.ptsPerSegment);
         this.cpts.splice(i-1,1); // remove arc center, add at end
         rv = p1;
         for (let p = 1; p < this.ptsPerSegment; p++, i++) {
            rv.rotateByQuaternionAroundPointToRef(rotQuat, p0, rv);
            let ncp = {pos: rv.clone()};
            this.cpts.push(ncp);
         }
         break;
      case Turtle3d.CONTOUR_HERMITE:                   // hermite spline
         i=this.cpts.length-1;
         p0 = this.cpts[i-1].pos;
         p1 = this.cpts[i].pos;
         let blen = BABYLON.Vector3.Distance(p1,p0);
         let t0 = this.cpts[i-1].hdg.scale(blen*this.multipliers[0]);
         let t1 = this.cpts[i].hdg.scale(blen*this.multipliers[1]);
         path = BABYLON.Curve3.CreateHermiteSpline(p0,t0,p1,t1,this.ptsPerSegment);
         // insert spline between controlpts
         // the inserted points lack tangets
         spts = path.getPoints();
         for (let j=1; j<spts.length-1; j++, i++) {
            let ncp = {pos: spts[j]};
            this.cpts.splice(i,0,ncp);
         }
         break;
      case Turtle3d.CONTOUR_BEZIER:                   // cubic bezier spline
         i=this.cpts.length-4;
         if (i>=0) {
            path = BABYLON.Curve3.CreateCubicBezier(
               this.cpts[i].pos, this.cpts[i+1].pos, this.cpts[i+2].pos, this.cpts[i+3].pos, this.ptsPerSegment);
            spts = path.getPoints();
            i += 1;
            
         } else {
            console.warn('Too few points to create bezier spline: need at least 4');
         }
         this.cpts.splice(i,2); // delete two control points
         // insert generated arc points between end points
         for (let j=1; j<spts.length-1; j++, i++) {
            let ncp = {pos: spts[j]};
            this.cpts.splice(i,0,ncp);
         }
         break;
      default:
         throw new Error(`Unsupported contour segment type: ${type}`);
      }
   }

   generatePath () {
      let pts = [];
      if (this.cpts.length < 2) {
         return pts;
      }
      this.cpts.forEach(p => pts.push(p.pos));

      if (this.closed) {
         let p0 = pts[0];
         let pn = pts[pts.length-1];
         if (this.#multiplicity > 1) {
            pts = this.#doMultiplicty(pts, this.#multiplicity);
         } else {
            // if numPts == 0 and closed is true and the pts don't close, oh well.
            if( this.#numPts != 0 && 
                pts.length > 2 && 
                (p0.x != pn.x || p0.y != pn.y || p0.z != pn.z)) {
               pts.push[p0];
            }
         }
      }

      if (this.#numPts != 0) {
         let path = new BABYLON.Path3D(pts);
         // now interpolate to get exactly numpts points more or less evenly along the contour
         let inc = 1.0/(this.#numPts-1);
         pts = [];
         for (let u = 0; u < (1 - inc/2); u += inc) {
            pts.push(path.getPointAt(u));
         }
         pts.push(path.getPointAt(1)); // make sure we have the end point
      }
      return pts;
   }

   clone () {
      let cclone = new Contour(this.#numPts, this.type);
      cclone.pts = Array.from(this.pts);
      cclone.controlPts = Array.from(this.controlPts);
      return cclone;
   }
 
   // get side length of ngon inscribed in circle of radius r
   #ngonSideLength(n, r) {
      n = Math.floor(n);
      if (n < 2) {return 0;}
      if (n == 2) {return 2*r;}
      
      let extangle = 360/n;
      let intangle = 180-extangle;
      let alpha = intangle/2;
      let beta = 180-2*alpha;

      return r*sind(beta)/sind(alpha);
   }

   /*
     Contract the contour about the midpoint of the segment through its endpoints
     so that final distance between them is the length a side of an inscribed m-gon 
     c is the set of points in the contour
     m is the multiplicity
     r is the radius of the inscribed circle
     return the array of munged points
   */
   #contractContourForMultiplicity(c, m, r=0.5) {
      let rpts = [];
      let p0, pn, d0, B0, MP0,sidelen, scale, Tv;
      let n = c.length - 1;
      let idx=0, inc = 1;
      if (c[0].x > c[n].x) {
         p0 = c[0];
         pn = c[n];
      } else {
         p0 = c[n];
         pn = c[0]; 
         idx = n;                  // to reverse the pt order if needed;
         inc = -1;
      }
      B0 = pn.subtract(p0);
      d0  = B0.length();
      if (d0  <  0.01 /*Number.EPSILON*/) {
         console.warn('End points of contour are too close together!');
         return null;
      }
      MP0 = p0.add(pn.subtract(p0).scale(0.5));

      sidelen = ngonSideLength(m,r);
      scale = sidelen/d0;


      for (let i = 0; i <= n; i++, idx += inc ) {
         // puts(`counter i: ${i}, index: ${idx}`);
         rpts.push(MP0.add(c[idx].subtract(MP0).scale(scale)));
      }

      //Tv = newV(sidelen/2, 0, 0).subtract(rpts[0]);  // where we want p0 to end up;
      Tv = newV(r, 0, 0).subtract(rpts[0]);  // where we want p0 to end up;
      rpts.forEach((p) => {p.addInPlace(Tv);});

      return rpts;
   }

   // at the end of contractContourFor Multiplictity, the contour s.b.
   // the right length with it's first point at (r,0,z)
   // this simply rotates it so it's in the correct position
   #doFirstSide(pts, m, r=0.5) {
      let rpts = contractContourForMultiplicity(pts, m, r);
      let n = rpts.length-1;
      let y = rpts[n].y;
      let x = rpts[n].x - rpts[0].x;
      if (y == 0 && x == 0) {
         throw new Error('Contour must not be closed!');
      }
      let theta = 180 - atan2d(y,x);     // angle of original contour
      let extangle = 360/m;
      let intangle = 180-extangle;
      let alpha = 90-180/m;        // (180 - 360/n)/2; 
      
      let rotationAngle = (theta - alpha);
      puts(`theta: ${theta}, alpha: ${alpha}, rotationAngle: ${rotationAngle}`);
      rotationAngle *= degtorad;
      let rotQuat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, rotationAngle);
      for (let p = 1; p <= n; p++) {
         rpts[p].rotateByQuaternionAroundPointToRef(rotQuat, rpts[0], rpts[p]);
      }
      return rpts;
   }

   /*
     The first side is in place at the end of doFirstSide. 
     This function copies that and then translates and rotates that first side
     m-1 times to construct the other sides.
   */ 
   #doMultiplicty(pts, m, r=0.5) {
      if (m < 2 || m > 32) {return null;}
      let fpts = doFirstSide(pts,m, r);
      let n = fpts.length;
      let opts = [];
      fpts.forEach((p) => {opts.push(p.clone());});
      let extAngle = 360/m;
      let rotateQuat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z,extAngle*degtorad);

      for (let i = 1; i < m; i++) {
         let p0 = fpts[n-1].clone();       // center of rotation for this side
         let tvec = p0.subtract(fpts[0]);
         // for each remaining side, translate and rotate fpts
         fpts.forEach((p) => {
            p.addInPlace(tvec).rotateByQuaternionAroundPointToRef(rotateQuat, p0,p);
            //p.rotateByQuaternionAroundPointToRef(rotateQuat, p0,p);
         });
         // copy points to output
         for (let j = 1; j < n; j++) { 
            if ( j < n-1 || i < m - 1) {
               opts.push(fpts[j].clone());
            }
         }
      }
      return opts;
   }
}


// TrackPath
// opts
//   s: shape array, default is dodecagon
//   maxTwist: maxTwist in degrees before inserting intermediate pts, default 5.625
class TrackPath {
   constructor (opts={}) {
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
      this.firstNormal = newV(0,0,-1);
      //this.accumRoll = r;
      //puts(`maxTwist: ${this.maxTwist}`);
   }

   /**
    * addPathPt at a point when in path mode
    * ts = TurtleState
    * newPos = position to add
    **/
   addPathPt(ts, newPos) {
      puts(`addPathPt ${newPos}`, TRTL_TRACK, TRTL_CAPTURE);
      // assuming 'extrusion'

      if (this.points.length == 0) { // push first point
         puts(`added initial path pt: ${newPos}, size: ${ts.lastSize}`, TRTL_TRACK);
         this.points.push(newPos);
         this.srm.push({s: ts.lastSize, r: 0, m: ts.trackMaterial})
         this.firstNormal.copyFrom(ts.lastNormal); //
         puts(`addPathPt: firstNormal = ${this.firstNormal}`, TRTL_TRACK);
      } else {
         let lastPos = this.points[this.points.length-1];
         this.distance+= BABYLON.Vector3.Distance(newPos, lastPos);
         let roll = ts.accumRoll;
         let lastroll = this.srm[this.srm.length - 1].r * radtodeg;
         let rolldiff = roll - lastroll; // total additional roll
         // puts(this.srm);
         let npts = Math.abs(Math.trunc(roll / this.maxTwist)); // number of pts
         let rollinc = roll / (npts+1); // divide by # sections
         puts(`this.srm.length: ${this.srm.length}, roll: ${roll}, lastroll: ${lastroll}, rolldiff: ${rolldiff}, rollinc: ${rollinc}, npts: ${npts}`, TRTL_TRACK);
         if (npts > 0) {
            // add intermediate points
            let vecdiff = newPos.subtract(lastPos).scaleInPlace(1/(npts+1));
            // insert intermediate points
            let r = rollinc;
            let lpt = lastPos;
            puts(`adding ${npts} points, with incremental roll of ${rollinc}`, TRTL_TRACK);
            let troll=0;
            for (let pti = 0; pti < npts+1; pti++) {
               lpt = lpt.add(vecdiff);
               this.points.push(lpt);
               this.srm.push({s: ts.size,
                              r: r * degtorad,
                              m: ts.trackMaterial
                             });
               troll += rollinc;
               puts(`inserted path pt: ${lpt}, total roll: ${troll}`, TRTL_TRACK);
            }
         } else {
            // add new position
            this.points.push(newPos);
            this.srm.push({s: ts.size,
                           r: rollinc * degtorad,
                           m: ts.trackMaterial
                          });
            //puts(`added path pt: ${newPos}`, TRTL_TRACK);
         }
         ts.accumRoll = 0;
      }
   }
   clone () {
      let tpc = new TrackPath({s: Array.from(this.shape)});
      tpc.type = this.type;
      tpc.points = Array.from(this.points);
      tpc.srm = Array.from(this.srm);
      tpc.maxTwist = this.maxTwist;
      tpc.distance = this.distance;
      return tpc;
   };
};

class HermiteSpline extends TrackPath {
   constructor (t=null, opts={}) {
      super(opts);
      this.type = Turtle3d.PATH_HERMITE_OPEN;
      this.ptsPerSegment = opts.ptsPerSegment || 20;
      this.material = t ? t.getMaterial() : null; // default
      this.controlPoints = [];
      this.pointPair = { tm0: 1.2, tm1: 1.2, radiusSpline: null};
      this.isEmpty = true;
   }

   clone () {
      let c = new HermiteSpline()
      c.type = this.type;
      c.maxTwist = this.maxTwist;
      c.material = this.material;
      c.ptsPerSegment = this.ptsPerSegment;
      c.controlPoints = Array.from(this.controlPoints);
      Object.assign(c.pointPair, this.pointPair);
      c.isEmpty = this.isEmpty;
      return c;
   }

   addPathPt (ts, newPos) {
      if (this.isEmpty) {
         this.pointPair.p0 = newPos;
         this.pointPair.t0 = ts.H.clone();
         this.pointPair.rb = ts.size/2;
         this.pointPair.normb = ts.lastNormal.clone();
         this.material = ts.trackMaterial;
         this.isEmpty = false;
      } else {
         let len = BABYLON.Vector3.Distance(newPos, this.pointPair.p0); 
         this.pointPair.p1 = newPos;
         this.pointPair.t1 = ts.H.clone();
         this.pointPair.rt = ts.size/2;
         this.pointPair.normt = ts.L.clone().scaleInPlace(-1);
         this.controlPoints.push(this.pointPair);
         let newPair = {p0: newPos.clone(), t0: this.pointPair.t1.clone(),tm0: 1.2, tm1: 1.2,
                        rb: this.pointPair.rt, normb: this.pointPair.normt.clone(), radiusSpline: null};
         this.pointPair = newPair;
      }
   }

   setMultipliers (m0, m1){
      this.pointPair.tm0 = m0;
      this.pointPair.tm1 = m1;
   }

   // angle a wrt to u-axis which is unknown until p1 is defined, so store it
   setRadiusSpline (a0,len0,a1,len1) {
      this.pointPair.radiusSpline = [a0, len0, a1, len1];
   }

   // this applies to all segments, unlike the TABOP strips
   setNumStrips(n) {
      this.ptsPerSegment = n; 
   }

   generatePath() {
      this.points = [];
      this.srm = [];

      for (let ppi = 0; ppi < this.controlPoints.length; ppi++) {
         let pp = this.controlPoints[ppi];
         let p0 = pp.p0, p1 = pp.p1, t0 = pp.t0;
         let totalTwist = BABYLON.Vector3.GetAngleBetweenVectorsOnPlane(pp.normb, pp.normt, t0);
         if (totalTwist/this.ptsPerSegment > this.maxTwist) {
            this.ptsPerSegment = Math.round(0.5 + totalTwist/this.maxTwist);
         }
         let blen = BABYLON.Vector3.Distance(p1,p0);
         let twistInc = totalTwist/this.ptsPerSegment;
         puts(`Hermite pathpair: p0: ${p0}, p1 ${p1}, normb: ${pp.normb}, normt: ${pp.normt}, totalTwist:: ${totalTwist} (${totalTwist * radtodeg} deg`, TRTL_HERMITE);

         let pathspline = BABYLON.Curve3.CreateHermiteSpline(
            p0,t0.scale(blen*pp.tm0),p1,pp.t1.scale(blen*pp.tm1),this.ptsPerSegment);

         puts(`Hermite pathspline: ${p0}, ${t0} (${blen} * ${pp.tm0}) ${p1} ${pp.t1} (${blen} * ${pp.tm1})`, TRTL_HERMITE);
         if (LogTag.isSet(TRTL_HERMITE)) {
            var pmesh = BABYLON.Mesh.CreateLines("hermite",pathspline.getPoints(), scene);
            pmesh.color = BABYLON.Color3.Yellow();
            BABYLON.Tags.AddTagsTo(pmesh, 'lsystem debug', this.scene);
         }

         if ( pp.radiusSpline)  { // recalc pathspline
            let rs = pp.radiusSpline;
            puts(`${rs}`, TRTL_HERMITE);
            let bheading = p1.subtract(p0).normalize();
            let r0, r1, prb, prt, tl0,tl1;
            tl0 = (rs[1] == 0) ? 1/(pp.rt - pp.rb) : rs[1];
            tl1 = (rs[3] == 0) ? 1/(pp.rt - pp.rb) : rs[3];

            let x = cosd(90 - rs[0]);
            let y = sind(90 - rs[0]);
            prb = newV(pp.rb,0,0);
            r0 = newV(x,y,0).scale(tl0);

            x = cosd(90 - rs[2]);
            y = sind(90 - rs[2]);
            //prt = newV(pp.rt,1,0);
            prt = newV(pp.rt,blen,0);
            r1 = newV(x,y,0).scale(tl1);

            let radiusSpline = BABYLON.Curve3.CreateHermiteSpline(
               prb,r0,prt,r1,this.ptsPerSegment);
            
            puts(`Hermite radiusSpline: ${prb}, ${r0} ${prt} ${r1}`, TRTL_HERMITE);

            let  radiuspath = new BABYLON.Path3D(radiusSpline.getPoints());

            if (LogTag.isSet(TRTL_HERMITE)) {
               let rmesh = BABYLON.Mesh.CreateLines("hermite",radiusSpline.getPoints(), scene);
               rmesh.color = BABYLON.Color3.Red()
               // let bmesh = BABYLON.Mesh.CreateLines("hermite",[p0,p1], scene);
               // bmesh.color = BABYLON.Color3.Blue()
               BABYLON.Tags.AddTagsTo(rmesh, 'lsystem debug', this.scene);
            }
            let tmap = [];
            let radii = [];
            let step = 1/this.ptsPerSegment;
            for (let t = 0; t <= 1 + step/2; t += step) {
               radii.push(radiuspath.getPointAt(t).x);
               tmap.push(radiuspath.getPointAt(t).y);
            }

            puts(`tmap length: ${tmap.length}`, TRTL_HERMITE); 
            puts(`tmap: ${tmap}`, TRTL_HERMITE);
            puts(`twistinc: ${twistInc} (${twistInc * radtodeg} deg)`, TRTL_HERMITE);
            puts(`radii: ${radii}`, TRTL_HERMITE);

            let extpath = new BABYLON.Path3D(pathspline.getPoints());
            for (let i = (ppi > 0) ? 1 : 0; i < tmap.length; i++) {
               this.points.push(extpath.getPointAt(tmap[i]));
               this.srm.push({s: radii[i]*2, r: twistInc, m: this.material});
            }
            puts(`points: ${this.points}`, TRTL_HERMITE);
         } else {
            let pts = pathspline.getPoints();
            let radiusInc = (pp.rt - pp.rb)/pts.length; // s.b. this.ptsPerSegment
            for (let i = 0; i < pts.length; i++) {
               this.points.push(pts[i]);
               this.srm.push({s: pp.rb + i*radiusInc, r: twistInc, m: this.material});
            }
         }
      }
   }

} /* end HermiteSpline */

// Base class for ribbon-based meshes
class RibbonPath {
   constructor(opts = {}) {
      this.paths = [];          // array of contour paths
      this.nContourPts = opts.nPts ? opts.nPts : 9;
      this.closedPaths = opts.closePaths ? true : false;
      this.closedArray = opts.closeArray ? true : false;
      this.type = Turtle3d.RIBBON_OPEN;
   }
   addPath(ts, contour) {
      this.paths.push(contour);
   }
   clone() {
      let rpc = new RibbonPath({s: Array.from(this.contour)});
      return rpc;
   }
}

class Primordia extends RibbonPath {
   constructor(t, opts = {}) {
      super(opts);
      this.contour = [];
      if (opts.nPts) {
         let npts = opts.npts % 2 ? opts.npts : opts.npts + 1;
         this.nContourPts = npts >= 3 ? npts : 9;
      }
      this.type = Turtle3d.RIBBON_PRIMORDIA_OPEN;
      if (opts.nPts) {
      } else {
         this.nContourPts = 2*9+2;
      }
      this.weights=[0,0,0];
   }
}
class PrimordiaClosed extends Primordia {
   constructor(t, opts = {}) {
      super(opts);
   }
}

function generateCircle(r1=0.5,r2=0.5, q=24) {
   
   var p = [];
   let a = 2*Math.PI/q;         // arc of each section
   for (let i = 0; i < q; i++) {
      let v = newV(r1*Math.cos(i*a), r2*Math.sin(i*a), 0)
      //p.push(vclamp(v));
      p.push(v);
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

/*
function showColorTable(tu) {
   let tstate = tu.getState();
   tu.penUp();
   tu.home();
   tu.goto(0,1,0);
   let size = tu.materialList.length;
   let rows = Math.round(Math.sqrt(size) + 0.5);
   puts (`ct size: ${size}, rows: ${rows}`);
   let m = 0;
   tu.setTag('colortable')
   tu.setSize(0.025, true);
   tu.penDown();
   for (let r = 0; r < rows; r++) {
      let c; let pos;
      for (c = 0; m < size && c < rows; c++, m++) {
         tu.setMaterial(254);   // black
         tu.newPolygon();
         tu.updatePolygon();
         for (let s=0; s<4; s++) {
            tu.fd(1, s<3);
            tu.yaw((s % 2 == 1) ?120 : 60);
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
   tu.removeTag('colortable');
   tu.setState(tstate);
}
*/
// some helper functions
//var puts = console.log;          // nod to TCL
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
function newV(x=0,y=0,z=0) {
   return new BABYLON.Vector3(x,y,z);
}
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
// round f to d decimal points
// if d < 0 then rounding proceeds to the left of zero
function dround(f,d) {
   d=Math.round(d);
   if (d < -15 || d>15) {return f;}
   if (d==0) { return Math.round(f);}
   let s = Math.pow(10,d);
   let ff = s*f;
   return Math.round(ff)/s;
}
// round a vector using dround
function vround(v, d) {
   let va = [];
   v.toArray(va);
   va.forEach((e,ndx) => {
      va[ndx]=dround(va[ndx],d);})
   return v.fromArray(va);
}

function dot (v, w) {
   let d = BABYLON.Vector3.Dot(v,w);
   return ((d <= eps) ? 0 : d);
}

// create array from object
function otoa (o) {
   let a = new Array();
   a.push(o.x); a.push(o.y); a.push(o.z);
   return a;
}
//rotate per Turtle Geometry
// this rotates in the plane of vec-perpvec, perfect for
// yaw, pitch, and roll
function rotateTG (vec, perpvec, angle) {
   return vadd( smult(cosd(angle), vec), smult(sind(angle), perpvec));
}

// sugar
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
   case 'object': {  // assume it's a color3 object
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

function  getbi (meshes) {
   if (meshes.length < 1) {
      return null;
   }
   let min = meshes[0].getBoundingInfo().boundingBox.minimumWorld;
   let max = meshes[0].getBoundingInfo().boundingBox.maximumWorld;

   for(let i=1; i<meshes.length; i++){
      let meshMin = meshes[i].getBoundingInfo().boundingBox.minimumWorld;
      let meshMax = meshes[i].getBoundingInfo().boundingBox.maximumWorld;

      min = BABYLON.Vector3.Minimize(min, meshMin);
      max = BABYLON.Vector3.Maximize(max, meshMax);
   }
   return new BABYLON.BoundingInfo(min, max);
}



// contract (or explode) contour around origin so that endpoints are slen apart
function contract(origin, pts, slen) {
   let cpts = [];
   let scale = slen/BABYLON.Vector3.Distance(pts[0], pts[pts.length-1]);
   puts(`contraction scale: ${scale}`);
   //for (let p = 0; p < pts.length; p++) {
   pts.forEach((pt,p) => {
      cpts.push(pt.subtract(origin).scale(scale).add(origin));
      puts(`pt(${pt.x}, ${pt.y}) --> ${cpts[p].x}, ${cpts[p].x})`);
   }
   );
//   puts(`scale: ${scale}, dist P0,Pn: ${BABYLON.Vector3.Distance(cpts[0], cpts[cpts.length-1]}`);
   return cpts;
}

// get side length of ngon inscribed in circle of radius r
function ngonSideLength(n, r) {
   n = Math.floor(n);
   if (n < 2) {return 0;}
   if (n == 2) {return 2*r;}
   
   let extangle = 360/n;
   let intangle = 180-extangle;
   let alpha = intangle/2;
   let beta = 180-2*alpha;

   return r*sind(beta)/sind(alpha);
}

/*
  Contract the contour about the midpoint of the segment through its endpoints
  so that final distance between them is the length a side of an inscribed m-gon 
  c is the set of points in the contour
  m is the multiplicity
  r is the radius of the inscribed circle
  return the array of munged points
*/
function contractContourForMultiplicity(c, m, r=0.5) {
   let rpts = [];
   let p0, pn, d0, B0, MP0,sidelen, scale, Tv;
   let n = c.length - 1;
   let idx=0, inc = 1;
   if (c[0].x > c[n].x) {
      p0 = c[0];
      pn = c[n];
   } else {
      p0 = c[n];
      pn = c[0]; 
      idx = n;                  // to reverse the pt order if needed;
      inc = -1;
   }
   B0 = pn.subtract(p0);
   d0  = B0.length();
   if (d0  <  0.01 /*Number.EPSILON*/) {
      console.warn('End points of contour are too close together!');
      return null;
   }
   MP0 = p0.add(pn.subtract(p0).scale(0.5));

   sidelen = ngonSideLength(m,r);
   scale = sidelen/d0;


   for (let i = 0; i <= n; i++, idx += inc ) {
      // puts(`counter i: ${i}, index: ${idx}`);
      rpts.push(MP0.add(c[idx].subtract(MP0).scale(scale)));
   }

   //Tv = newV(sidelen/2, 0, 0).subtract(rpts[0]);  // where we want p0 to end up;
   Tv = newV(r, 0, 0).subtract(rpts[0]);  // where we want p0 to end up;
   rpts.forEach((p) => {p.addInPlace(Tv);});

   return rpts;
}

// at the end of contractContourFor Multiplictity, the contour s.b.
// the right length with it's first point at (r,0,z)
// this simply rotates it so it's in the correct position
function doFirstSide(pts, m, r=0.5) {
   let rpts = contractContourForMultiplicity(pts, m, r);
   let n = rpts.length-1;
   let y = rpts[n].y;
   let x = rpts[n].x - rpts[0].x;
   if (y == 0 && x == 0) {
      throw new Error('Contour must not be closed!');
   }
   let theta = 180 - atan2d(y,x);     // angle of original contour
   let extangle = 360/m;
   let intangle = 180-extangle;
   let alpha = 90-180/m;        // (180 - 360/n)/2; 
   
   let rotationAngle = (theta - alpha);
   puts(`theta: ${theta}, alpha: ${alpha}, rotationAngle: ${rotationAngle}`);
   rotationAngle *= degtorad;
   let rotQuat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, rotationAngle);
   for (let p = 1; p <= n; p++) {
      rpts[p].rotateByQuaternionAroundPointToRef(rotQuat, rpts[0], rpts[p]);
   }
   return rpts;
}

/*
  The first side is in place at the end of doFirstSide. 
  This function copies that and then translates and rotates that first side
  m-1 times to construct the other sides.
*/ 
function doMultiplicty(pts, m, r=0.5) {
   if (m < 2 || m > 32) {return null;}
   let fpts = doFirstSide(pts,m, r);
   let n = fpts.length;
   let opts = [];
   fpts.forEach((p) => {opts.push(p.clone());});
   let extAngle = 360/m;
   let rotateQuat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z,extAngle*degtorad);

   for (let i = 1; i < m; i++) {
      let p0 = fpts[n-1].clone();       // center of rotation for this side
      let tvec = p0.subtract(fpts[0]);
      // for each remaining side, translate and rotate fpts
      fpts.forEach((p) => {
         p.addInPlace(tvec).rotateByQuaternionAroundPointToRef(rotateQuat, p0,p);
         //p.rotateByQuaternionAroundPointToRef(rotateQuat, p0,p);
      });
      // copy points to output
      for (let j = 1; j < n; j++) { 
         if ( j < n-1 || i < m - 1) {
            opts.push(fpts[j].clone());
         }
      }
   }
   return opts;
}

function supershapeFn(p = {a: 1, b: 1, n1: 2, n2: 2, n3: 1, m: 0, f: function (rho) {return 1;}}) {
   let a = p?.a ?? 1;
   let b = p?.b ?? 1;
   let n1 = p?.n1 ?? 2;
   let n2 = p?.n2 ?? 2;
   let n3 = p?.n3 ?? 1;
   let m = p?.m ?? 0;
   let f = p?.f ?? function (rho) {return 1;};
   if (n1 == 0) {
      return p.f;
   } else {
      return function (phi) {
         return f(phi)/Math.pow(Math.pow(Math.abs(Math.cos(phi*m/4)/a), n2) + Math.pow(Math.abs(Math.sin(phi*m/4)/b), n3), 1/n1);
      }
   }
}

function supershapeContour(ssf, q=36, alpha=2*Math.PI) {
   let pts = [];
   for (let i = 0, a=0; i <= q; i++, a+=alpha/q) {
      let r = ssf(a);
      pts.push([r*Math.cos(a),r*Math.sin(a),0]);
   }
   return pts;
}

