
const myHeading = document.querySelector('h1');
myHeading.textContent = 'An L-system interpreter';

//var button = document.createElement("button");
var showhidebtn = document.getElementById('btn1');
showhidebtn.textContent = "Show/Hide";

var clearbtn = document.getElementById('btn2');
clearbtn.textContent = "Clear";

var homebtn = document.getElementById('btn3');
homebtn.textContent = "Home";

var resetbtn = document.getElementById('btn4');
resetbtn.textContent = "Reset";

var cameraTargetbtn = document.getElementById('btn5');
cameraTargetbtn.textContent = "Camera Lookat Turtle"

var turtleInfo = [
    [document.getElementById('t1'),
     document.getElementById('t1P'),
     document.getElementById('t1H'),
     document.getElementById('t1L'),
     document.getElementById('t1U')],
    [document.getElementById('t2'),
     document.getElementById('t2P'),
     document.getElementById('t2H'),
     document.getElementById('t2L'),
     document.getElementById('t2U')]];

function updateTurtleInfo(t,idx) {
    turtleInfo[idx][0].textContent = t.getTurtle();
    turtleInfo[idx][1].textContent = t.getPos();
    turtleInfo[idx][2].textContent = t.getH();
    turtleInfo[idx][3].textContent = t.getL();
    turtleInfo[idx][4].textContent = t.getU();
}

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const cameraHomePosition = new BABYLON.Vector3(10, 15,-20);
//const cameraHomeDirection = new BABYLON.Vector3(-2, -5, 10);
const cameraHomeTarget = BABYLON.Vector3.Zero();
var camera;

const skysize = 5000;

// Add your code here matching the playground format
const createScene = function () {
    
   const scene = new BABYLON.Scene(engine);  
    
  // const camera = new BABYLON.ArcRotateCamera("Camera",0,0,20, BABYLON.Vector3.Zero(), scene);
  //  camera.setPosition(new BABYLON.Vector3(2, 5,-10));
  //  camera.wheelDeltaPercentage = 0.001;
  //  camera.zoomToMouseLocation = true;
   camera = new BABYLON.UniversalCamera("camera",
                                        cameraHomePosition, scene);
   camera.setTarget(cameraHomeTarget);
   camera.inputs.addMouseWheel();
   camera.wheelDeltaPercentage = 0.0001;
   //camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y;

   camera.attachControl(canvas, true);

   const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 10, 0));
   light.intensity = 1.5;
   light.diffuse = new BABYLON.Color3(206/255, 227/255, 240/255);
   light.groundColor = new BABYLON.Color3(1, 1, 1);
   var ground = BABYLON.MeshBuilder.CreateGround("ground", {width:skysize, height:skysize});
   var gMaterial = new BABYLON.StandardMaterial("gMaterial", scene);
   
   gMaterial.diffuseColor = new BABYLON.Color3(.58, .58, .58);
   ground.material = gMaterial;

   // var  pack = new BABYLON.TexturePacker('TestPack', [], {}, scene);
   // loadTpack(pack,gMaterial);
   
   var skyOpts = {
      diameter: skysize, slice: 0.5, sideOrientation: BABYLON.Mesh.DOUBLESIDE };
   var sky = BABYLON.MeshBuilder.CreateSphere("sky", skyOpts, scene);
   var skyMaterial = new BABYLON.StandardMaterial("skyMaterial", scene);
   skyMaterial.backFaceCulling = false;
   skyMaterial.diffuseColor = new BABYLON.Color3(93/255, 173/255, 220/255); //206/255, 227/255, 240/255);
   skyMaterial.ambientColor = new BABYLON.Color3(206/255, 227/255, 240/255);
   //skyMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
   //sky.emissiveColor = new BABYLON.Color3(255, 255, 255);
   //sky.specularColor = new BABYLON.Color3(206, 227, 240);

   sky.material = skyMaterial;

   return scene;
};

const scene = createScene(); //Call the createScene function

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});

function markSky(t,axis='x', r=skysize/2) {
   var savedState = t.getState();
   let s = 10000,
       len = r * Math.PI/2,
       theta = radtodeg*Math.PI/2;
   len = len/s;
   theta=theta/s;
   puts(`r: ${r}, len: ${len}, theta: ${theta}, s: ${s}`);

   t.setTrack('line');
   t.penUp();
   t.home();
   switch(axis) {
   case 'x': { 
      t.setColor('red'); break; }
   case 'y': {
      t.setColor('yellow'); t.yaw(-90); break; }
   case 'z': {
      t.setColor('blue'); t.yaw(90); break;}
   default: { puts(`unrecognized direction`); break;}
   }
   t.fd(r);
   t.pitch(90 +theta/2);
   t.penDown();
   for (let seg=0; seg < s; seg++) {
      t.fd(len);
      t.pitch(theta);
   }
   
   t.setState(savedState);
}
      

// function makeAxes (t, size=10) {
//    var axes_displayed = true;
//    var savedState = t.getState();
//    var axis = [0, 0,size];;
//    t.setTrack('line');
//    t.setTag('axes');

//    function makeAxis (color) {
//       t.setColor(color);
//       axis = roll(axis);
//       t.penUp();
//       t.home();
//       t.setHeading(axis);
//       t.goto(smult(-1,BABYLON.Vector3.FromArray(axis)));
//       t.penDown();
//       t.fd(2*size);
//       t.pitch(150);
//       t.fd(1); t.fd(-1);
//       t.pitch(60);
//       t.fd(1);
//    }
//    makeAxis('red');
//    makeAxis([0,0.7,0]);
//    makeAxis('blue');

//    t.setState(savedState);
// }

function makeAxes (t, size=10) {
   var xaxis = BABYLON.Mesh.CreateLines('xaxis',[
      new BABYLON.Vector3(-20,0,0), new BABYLON.Vector3(20,0,0)
   ], scene);
   xaxis.color = BABYLON.Color3.Red();
   BABYLON.Tags.AddTagsTo(xaxis, `axes`); 
   var yaxis = BABYLON.Mesh.CreateLines('yaxis', [ 
      new BABYLON.Vector3(0, -20 ,0), new BABYLON.Vector3(0,20,0)
   ] , scene);
   yaxis.color = BABYLON.Color3.Green();
   BABYLON.Tags.AddTagsTo(yaxis, `axes`); 
   var zaxis = BABYLON.Mesh.CreateLines('zaxis',[
      new BABYLON.Vector3(0,0,-20),new BABYLON.Vector3(0, 0, 20)
   ], scene);
   zaxis.color = BABYLON.Color3.Blue();
   BABYLON.Tags.AddTagsTo(zaxis, `axes`); 
}

var t = new Turtle3d(scene);
updateTurtleInfo(t,0);
//console.log(t.TurtleState);
// console.log(Turtle3d.prototype.t3dIDTag);
// var t1 =  new Turtle3d();
// console.log(Turtle3d.prototype.t3dIDTag);
// console.log(t1.TurtleState);

makeAxes(t);
//markSky(t);

showhidebtn.addEventListener("click", () => {
    try {
        if (t.isShown()) {
            t.hide();
            if (t1) {t1.show();}
        } else {
            t.show();
            if (t1) {t1.hide();}
        }
    } catch (error) { }// ignore
    try {
        if (t1.isShown()) {
            t1.hide();
            if (t) {t.show();}
        } else {
            t1.show();
            if (t) {t.hide();}
        }
    } catch (error) {} // ignore
})
clearbtn.addEventListener("click", () => {
    try {
        t.clear();
    } catch (error) {}
    try {
        t1.clear();
    } catch (error) {}
});
homebtn.addEventListener("click", () => {
    try {
       t.home();
       //camera.setTarget(t.getPos());
    } catch (error) {}
    try {
       t1.home();
       //camera.setTarget(t1.getPos());
    } catch (e) {}
});

resetbtn.addEventListener("click", () => {
   try {
      t.home();
      t.clear();
      camera.setPosition(new BABYLON.Vector3(2, 5,-10));
      camera.setTarget(t.getPos());
   } catch (error) {}
});

cameraTargetbtn.addEventListener("click", () => {
   puts('trying to reset camera');
   //       camera.detachControl(canvas);
   //       camera.position(new BABYLON.Vector3(2,5, -10));
   //       camera.cameraDirection(new BABYLON.Vector3(0,0,0));
   //       camera.attachControl(canvas,true);
   camera.setTarget(t.getPos());
});

// var walking = false;
// selectbtn.addEventListener("click", () => {
//    if (! walking ) {
//       let count=0;
//       let tt = new Turtle3d();
//       turtleInfo[1][0].textContent = tt.getTurtle();
//       tt.setColor([0,.6,.8]);
//       function randomWalk() {
//          for (let n=0; n<10; n++) {
//             let choice  = Math.random() * 3;
//             if (choice < 1) {
//                tt.yaw(Math.random()*360);
//             } else if(choice < 2) {
//                tt.pitch(Math.random()*360);
//             } else {
//                tt.roll(Math.random()*360);
//             }
//             tt.fd((Math.random() - 0.5) * 10);
//             count++;
//          }
//          let p = tt.getPos();
//          if (p.length() > 50) {
//             tt.penUp();
//             tt.goto([0,0,0]);
//             tt.penDown();
//             tt.setColor([Math.random(),Math.random(),Math.random()]);
//             turtleInfo[1][1].textContent = count;
            
//          }
//       }
//       scene.registerAfterRender(randomWalk);
//       walking = true;
//    } else {
//       scene.unregisterAfterRender(randomWalk);
//       walking =  false;
//    }
// });


const lsSrc = document.getElementById('lsSrc');
const lsFile = document.getElementById('lsFile');
const lsSave = document.getElementById('lsSave');
const lsResult = document.getElementById('lsResult');

lsSrc.placeholder = 'Paste/enter/edit your L-system here';
lsResult.value = '';
lsResult.placeholder = 'Empty';

btnParse = document.getElementById('btnParse');
btnRewrite = document.getElementById('btnRewrite');
btnDraw = document.getElementById('btnDraw');
btnRPRD = document.getElementById('btnRPRD');

lblNumNodes = document.getElementById('numNodes');
lblNumDrawn = document.getElementById('numDrawn');

var lsState = 'Start';
var lsys; // = new Lsystem();

btnParse.onclick = function() {
   let spec = lsSrc.value;
   lsys = Lsystem.Parse(spec);
   lsResult.value = lsys.serialize();
   lsState = 'Parsed';          // unused
}

// btnCpp.onclick = function() {
//    if (lsState != 'Start') {
//       if (btnCpp.textContent == 'Show CPP') {
//          lsResult.value = lsys.spec;
//          btnCpp.textContent = 'Show Parse';
//       } else {
//          lsResult.value = lsys.serialize();
//          btnCpp.textContent = 'Show CPP';
//       }
//    }
// }

btnRewrite.onclick = function() {
    if (lsys && lsResult.textContent != 'Empty') {
	lsResult.value = lsys.Rewrite(); //.toString();
	lsState = 'Rewritten';
    }
}

function loadLSfile(event) {
    let file = lsFile.files.item(0);
    if (file != null) {
	let reader = new FileReader();
	
	reader.onload = function() {
	   lsSrc.value = reader.result;
	   //lsResult.value = '';
	   lsState='Start';
           // btnCpp.textContent = 'Show CPP';
	}
	reader.readAsText(file);
    }
}

lsFile.onchange = loadLSfile;

function saveasLSfile(event) {
   let file = lsFile.files.item(0).name;
   if (lsSrc.value != '') {
      puts(`Saving to file: ${file}`);
      var blob = new Blob( [lsSrc.value], {type: "text/plain;charset=utf-8"});
      saveAs.saveAs(blob, file);
   } else {
      puts(`failed saving: ${lsSrce.value} to ${file}`);
   }
}

lsSave.addEventListener("click", saveasLSfile);

var rwresult=null;
btnDraw.addEventListener("click", () => {
    try {
        t.setHeading([0,1,0]);
        turtleInterp(t, lsys);
    } catch (error) {puts(error);}
});

btnRPRD.addEventListener("click", () => {
    try {
       // reparse
       lsys = Lsystem.Parse(spec);
       lsResult.value = lsys.serialize();
       lsState = 'Parsed';
       // rewrite
       if (lsResult.textContent != 'Empty') {
          lsResult.value = lsys.Rewrite(); //.toString();
          lsState = 'Rewritten';
          // reset
          t.home();
          t.clear();
          //camera.setPosition(new BABYLON.Vector3(2, 5,-10));
          camera.setTarget(t.getPos());
          // draw
          t.setHeading([0,1,0]);
          turtleInterp(t, lsys);
       }

    } catch (error) {puts(error);}
});

var colorTableDefault = initCTable();
t.deleteMaterials();
let numMat = t.materialList.length;
colorTableDefault.forEach((e) => {
   t.addMaterial(null, e);
   //puts(`add material w/color: ${e}`);
}); 
t.setMaterial(1);

var interpdata = {
   step:  1,
   stemsize: 0.05,
   delta: 90,
   ndelta: -90,
   stack: [],
   ci: 0,                       // color index
   notInPolygon: true,
   mi: 0,                       // module index
   ctable:  colorTableDefault,
   cpoly: null
}

function interpdataShow() {
   return `step: ${interpdata.step}, stemsize: ${interpdata.stemsize}, delta: ${interpdata.delta}`;
}

// This links the lsystem generator with turtle graphics

function turtleInterp (ti, ls, opts=null) {
   idata = {
      step:  1,
      stemsize: 1,
      delta: 90,
      ndelta: -90,
      stack: [],
      ci: 0,                       // color index
      inPolygon: 0,                // not
      mi: 0,                       // module index
      //ctable:  [[0.64, 0.27, 0.27], [0,.8, .8]],       // brownish, greenish
      ctable: colorTableDefault,
      cpoly: null
   }
   idata.show =  function () {
      return `step: ${this.step}, stemsize: ${this.stemsize}, delta: ${this.delta}`;
   }

   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      if (ls.hasOwnProperty(p)) {
         switch (p) {
         case 'step': {idata.step = ls.step; break;}
         case 'stemsize': {idata.stemsize = ls.stemsize; break;}
         case 'delta': {idata.delta = ls.delta; break;}
         case 'ctable': {idata.ctable = ls.ctable; puts("set ctable data"); break;}
         }
         puts(`set ${idata[p]} to ${ls.ctable}`);
      }
   }
   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      puts(`checking for var ${p}`);
      if (ls.vars.has(p)) {
         switch (p) {
         case 'step': {idata.step = ls.vars.get(p); break;}
         case 'stemsize': {idata.stemsize = ls.vars.get(p); break;}
         case 'delta': {idata.delta = ls.vars.get(p); puts("set stemsize"); break;}
         case 'ctable': {idata.ctable = ls.vars.get(p); puts("set ctable data"); break;}
         }
         puts(`set ${idata[p]} to ${ls.vars.get(p)}`);
      }
   }

   if (opts != null) {
      for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
         puts(`checking for opts[${p}]`);
         if (opts.hasOwnProperty(p)) {
            switch (p) {
            case 'step': {idata.step = opts[p]; break;}
            case 'stemsize': {idata.stemsize = opts[p]; break;}
            case 'delta': {idata.delta = opts[p]; puts("set stemsize"); break;}
            case 'ctable': {idata.ctable = opts[p]; puts("set ctable data:" + opts[p]); break;}
            }
            puts(`set ${idata[p]} to ${opts[p]}`);
         }
      }
   }
   idata.ndelta= -1*idata.delta,
   ti.setSize(idata.stemsize);
   if (idata.ctable != null && idata.ctable != []) {
      ti.deleteMaterials();
      let numMat = ti.materialList.length;
      idata.ctable.forEach((e) => {
         ti.addMaterial(null, e);
         puts(`add material w/color: ${e}`);
      }); 
      ti.setMaterial(1);
      puts(`set ${ti.getTurtle()} material to idx ${numMat}, color ${ti.getColor()}`);
   }
   ti.hide();
   ti.penDown();
   branchstack = [];
   polygonstack = [];
   let tree = ls.current;
   puts(`lsystem has ${tree.length} modules`);
   puts(`using settings: ` + idata.show());

   function doModule () {
      let i;
      let isPM = false;
      
      for (i=idata.mi; i < Math.min(tree.length, idata.mi+2000); i++) {
         let pM = tree[i];
         //puts(pM.toString());
         //puts(ti.getPos());
         let m;
         let pmArg, p0;         // most functions have only one parameter
         if (typeof pM == 'string') {
            m = pM
            pmArg=null;
            isPm = false;
         } else {
            m = pM.m;
            p0 = pM.p[0];
            isPm = true;
         }
         switch (m) {
         case 'F': {
            let d = isPm ? p0 : idata.step;
            ti.penDown();
            ti.forward(d);
            if (idata.inPolygon>0) {
               ti.updatePolygon();
            }
            //puts('fd: ' + d);
            break;
         }
         case 'f': {
            let d = isPm ? p0 : idata.step;
            let pState = ti.isPenDown();
            if (pState) {
               ti.penUp();
            }
	    ti.forward(d); 
            if (idata.inPolygon>0) {
               ti.updatePolygon();
            }
            if (pState) {
               ti.penDown();
            }
            break;
         }
         case 'G': {
            let d = isPm ? p0 : idata.step;
            ti.penDown();
            ti.forward(d);
            puts('Gfd: ' + d);
            break;
         }
         case 'g': {
            let d = isPm ? p0 : idata.step;
            ti.penUp();
	    ti.forward(d); 
            ti.penDown();
            puts('gfd: ' + d);
            break;
         }
         case '+': {            // yaw left
            let a = isPm ? p0 : idata.delta;
            ti.yaw(a);
            // puts('yaw: ' + a);
            break; }
         case '-': {            // yaw right
            let a = -1*(isPm ? p0 : idata.delta);
            ti.yaw(a);
            // puts('yaw: ' + a);
            break; }
         case '&': {            // pitch down
            let a = -1*(isPm ? p0 : idata.delta);
            ti.pitch(a);
            //puts('pitch: ' + a);
            break; }
         case '^': {            // pitch up
            let a = isPm ? p0 : idata.delta;
            ti.pitch(a);
            //puts('pitch: ' + a);
            break; }
         case '\\': {           // roll left
            let a = isPm ? p0 : idata.delta;
            ti.roll(a);
            //puts('roll: ' + a);
            break; }
         case '/': {            // roll right
            let a = -1*(isPm ? p0 : idata.delta);
            ti.roll(a); 
            //puts('roll: ' + a);
            break; }
         case '|': {
            ti.yaw(180); 
            break;
         }
         case '@v': {            // set L horizontal
            ti.levelL();
            break;
         }   
         case '!': {   // decrease or set stem/branch size
            if (isPm ) {
               idata.stemsize = p0;
            } else {
               idata.stemsize -= idata.stemsize > 1 ? 1 : 0;
            }
            //puts(`set stemsize to: ${idata.stemsize}`);
            ti.setSize(idata.stemsize);
            break;
         }
         case '#': {    // increase or set stem/branch size
            if (isPm ) {
               idata.stemsize = p0;
            } else {
               idata.stemsize += 1;
            }
            //puts(`set stemsize to: ${idata.stemsize}`);
            ti.setSize(idata.stemsize);
            break;
         }
         case "'": {            // increment color table index
            let mi = ti.getMaterialIdx()
            mi--;
            ti.setMaterial(mi); // 
            // idata.ci %= idata.ctable.length;
            // ti.setColor(idata.ctable[idata.ci]);
            break;
         }
         case ';': {
            let mi;
            if (isPm) {
               mi = p0;
            } else { 
               mi = t.getMaterialIdx();
               mi++;
            }
            ti.setMaterial(mi);
            break;
         }
         case '\[': {           // start a branch
            ti.newTrack({ci: idata.ci, st: idata.st});
            // ti.newMesh();
            // let s = ti.getState();
            // branchstack.push([s, idata.ci, idata.stemsize]); break;}
            break;
         }
         case '\]': {           // end a branch
            //  let s = branchstack.pop();
            let s = ti.endTrack();
            idata.ci = ti.trackMaterial;
	    idata.stemsize = ti.getSize();
            break;
         }
         case '{': {
            idata.inPolygon++;
            ti.newPolygon();
            idata.cpoly = [];
            break;}
         case '}': {
            if ( idata.inPolygon > 0) {
               ti.endPolygon();
               idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon-- : 0;
            } else {
               puts('end polygon attempted when no polygon started');
            }
            break;
         }
         case '.': {            // record a polygon point
           // idata.cpoly.push(otoa(ti.getPos()));
            if (idata.inPolygon>0) {
               ti.updatePolygon();
            }
            //puts(`save state in polygon mode: ${ti.getPos()}`)
            break;
         }
         case '$': {
            
            break;
         }
         case 'A':
         case 'S':
         case 'L': break;
         default: {}//puts(`no Action for module ${i}: ${m}`);}
         }
      }
      //updateTurtleInfo(t,0);
      lblNumDrawn.textContent=i;
      if (i < tree.length) {
         idata.mi = i;
         rAF = requestAnimationFrame(doModule); 

         // if (i % 2500 != 0) {
         //    setTimeout(doModule,1000);  
         // } else {
         //    setTimeout(doModule,100);
         // }
      } else {
         if (ti.branchStack.length > 0) {
            let ts = ti.getState()
            puts(' done with tree');
            puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`);
            //   puts(`tp.shape is: ${ti.getState().trackPath.shape}`);
            ti.endTrack();
         }

         updateTurtleInfo(ti,0);
         lblNumDrawn.backgroundColor = "green";
      }
   }

   ti.newTrack();
   let ts = ti.getState()
   puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`);

   doModule();

  // for (const m of ls.current) {
  //   if (idata.mi % 500 == 0) {puts(`${idata.mi} of ${ls.current.length}`);}
  //   idata = await doModule(t,m,idata);
  //   idata.mi++;
  // }
}

function otoa (o) {
   let a = new Array();
   a.push(o.x); a.push(o.y); a.push(o.z);
   return a;
}
function roll(a) { a.unshift(a.pop()); return a;}

function crand() {return new BABYLON.Color3(math.random(), math.random(),math.random())}

function polyTrace(t, ipoly, size=0.1, idelay=0.02) {
   function Tracer(t, ipoly) {
      var turtle = t,
          poly = ipoly,
          i = 0,
          oldstate = t.getState();

      function tr () {
         if (i >= poly.length) {
            clearInterval(this.timerID);
            turtle.setColor('red');
            turtle.goto(poly[0]);
            turtle.setState(oldstate);
            return;
         } else {
            turtle.goto(poly[i]);
            i++;
         }
      }
      this.trace  = tr.bind(this);
      this.timerID =  null;

   }
   var tracer = new Tracer(t, ipoly);
   t.setSize(size);
   t.setColor('black');
   t.penUp();
   t.goto(ipoly[0]);
   t.penDown();
   tracer.timerID = setInterval(tracer.trace, idelay*1000);
}

function outliner(t, ipoly, size=0.1, idelay=0.5) {
   function f(i) {
      if (i >= this.poly.length) {
         
         this.turtle.goto(this.poly[0]);
         this.turtle.setState(this.oldstate);
         return;
      } 
      this.turtle.goto(this.poly[i]);
      puts(`waiting ${i}th time`);
      setTimeout(this.outline, this.delay*1000, i+1);
   }
   const bundle = {
      turtle: t,
      poly: ipoly,
      delay: idelay,
      oldstate: null,
      timerID: null,
   }
   bundle.outline = f.bind(bundle);
   bundle.oldstate=t.getState(),
   t.setSize(size);
   t.setColor('black');
   t.penUp();
   t.goto(poly[0]);
   t.penDown();
   setTimeout(bundle.outline,0,1);
}

function showtriangles( t, poly, alg="d",size=0.1) {
   let verts, tri;
   if (alg == 'e') {
      verts=earcut.flatten([poly]);
      tri = earcut(verts.vertices, verts.holes, verts.dimensions);
   } else {
      tri = Delaunator.from(poly).triangles;
   }
   let oldstate = t.getState();
   t.setSize(size);
   t.setColor(crand());
   for( let tr=0; tr< tri.length/3; tr++) {
      puts(`triangle: ${tr} at ${tri[3*tr]}:${poly[tri[3*tr]]}`);
      t.penUp();
      t.goto(poly[tri[3*tr]]); 
      t.penDown(); 
      t.goto(poly[tri[3*tr+1]]); 
      t.goto(poly[tri[3*tr+2]]);
      t.goto(poly[tri[3*tr]]); 
   }
   t.setState(oldstate);
   return tri;
}

function createMesh(poly) {
   var vertexData = new BABYLON.VertexData();
   var everts = earcut.flatten([poly]);
   var verts = earcut(everts.vertices, everts.holes, 3);
   vertexData.positions = everts.vertices;
   vertexData.indices = verts;
   vertexData.normals = [];
   BABYLON.VertexData.ComputeNormals(everts.vertices, verts, vertexData.normals);

   var amat = new BABYLON.StandardMaterial("a", scene);
   mat.backFaceCulling = false;
   mat.diffuseColor = new BABYLON.Color3(0.6,0.83,0.6);
   var amesh = new BABYLON.Mesh("a", scene);
   vertexData.applyToMesh(amesh,true);

   amesh.material = amat;

   return {vdata: vertexData, mat: amat, mesh: amesh};
}


function loadTpack(pack, mat) {
   
    let getJson = new XMLHttpRequest();
    getJson.onreadystatechange = () => {
        if (getJson.readyState == 4) {
            if (getJson.status == 200) {
               pack.updateFromJSON( getJson.responseText )
               let packMat = new BABYLON.StandardMaterial('packMat', scene )
               mat.material = packMat;        
               pack.setMeshToFrame(mat, 2, true) 
            }
        }
    }
    getJson.open("GET", './images/TestPack_texurePackage.json');
    getJson.send();
}
