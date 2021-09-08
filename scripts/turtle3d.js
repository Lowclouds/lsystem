class Turtle3d {
   constructor (scene=null,noturtle=false,shape=null) {
      this.TurtleState = {
	 Turtle: `_t3d${Turtle3d.prototype.t3dIDTag++}`,
	 P: new BABYLON.Vector3.Zero(),
	 H: new BABYLON.Vector3(1,0,0),
	 L: new BABYLON.Vector3(0,0,1), 
	 U: new BABYLON.Vector3(0,1,0), // up is the yaxis in BABYLON
	 penIsDown: true,
	 isShown: true,
	 color: '0,0,0',
	 size: 0.01,
	 turtleShape: null,
	 track: 'tube',
         trackPath: null,
         trackShape: null,
	 trackMesh: null,
         trackTag: '',          // additional tag
         trackMaterial: 0,      // index into material list
         drawMode: 'd',             // 'd': draw, 'p': extrude
         accumRoll: 0,
      }

      this.scene = null;
      this.materialList = [];
      this.trackPaths = [];
      this.branchStack = [];
      this.initDone = initAll.call(this, scene,noturtle,shape);

      // instrumentation
      this.meshCount = [0,0];
      this.meshList = [];

      function initAll(s, nt, shape) {
	 this.TurtleState.turtleShape = turtleShape.call(this, nt, shape);
	 this.scene = getScene.call(this, scene);
         this.materialList.push(new BABYLON.StandardMaterial("trackMat", scene));
         this.materialList[0].diffuseColor = this.toColorVector();
	 if (Turtle3d.Turtles == null) {Turtle3d.Turtles  = new Map();}
	 Turtle3d.Turtles.set(this.TurtleState.Turtle, this);
	 return true;
      }

      function turtleShape(noturtle, shape) {
	 if (noturtle) {
	    return '';
	 } else if (shape != null) {
	    return shape;
	 } else {
	    return maketurtle.call(this, this.TurtleState.Turtle);
	 }
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
	 var tMesh = BABYLON.MeshBuilder.CreateBox("turtle",{size: 0.25},scene);
	 BABYLON.Tags.AddTagsTo(tMesh, `${tag} turtle`); 
	 let pts = [ newV(0,0,0), newV(1, 0, 0) ];
	 let axis;
	 let xaxis = BABYLON.MeshBuilder.CreateLines('xaxis', {points: pts}, scene);
	 BABYLON.Tags.AddTagsTo(xaxis, `${tag} H heading`); 
	 xaxis.color = BABYLON.Color3.Red();
	 xaxis.parent = tMesh;
	 pts[1] = newV(0, 1, 0);
	 axis = BABYLON.MeshBuilder.CreateLines('yaxis',{points: pts}, scene);
	 axis.parent = tMesh;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} L binormal`); 
	 axis.color =new BABYLON.Color3(0,0.7,0);
	 pts[1] = newV(0, 0, 1);
	 axis = BABYLON.MeshBuilder.CreateLines('zaxis',{points: pts}, scene);
	 axis.parent = tMesh;
	 BABYLON.Tags.AddTagsTo(axis, `${tag} U normal`); 
	 axis.color = BABYLON.Color3.Blue();

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
   getTrackShape() {return this.TurtleState.trackShape;} // array of Vector3
   getTrack() { return this.TurtleState.track;}
   getTurtle() {return this.TurtleState.Turtle;}
   getScene() {return this.scene;}
   getOrientation() {
      return [this.TurtleState.H, this.TurtleState.L, this.TurtleState.U]; 
   }
   isPenDown() {return this.TurtleState.penIsDown;}
   isPenUp() {return ! this.TurtleState.penIsDown;}
   isShown() {return this.TurtleState.isShown;}

   // setters
   // 
   setColor(v) {
      this.TurtleState.color = normalizeColor(v);

      const cidx = this.TurtleState.trackMaterial;
      this.materialList[cidx].diffuseColor = this.toColorVector();

      //puts(`set color to ${this.TurtleState.color}`);
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
      return this.materialList[i % this.materialList.length]; // return the index
   }
   setMaterial(i) {
      this.TurtleState.trackMaterial = i % this.materialList.length;
      this.TurtleState.color = normalizeColor(this.materialList[i].diffuseColor);
   }
   deleteMaterials() {
      this.materialList = [];
      this.TurtleState.trackMaterial = null;
      this.TurtleState.color = null;
   }

   toColorVector(cv = this.TurtleState.color) {
      let c = new BABYLON.Color3();
      return c.fromArray(Array.from(cv.split(','), x=> Number(x)));
   }
   setSize(v) {this.TurtleState.size = v;}
   setTrack(v, points=null) {
      switch (v) {
      case 'line':
      case 'tube': {
         this.TurtleState.track = v; return true;
         break;
      }
      case 'cyl':
      case 'cylinder':
      case 'extrusion':
      case 'ext': {
         this.TurtleState.track = 'ext';
         if (points == null) {
            this.TurtleState.trackShape = generateMint();
         } else {
            this.TurtleState.trackShape = points;
         }
         break;
      }
      default: {
	 console.log(`track type of ${v} not supported`);
	 this.TurtleState.track = 'line';
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
      if (s.trackMesh != null) { s.trackMesh = s.trackMesh.clone();}
      if (s.trackPath != null) { s.trackPath = s.trackPath.clone();}
      return s;
   }

   setState (savedstate) {
      Object.assign(this.TurtleState, savedstate);
      const cidx = this.TurtleState.trackMaterial;
      this.materialList[cidx].diffuseColor = this.toColorVector();

      let s = this.getTurtleShape();
      if (s != '') {
	 s.position = this.getPos();
	 let meshes = this.scene.getMeshesByTags(this.TurtleState.Turtle);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = this.TurtleState.isShown;
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
   //
   orientTurtle () {
      let shape = this.getTurtleShape();
      if (shape != "") {
	 shape.rotation = 
	    BABYLON.Vector3.RotationFromAxis(this.TurtleState.H,
					     this.TurtleState.U,
					     this.TurtleState.L);
      }
   }

   setTurtleShape(val) {this.TurtleState.turtleShape = val;} // a mesh
   setTrackShape(val)  {this.TurtleState.trackShape = val;} // array of Vector3
   setTag(val) {this.TurtleState.trackTag = val;}

   penUp() {this.TurtleState.penIsDown = false;}
   penDown() {this.TurtleState.penIsDown = true;}

   hide () {
      let t = this.TurtleState.Turtle;
      if (t && this.TurtleState.isShown) {
	 let meshes = this.scene.getMeshesByTags(t);
	 for (var index = 0; index < meshes.length; index++) {
	    meshes[index].isVisible = false;
	 }
      }
      this.TurtleState.isShown = false;
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
   }

   clear() {
      let tracks =this.scene.getMeshesByTags('track'+this.getTurtle());
      for (var index = 0; index < tracks.length; index++) {
	 tracks[index].dispose();
      }
   }

   draw(oldPos, newPos) {
      let t = this.TurtleState.Turtle;
      let ttag = this.TurtleState.trackTag;
      let ts = this.TurtleState.turtleShape;
      let type = this.TurtleState.track;
      let tag = `track${t} ${ttag}`;
      if (this.isPenDown()) {
         if (this.TurtleState.drawMode == 'd') {
	    let segment;
	    if (type == 'line') {
	       segment = BABYLON.MeshBuilder.CreateLines('tpath',
                                                         {points: [oldPos, newPos],
                                                          tessellation: 32}, scene);
	       segment.color = this.toColorVector();
	       BABYLON.Tags.AddTagsTo(segment, tag , scene);
	       segment.isVisible = true;


            } else if (type == 'tube') {
               
               segment = BABYLON.MeshBuilder.CreateTube(t, 
                                                        {path: [oldPos, newPos], 
                                                         radius: this.TurtleState.size,
                                                         tessellation: 16,
                                                         updatable: true,
                                                         cap: BABYLON.Mesh.CAP_ALL},
                                                        scene);
               this.meshCount[0]++;
	       segment.isVisible = true;
               segment.material = this.materialList[this.TurtleState.trackMaterial];
               if  (true) {
                  BABYLON.Tags.AddTagsTo(segment, tag, scene);
               } else {
                  if (this.TurtleState.trackMesh == null) {
                     this.TurtleState.trackMesh = segment;
                     this.meshCount[1]++;
                  } else {
                     this.TurtleState.trackMesh = BABYLON.Mesh.MergeMeshes([this.TurtleState.trackMesh, segment],true, true);
                  }
                  this.TurtleState.trackMesh.id = t;
                  this.TurtleState.trackMesh.name = `track${t}`;
                  BABYLON.Tags.AddTagsTo(this.TurtleState.trackMesh, tag, scene);
               }
	    } else if (type == 'ext') {
               let pathpts = [oldPos, newPos];
               let s = t.getSize();
               function getscale(i,distance) {
                  return s;
               }
               function getrotation(i,distance) {
                  return this.TurtleState.accumRoll;
               }

               const segment = BABYLON.MeshBuilder.ExtrudeShapeCustom(t, 
                                                                      {shape: tp.shape, 
                                                                       path: pathpts, 
                                                                       updatable: false, 
                                                                       scaleFunction: getscale, 
                                                                       rotationFunction: getrotation,
                                                                       closePath: true,
                                                                      }); // sideOrientation: BABYLON.Mesh.DOUBLESIDE});
               segment.isVisible=true;
               segment.material = this.materialList[this.TurtleState.trackMaterial];
               BABYLON.Tags.AddTagsTo(segment, tag, scene);
               
               this.TurtleState.accumRoll = 0;
            }
         } else {               // in path mode
            // assuming 'extrusion'
            let tp = this.TurtleState.trackPath;
            tp.points.push(newPos);
            tp.srm.push({s: this.TurtleState.size,
                         r: this.TurtleState.accumRoll,
                         m: this.TurtleState.trackMaterial
                        }); 
            this.TurtleState.accumRoll = 0;
         }
      }
      if (ts) {ts.position = newPos;}
   }

   drawTrack() {
      let t = this.TurtleState.Turtle;
      let tp = this.TurtleState.trackPath;
      if (tp === null || tp.points.length < 2) {
         return;
      }
      var pathpts = tp.points;
      //puts(`trackPath.length: ${pathpts.length}`);
      // puts(pathpts);
      var srm = tp.srm;
      // puts(srm);

      function getscale(i,distance) {
         return srm[i].s;
      }
      function getrotation(i,distance) {
         return srm[i].r;
      }

      const extrusion = BABYLON.MeshBuilder.ExtrudeShapeCustom(t, 
                                                               {shape: tp.shape, 
                                                                path: pathpts, 
                                                                updatable: false, 
                                                                scaleFunction: getscale, 
                                                                rotationFunction: getrotation,
                                                                closePath: true,
                                                               }); // sideOrientation: BABYLON.Mesh.DOUBLESIDE});
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
            // puts(`sm: ${sm}, pi: ${pi}, indexDiff: ${indexDiff}, matIdx: ${matIdx}, runningVcnt: ${runningIndexCnt}`);
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
   }

   newMesh() {
      if (this.TurtleState.trackMesh != null) {
         //this.meshList.push(this.TurtleState.trackMesh);
         this.TurtleState.trackMesh = null;
      }
   }

   home () {
      let tshape = this.TurtleState.turtleShape;
      let oldstate = this.TurtleState;
      let newPos = newV(0, 0, 0);

      this.setPos(newPos);
      this.setH(newV(1, 0, 0));
      this.setU(newV(0, 1, 0));
      this.setL(newV(0, 0, 1));
      if (tshape != "") {        
    	 tshape.position = newPos;
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
      this.TurtleState.accumRoll += angle;
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
   newTrack(udata=null,) {
      this.branchStack.push({tstate: this.getState(), userData: udata});
      let tp = new TrackPath();
      tp.points.push(this.TurtleState.P.clone());
      tp.srm.push({s: this.TurtleState.size, r: this.TurtleState.accumRoll, m: 0})
      
      if (tp.shape != null) {
         this.TurtleState.trackShape = tp.shape;
      } else if (this.TurtleState.trackShape == null) {
         this.TurtleState.trackShape = generateCircle(1);
         tp.shape = this.TurtleState.trackShape;
      }

      this.TurtleState.track = 'ext';
      this.TurtleState.drawMode = 'p';
      this.TurtleState.trackPath = tp;
      //puts(`trackshape is: ${this.TurtleState.trackShape}`);
      //puts(`tp.shape is: ${tp.shape}`);
   }

   endTrack() {
      this.drawTrack();
      const last = this.branchStack.pop();
      this.setState(last.tstate);
      return last.userData;
   }
 
   newPolygon() {
      // save state
   }
   updatePolygon() {
   }
   endPolygon () {
      // restore state
   }
}

Turtle3d.prototype.t3dIDTag=0;    //  a counter for constructing unique tags
Turtle3d.prototype.t3dScene=null;	// ea default scene, once set
Turtle3d.prototype.fd = Turtle3d.prototype.forward;
Turtle3d.prototype.Turtles = null;

function TrackPath(r=0, s=null) {
   if (s == null ) {
      this.shape = generateMint();
   } else {
      this.shape = s;
   }
   this.points=[];
   this.srm = [];               // scale, rotation, material
   this.accumRoll = r;
   this.clone = function () {
      let tpc = new TrackPath(this.accumRoll, this.shape);
      tpc.points = Array.from(this.points);
      tpc.srm = Array.from(this.srm);
      return tpc;
   };
};

function generateCircle(r=1, q=12) {
   var p = [];
   let a = 2*Math.PI/q;         // arc of each section
   for (let i = 0; i < q; i++) {
      let v = newV(r*Math.cos(i*a), r*Math.sin(i*a), 0)
      p.push(clamp(v));
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
// some helper functions
var puts =console.log;
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
