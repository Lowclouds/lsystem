
// const myHeading = document.querySelector('h1');
// myHeading.textContent = 'An L-system interpreter';

var turtleCtrlBtn = document.getElementById('tcbtn');
var turtleInfoBtn = document.getElementById('tinfoctrlbtn');
document.getElementById("turtleinfo").style.display='none'; // turn off turtle info

var showhidebtn = document.getElementById('btn1');
showhidebtn.textContent = "Hide";

var clearbtn = document.getElementById('btn2');
clearbtn.textContent = "Clear";

var homebtn = document.getElementById('btn3');
homebtn.textContent = "Home";

var resetbtn = document.getElementById('btn4');
resetbtn.textContent = "Reset";

var cameraTargetbtn = document.getElementById('btn5');
cameraTargetbtn.textContent = "Look at Turtle"

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
   turtleInfo[idx][1].textContent = vround(t.getPos(),2);
   turtleInfo[idx][2].textContent = vround(t.getH(),2);
   turtleInfo[idx][3].textContent = vround(t.getL(),2);
   turtleInfo[idx][4].textContent = vround(t.getU(),2);
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
                                        cameraHomePosition.clone(), scene);
   camera.setTarget(cameraHomeTarget.clone());
   camera.inputs.addMouseWheel();
   camera.wheelDeltaPercentage = 0.0001;
   //camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y;

   camera.attachControl(canvas, true);

   const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(5, 10, 0));
   // light.intensity = 1.25
   // light.diffuse = new BABYLON.Color3(206/255, 227/255, 240/255);
   // light.groundColor = new BABYLON.Color3(1, 1, 1);

  // scene.ambientColor = new BABYLON.Color3(1, 1, 1);

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

function makeAxes (size=10) {
   var xaxis = BABYLON.Mesh.CreateLines('xaxis',[
      new BABYLON.Vector3(-20,0,0), 
      new BABYLON.Vector3(20,0,0)
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
initCTable(t);
updateTurtleInfo(t,0);
//console.log(t.TurtleState);
// console.log(Turtle3d.prototype.t3dIDTag);
// var t1 =  new Turtle3d();
// console.log(Turtle3d.prototype.t3dIDTag);
// console.log(t1.TurtleState);

makeAxes();
//markSky(t);

 turtleCtrlBtn.addEventListener("click", () => {
    try {
       let tcshown = turtleCtrlBtn.textContent;
       let tall = document.getElementById("turtleall");
       if (tcshown == '>') {
          tall.style.display = '';
          turtleCtrlBtn.textContent = 'v';
       } else {
          tall.style.display = 'none';
          turtleCtrlBtn.textContent = '>';
       }
    } catch (error) {}
 });

 turtleInfoBtn.addEventListener("click", () => {
    try {
       let tcshown = turtleInfoBtn.textContent;
       let tctrls = document.getElementById("turtleinfo");
       if (tcshown == '>') {
          tctrls.style.display = '';
          turtleInfoBtn.textContent = 'v';
       } else {
          tctrls.style.display = 'none';
          turtleInfoBtn.textContent = '>';
       }
    } catch (error) {}
 });














showhidebtn.addEventListener("click", () => {
    try {
        if (t.isShown()) {
           t.hide();
           showhidebtn.textContent = "Show";

           if (t1) {t1.show();}
        } else {
           t.show();
           showhidebtn.textContent = "Hide";

           if (t1) {t1.hide();}
        }
    } catch (error) { }// ignore
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
      t.reset();
      // initCTable(t);
      camera.position.subtractInPlace(camera.position.subtract(cameraHomePosition));
      camera.setTarget(t.getPos());
   } catch (error) {}
});

cameraTargetbtn.addEventListener("click", () => {
   // puts('trying to reset camera');
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
const lsSaveCode = document.getElementById('lsSaveCode');
const lsSaveCodeEnable = document.getElementById('lsSaveCodeEnable');

const lsCode = document.getElementById('lsCode');

lsSrc.placeholder = 'Paste/enter/edit your L-system here';
lsResult.placeholder = 'Empty';

btnParse = document.getElementById('btnParse');
btnRewrite = document.getElementById('btnRewrite');
btnDraw = document.getElementById('btnDraw');
btnRPRD = document.getElementById('btnRPRD');
btnAllTracks = document.getElementById('btnAllTracks');

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
       lsResult.value =listtostr(lsys.Rewrite()); //.toString();
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
   let file;
   if (lsFile.files.item(0) === null) {
      file = 'tmp.ls';
   } else {
      file = lsFile.files.item(0).name;
   }
   if (lsSrc.value != '') {
      puts(`Saving to file: ${file}`);
      var blob = new Blob( [lsSrc.value], {type: "text/plain;charset=utf-8"});
      saveAs.saveAs(blob, file);
   } else {
      puts(`failed saving: ${lsSrce.value} to ${file}`);
   }
}

lsSave.addEventListener("click", saveasLSfile);

lsSaveCode.addEventListener("click", () => {
   let file = 'gencode.js';
   if (lsCode.value != "") {
      var blob = new Blob( [lsCode.value], {type: "text/plain;charset=utf-8"});
      saveAs.saveAs(blob, file);
   };
});

lsSaveCodeEnable.addEventListener("click", () => {
   let cv = lsSaveCodeEnable.textContent;
   if (cv == 'Enable Codegen') {
      codegenOn = true;
      lsSaveCodeEnable.textContent = 'Disable Codegen';
   } else {
      codegenOn = false;
      lsSaveCodeEnable.textContent = 'Enable Codegen';
   }
   lsSaveCode.toggleAttribute('disabled');

});

var codegenOn = false;

var rwresult=null;
var interpOpts=null;
var tracksAlways = false;

btnAllTracks.textContent = 'Tracks Off';

btnDraw.addEventListener("click", () => {
    try {
       turtleInterp(t, lsys, {useTracksAlways: tracksAlways, gencode: codegenOn});
    } catch (error) {puts(error);}
});

btnRPRD.addEventListener("click", () => {
    try {
       /* --------- reparse ---------*/
       lsys = Lsystem.Parse(lsSrc.value);
       lsResult.value = lsys.serialize();
       lsState = 'Parsed';
       /* --------- rewrite ---------*/
       if (lsResult.textContent != 'Empty') {
          lsResult.value = lsys.Rewrite(); //.toString();
          lsState = 'Rewritten';
          /* --------- reset ---------*/
          t.reset();
          //camera.setPosition(new BABYLON.Vector3(2, 5,-10));
          //camera.setTarget(t.getPos());
          /* --------- draw ---------*/
          // t.setHeading([0,1,0]);
          turtleInterp(t, lsys, {useTracksAlways: tracksAlways, gencode: codegenOn});
       }
    } catch (error) {puts(error);}
});

btnAllTracks.addEventListener("click", () => {
   try {
      if (tracksAlways) {
         btnAllTracks.textContent = 'Tracks Off';
      } else {
         btnAllTracks.textContent = 'Tracks On';
      }
      tracksAlways = !tracksAlways;
   } catch (error) {puts(error);}
});
// ------------------------------------------------------------
//  end of UI
// ------------------------------------------------------------
//  begin noodling
// ------------------------------------------------------------
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
   mat.ambientColor = new BABYLON.Color3(0.6,0.83,0.6);
   var amesh = new BABYLON.Mesh("a", scene);
   vertexData.applyToMesh(amesh,true);

   amesh.material = amat;

   return {vdata: vertexData, mat: amat, mesh: amesh};
}

/* --------------------------------------------------------------------------------
   Save mesh to file
   -------------------------------------------------------------------------------- */
var objectUrl;

function downloadMesh(filename, mesh) {
   if (objectUrl) {
      window.URL.revokeObjectURL(objectUrl);
   }

   let options = {
      shouldExportNode: function (node) {
         return node == mesh;
      },
   };

//    BABYLON.GLTF2Export.GLBAsync(scene, "test1", options).then((glb) => {
   BABYLON.GLTF2Export.GLTFAsync(scene, "test1.gltf", options).then((gltf) => {
      gltf.downloadFiles();
   });
   return mesh;

   // var serializedMesh = BABYLON.SceneSerializer.SerializeMesh(mesh);

   // var strMesh = JSON.stringify(serializedMesh);

   // if (filename.toLowerCase().lastIndexOf(".babylon") !== filename.length - 8 || filename.length < 9) {
   //    filename += ".babylon";
   // }

   // var blob = new Blob([strMesh], { type: "octet/stream" });

   // // turn blob into an object URL; saved as a member, so can be cleaned out later
   // objectUrl = (window.webkitURL || window.URL).createObjectURL(blob);

   // var link = window.document.createElement("meshd");
   // link.href = objectUrl;
   // link.download = filename;
   // var click = document.createEvent("MouseEvents");
   // click.initEvent("click", true, false);
   // link.dispatchEvent(click);
}


/* --------------------------------------------------------------------------------
   Read mesh from file
   -------------------------------------------------------------------------------- */

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
