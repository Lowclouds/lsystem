// Myheading.textContent = 'An L-system interpreter';

var turtleCtrlBtn = document.getElementById('tcbtn');
var turtleInfoBtn = document.getElementById('tinfoctrlbtn');
turtleInfoBtn.textContent = ">";
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

var drawSpeedCtrl = document.getElementById('drawspeed');
drawSpeedCtrl.value = 200;

drawSpeedCtrl.addEventListener('input', () => {
   drawSpeedCtrl.checkValidity();
});

drawSpeedCtrl.addEventListener('invalid', () => {
   let max = Number(drawSpeedCtrl.getAttribute('max'));
   let min = Number(drawSpeedCtrl.getAttribute('min'));
   if (drawSpeedCtrl.value > max) {
      drawSpeedCtrl.value = max;
   } else if (drawSpeedCtrl.value < min) {
      drawSpeedCtrl.value = min;
   }
});

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
      Turtle3d.clearTracksByTag('lsystem');
      t1.clear();
   } catch (error) {}
});

homebtn.addEventListener("click", () => {
   try {
      t.home();
   } catch (error) {}
   try {
      t1.home();
   } catch (e) {}
});

resetbtn.addEventListener("click", () => {
   try {
      Turtle3d.clearTracksByTag('lsystem');
      t.reset(true);
      // initCtable(t);
      camera.position.subtractInPlace(camera.position.subtract(cameraHomePosition));
      camera.setTarget(t.getPos());
   } catch (error) {}
});


var showColorTablebtn= document.getElementById('btn6');
showColorTablebtn.textContent = 'Show Color Table';

cameraTargetbtn.addEventListener("click", () => {
   camera.setTarget(t.getPos());
});

showColorTablebtn.addEventListener("click", () => {
   let tracks = t.getColorTableMeshes();
   if (tracks.length == 0) {
      showColorTable(t);
      showColorTablebtn.textContent = 'Hide Color Table';
   } else {
      let toggle = ! tracks[0].isVisible;
      tracks.forEach(m => m.isVisible = toggle);
      if (toggle) {
         showColorTablebtn.textContent = 'Hide Color Table';
      } else {
         showColorTablebtn.textContent = 'Show Color Table';
      }
   }
});


/* -------------- end of turtle controls ----------------------- */
/* --------------start of lsystem controls --------------------- */
const lsSrc = document.getElementById('lsSrc');
const lsFile = document.getElementById('lsFile');
const lsSave = document.getElementById('lsSave');
const lsResult = document.getElementById('lsResult');
const lsSaveCode = document.getElementById('lsSaveCode');
const lsSaveCodeEnable = document.getElementById('lsSaveCodeEnable');

const lsCode = document.getElementById('lsCode');

lsSrc.placeholder = 'Paste/enter/edit your L-system here';
lsResult.placeholder = 'Empty';

const btnParse = document.getElementById('btnParse');
const btnRewrite = document.getElementById('btnRewrite');
const btnDraw = document.getElementById('btnDraw');
const btnRPRD = document.getElementById('btnRPRD');
//const btnAllTracks = document.getElementById('btnAllTracks');
const btnSingleStep =  document.getElementById('btnSingleStep');
//const btnAnimate =  document.getElementById('btnAnimate');
const btnMSave = document.getElementById('btnMSave');
const btnMT = document.getElementById('btnMT');
btnMT.checked = true;
btnMT.addEventListener('input', () => {
   puts('btnMT toggled');
   interpOpts.useMT = btnMT.checked;
});

const lblNumIterations = document.getElementById('numIterations');
const lblNumNodes = document.getElementById('numNodes');
const lblNumDrawn = document.getElementById('numDrawn');

var animationState =  {stepStart: false};
function uiDoParse () {
   let ipromise = new Promise((resolve, reject) => {
      let spec = lsSrc.value;
      lblNumIterations.textContent = 0;
      lblNumNodes.textContent = 0;
      lblNumDrawn.textContent = 0;
      lblNumDrawn.style.backgroundColor = 'lightgray';
      try {
         lsys = Lsystem.Parse(spec);
         lsResult.value = lsys.serialize();
         animationState.stepStart = false;
         resolve(true)
      } catch(error) {
         lsResult.value = `Parse failed: ${error}`;
         reject(error);
      }
   });
   return ipromise;
}

function uiDoRewrite() {
   let ipromise = new Promise((resolve,reject) => {
      if (lsys && lsResult.textContent != 'Empty') {
         try {
            lsResult.value =listtostr(lsys.Rewrite()); //.toString();
            lblNumIterations.textContent = lsys.dDone;
            lblNumNodes.textContent=lsys.current.length;
            lblNumDrawn.textContent=0;
            resolve(true);
         } catch (error) {
            lsResult.value = `Rewrite failed: ${error}`;
            reject(`Rewrite failed: ${error}`);
         }
      } else {
         resolve(true);
      }
      lblNumIterations.textContent = lsys.dDone;
      lblNumNodes.textContent=lsys.current.length;
      lblNumDrawn.textContent=0;
      animationState.stepStart = true;
   });
   return ipromise;
}

var interpOpts = {gencode: false, miCount: drawSpeedCtrl.value, useMT: btnMT.checked};

function uiDoDraw () {
   let ipromise = new Promise((resolve,reject) => {
      try {
         btnMSave.disabled = true;
         btnDraw.disabled = true;
         btnRPRD.disabled = true;
         interpOpts.miCount = drawSpeedCtrl.value;
         turtleInterp(t, lsys, interpOpts)
            .then(value => {
               if (Turtle3d.getTracksByTag('lsystem').length == 0) {
                  btnMSave.disabled = true;
               } else {
                  btnMSave.disabled = false;
               }
               btnDraw.disabled = false;
               btnRPRD.disabled = false;
               t.show();
               resolve(true);
            }).catch(error => {
               puts(error);
               btnMSave.disabled = true;
               btnDraw.disabled = false;
               btnRPRD.disabled = false;
               t.show();
               reject(error);
     })
      } catch (error) {
         puts(error);
         if (Turtle3d.getTracksByTag('lsystem').length == 0) {
            btnMSave.disabled = true;
            btnRPRD.disabled = false;
            btnDraw.disabled = false;
            t.show();
            reject(error);
         }
      }
   });
   return ipromise;
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
   if (cv == 'Gen Code') {
      codegenOn = true;
      interpOpts.gencode = true;
      lsSaveCodeEnable.textContent = 'No Code';
   } else {
      codegenOn = false;
      interpOpts.gencode = false;
      lsSaveCodeEnable.textContent = 'Gen Code';
   }
   lsSaveCode.toggleAttribute('disabled');

});


btnParse.onclick = function() {
   uiDoParse();
}

btnRewrite.onclick = function() {
   uiDoRewrite();
}

btnDraw.addEventListener("click", function () {
   uiDoDraw();
});

btnRPRD.addEventListener("click", () => {
   /* --------- reparse ---------*/
   uiDoParse()
      .then(value => {
         /* --------- rewrite ---------*/
         uiDoRewrite()
            .then (value => {
               /* --------- reset ---------*/
               t.reset(true);
               Turtle3d.clearTracksByTag('lsystem');
               /* --------- draw ---------*/
               uiDoDraw();
            });
      }).catch (error => {puts(error);});
});


btnSingleStep.addEventListener('click', ()=> {
   if (lsys && lsys.axiom.length != 0) {
      try {
         let str;
         let doRewrite = true;
         if (lsys.dDone == 0) {
            if (! animationState.stepStart) {
               animationState.stepStart = true;
               lsys.current = lsys.axiom.slice();
               doRewrite = false;
            } else  {
               str = lsys.axiom;
            }
         } else {
            str = lsys.current;
         }
         if (doRewrite) {
            lsResult.value =listtostr(lsys.Rewrite(lsys, 1, str)); //.toString();
         } else {
            lsResult.value = listtostr(lsys.axiom);
         }
         lblNumIterations.textContent = lsys.dDone;
         lblNumNodes.textContent=lsys.current.length;
         lblNumDrawn.textContent=0;
         Turtle3d.clearTracksByTag('lsystem');
         t.reset(true);
         uiDoDraw();
//       resolve(true);
      } catch (error) {
         lsResult.value = `Rewrite failed: ${error}`;
//       reject(`Rewrite failed: ${error}`);
      }
   } else {
      if (!lsys) {
         lsResult.value = 'Lsystem undefined: load or enter one and click parse';
      } else {
         lsResult.value = 'Lsystem axiom is empty: nothing to do';
      }
   }
});

// btnAnimate.addEventListener('click', ()=> {
//    if (lsys && lsys.axiom.length != 0) {
//       let str;
//       try {
//          if (lsys.dDone == 0) {
//             if (! animationState.stepStart) {
//                animationState.stepStart = true;
//                lsResult.value = listtostr(lsys.axiom);
//                lblNumIterations.textContent = 0;
//                lblNumDrawn.textContent=0;
//                lblNumNodes.textContent=lsys.axiom.length;
//                return;
//             } else  {
//                str = lsys.axiom;
//             }
//          } else {
//             str = lsys.current;
//          }
//          lsResult.value =listtostr(lsys.Rewrite(lsys, 1, str)); //.toString();
//          lblNumIterations.textContent = lsys.dDone;
//          lblNumNodes.textContent=lsys.current.length;
//          lblNumDrawn.textContent=0;
//          Turtle3d.clearTracksByTag('lsystem');
//          t.reset();
//          uiDoDraw();
// //       resolve(true);
//       } catch (error) {
//          lsResult.value = `Rewrite failed: ${error}`;
// //       reject(`Rewrite failed: ${error}`);
//       }
//    } else {
//       if (!lsys) {
//          lsResult.value = 'Lsystem undefined: load or enter one and click parse';
//       } else {
//          lsResult.value = 'Lsystem axiom is empty: nothing to do';
//       }
//    }
// });

btnMSave.toggleAttribute('disabled');
btnMSave.addEventListener("click", () => {
   let meshes =Turtle3d.getTracksByTag('lsystem'); // t.getTrackMeshes();
   if (meshes.length) {
      let fname = "lsys";
      puts("saving some meshes");
      saveLsystemMeshes(fname, meshes);
   } else {
      puts('No meshes to save');
   }
});

/* --------------------------------------------------------------------------------
   Save mesh to file
   -------------------------------------------------------------------------------- */

function saveLsystemMeshes(filename, meshes) {
   
   let mlist = meshes;
   let options = {
      shouldExportNode: function (node) {
         let ok = mlist.includes(node);
         if (ok) {
            puts(`ok with ${node.id}/${node.name}`);
         }
         return ok;
      },
   };
   
   // BABYLON.GLTF2Export.GLBAsync(scene, filename, options).then((glb) => {
   //    glb.downloadFiles();
   // });
   BABYLON.GLTF2Export.GLTFAsync(scene, filename, options).then((gltf) => {
     gltf.downloadFiles();
   });
}

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const cameraHomePosition = new BABYLON.Vector3(35, 10 ,-5);
const cameraHomeTarget = BABYLON.Vector3.Zero();
var camera;
var light;
const skysize = 5000;

// Add your code here matching the playground format
const createScene = function () {
   
   const scene = new BABYLON.Scene(engine);  
   
   camera = new BABYLON.UniversalCamera("camera", cameraHomePosition.clone(), scene);
   camera.setTarget(cameraHomeTarget.clone());
   camera.inputs.addMouseWheel();
   camera.wheelDeltaPercentage = 0.0001;
   //camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y;

   camera.attachControl(canvas, true);

   const light0 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));
   light0.intensity = 1.5;
   const light1 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0));
   light1.intensity = 0.7;

   // light.diffuse = new BABYLON.Color3(206/255, 227/255, 240/255);
   // light.groundColor = new BABYLON.Color3(1, 1, 1);
   // scene.ambientColor = new BABYLON.Color3(1, 1, 1);

   var ground = BABYLON.MeshBuilder.CreateGround("ground", {width:skysize, height:skysize});
   //ground.position.y = -1;
   var gmaterial = new BABYLON.StandardMaterial("gmaterial", scene);
   var gtexture = new BABYLON.GrassProceduralTexture('grass', 256, scene, {groundColor: new BABYLON.Vector3(0.8,0.6,0.50), grassColor: newV(.9,.0,.0)});
   gtexture.grassColor = newV(.8,.0,.0);
   gmaterial.ambientTexture = gtexture;
   gmaterial.diffuseColor = new BABYLON.Color3(.8, .6, .5);
   ground.material = gmaterial;

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

makeAxes();

//Turtle3d.initColorTable();
var t = new Turtle3d(scene);
//Turtle3d.initCTable(t);
updateTurtleInfo(t,0);

//console.log(t.TurtleState);
// console.log(Turtle3d.prototype.t3dIDTag);
// var t1 =  new Turtle3d();
// console.log(Turtle3d.prototype.t3dIDTag);
// console.log(t1.TurtleState);


//markSky(t);



var lsState = 'Start';
var lsys; // = new Lsystem();

var codegenOn = false;
var rwresult=null;
var tracksAlways = false;

// btnAllTracks.textContent = 'Tracks Off';
// btnAllTracks.addEventListener("click", () => {
//    try {
//       if (tracksAlways) {
//          btnAllTracks.textContent = 'Tracks Off';
//       } else {
//          btnAllTracks.textContent = 'Tracks On';
//       }
//       tracksAlways = !tracksAlways;
//    } catch (error) {puts(error);}
// });



// load an example file
fetch('./tests/3d-a3.ls')
   .then( response => {
      if (! response.ok) {
         throw new Error(`${response.status}`);
      }
      return response.text();
   })
   .then(text => {
      lsSrc.value = text;
      lsys = Lsystem.Parse(lsSrc.value);
      lsResult.value = lsys.serialize();
      lsState = 'Parsed';
      if (lsResult.textContent != 'Empty') {
      uiDoRewrite()
         .then(value => {
            //lsResult.value = lsys.Rewrite(); //.toString();
               /* --------- reset ---------*/
               t.reset();
               /* --------- draw ---------*/
               turtleInterp(t, lsys, interpOpts)
               .then(value => {
                  btnMSave.disabled = false;
                  t.show();
               }).catch(error => {
                  puts(error);
                  btnMSave.disabled = true;
                  t.show();
               })
         });
      }
   })
   .catch(error => lsSrc.textContent = `couldn't load example: ${error}`);

// ------------------------------------------------------------
//  end of UI
// ------------------------------------------------------------
//  begin noodling
// ------------------------------------------------------------
function loadUserCode(event) {
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



function createScriptElement(stxt) {
   if (document.createElement && document.getElementsByTagName) {
      var head_tag = document.getElementsByTagName('head')[0];
      var script_tag = document.createElement('script');
      var script_text = document.createTextNode(stxt);
      script_tag.setAttribute('type', 'text/javascript');
      script_tag.appendChild(script_text);
      //script_tag.setAttribute('src', src);
      head_tag.appendChild(script_tag);
   }
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
   mat.ambientColor = new BABYLON.Color3(0.6,0.83,0.6);
   var amesh = new BABYLON.Mesh("a", scene);
   vertexData.applyToMesh(amesh,true);

   amesh.material = amat;

   return {vdata: vertexData, mat: amat, mesh: amesh};
}


   // var objectUrl;

   // if (objectUrl) {
   //    window.URL.revokeObjectURL(objectUrl);
   // }
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

    // let  assetsManager = new BABYLON.AssetsManager(scene);  

    // //called when a single task has been sucessfull
    // assetsManager.onTaskSuccessObservable.add(function(task) {

    //    // var mesh = task.loadedMeshes[0]; //will hold the mesh that has been loaded recently
    //     console.log('task successful', task);
    // });

    // assetsManager.onTaskErrorObservable.add(function(task) {
    //     console.log('task failed', task.errorObject.message, task.errorObject.exception);
    // });

    // var loadButton = document.getElementById('loadFile');

    // loadButton.onchange = function(evt){

    //     var files = evt.target.files;
    //     var filename = files[0].name;
    //     var blob = new Blob([files[0]]);

    //     BABYLON.FilesInput.FilesToLoad[filename] = blob;
        
    //     assetsManager.addMeshTask(name, "", "file:", filename);
    //     assetsManager.load();
    // }; 
