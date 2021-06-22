const myHeading = document.querySelector('h1');
myHeading.textContent = 'An L-system interpreter';

//var button = document.createElement("button");
var showhidebtn = document.getElementById('btn1');
showhidebtn.textContent = "Show/Hide";

var clearbtn = document.getElementById('btn2');
clearbtn.textContent = "Clear";

var homebtn = document.getElementById('btn3');
homebtn.textContent = "Home";

var selectbtn = document.getElementById('btn4');
selectbtn.textContent = "ActiveTurtle";

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

// Add your code here matching the playground format
const createScene = function () {
    
    const scene = new BABYLON.Scene(engine);  
    
    const camera = new BABYLON.ArcRotateCamera("Camera",0,0,20, BABYLON.Vector3.Zero(), scene);
    camera.setPosition(new BABYLON.Vector3(2, 5,-10));
    //camera.zoomToMouseLocation= false;
    camera.wheelDeltaPercentage = 0.001;
    //const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 1, new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(5, 5, 10));
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width:20, height:20});
    var gMaterial = new BABYLON.StandardMaterial("gMaterial", scene);
    
    gMaterial.diffuseColor = new BABYLON.Color3(.1, .8, .2);
    ground.material = gMaterial;
    
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

function make_axes () {
    var axes_displayed = true;
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

make_axes();

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
    } catch (error) {}
    try {
        t1.home();
    } catch (e) {}
});

var walking = false;
selectbtn.addEventListener("click", () => {
   if (! walking ) {
      let count=0;
      let tt = new Turtle3d();
      turtleInfo[1][0].textContent = tt.getTurtle();
      tt.setColor([0,.6,.8]);
      function randomWalk() {
         for (let n=0; n<10; n++) {
            let choice  = Math.random() * 3;
            if (choice < 1) {
               tt.yaw(Math.random()*360);
            } else if(choice < 2) {
               tt.pitch(Math.random()*360);
            } else {
               tt.roll(Math.random()*360);
            }
            tt.fd((Math.random() - 0.5) * 10);
            count++;
         }
         let p = tt.getPos();
         if (p.length() > 50) {
            tt.penUp();
            tt.goto([0,0,0]);
            tt.penDown();
            tt.setColor([Math.random(),Math.random(),Math.random()]);
            turtleInfo[1][1].textContent = count;
            
         }
      }
      scene.registerAfterRender(randomWalk);
      walking = true;
   } else {
      scene.unregisterAfterRender(randomWalk);
      walking =  false;
   }
});

function doRandomWalk () {
}


const lsSrc = document.getElementById('lsSrc');
const lsFile = document.getElementById('lsFile');
const lsResult = document.getElementById('lsResult');

lsSrc.value = 'Paste/enter/edit your L-system here';
lsResult.value = 'Empty';

btnParse = document.getElementById('btnParse');
btnRewrite = document.getElementById('btnRewrite');
btnDraw = document.getElementById('btnDraw');

lblNumNodes = document.getElementById('numNodes');
lblNumDrawn = document.getElementById('numDrawn');

var lsState = 'Start';
var ls;

btnParse.onclick = function() {
    ls.Parse(lsSrc.value);
    lsResult.value = ls.serialize();
    lsState = 'Parsed';
}

btnRewrite.onclick = function() {
    if (lsResult.textContent != 'Empty') {
        lsResult.value = ls.Rewrite(); //.toString();
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
            lsState='Loaded';
        }
        reader.readAsText(file);
    }
}



lsFile.onchange = loadLSfile;
var rwresult=null;
btnDraw.addEventListener("click", () => {
    try {
        t.setHeading([0,1,0]);
        turtleInterp(t, ls);
    } catch (error) {puts(error);}
});

ls = new Lsystem();


function turtleInterp (t, ls, ...args) {
   var rwdata = {
      step:  1,
      stemsize: 1,
      delta: 90,
      ctable:  [[0,.8, .8]],       // greenish
      ndelta: -90,
      stack: [],
      ci: 0,                       // color index
      notInPolygon: true,
      mi: 0,                       // module index
   }
   function rwdataShow() {
      return `step: ${rwdata.step}, stemsize: ${rwdata.stemsize}, delta: ${rwdata.delta}`;
   }
         

   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      if (ls.hasOwnProperty(p)) {
         switch (p) {
         case 'step': {rwdata.step = ls.step; break;}
         case 'stemsize': {rwdata.stemsize = ls.stemsize; break;}
         case 'delta': {rwdata.delta = ls.delta; break;}
         case 'ctable': {rwdata.ctable = ls.ctable; break;}
         }
      }
   }
   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      puts(`checking for var ${p}`);
      if (ls.vars.has(p)) {
         switch (p) {
         case 'step': {rwdata.step = ls.vars.get(p); break;}
         case 'stemsize': {rwdata.stemsize = ls.vars.get(p); break;}
         case 'delta': {rwdata.delta = ls.vars.get(p); puts("set stemsize"); break;}
         case 'ctable': {rwdata.ctable = ls.vars.get(p); break;}
         }
      }
   }
   rwdata.ndelta= -1*rwdata.delta,
   t.setSize(rwdata.stemsize);
   t.setColor(rwdata.ctable[0]);
   t.hide();
   t.penDown();

   rwstack = [];
   let tree = ls.current;
   puts(`lsystem has ${tree.length} modules`);
   puts(`using settings: ` + rwdataShow());

   function doModule () {
      let i;
      for (i=rwdata.mi; i < Math.min(tree.length, rwdata.mi+50); i++) {
         let m = tree[i];
         switch (m) {
         case 'F': {t.forward(rwdata.step); break;}
         case 'f': {
            if (rwdata.notInPolygon) {
	       t.penUp(); t.forward(rwdata.step); t.penDown();
            } else {
	       t.setSize(1); t.forward(rwdata.step); t.setSize(rwdata.stemsize);
            }
            break;
         }
         case '+': {t.yaw(rwdata.delta); break; }
         case '-': {t.yaw(rwdata.ndelta); break; }
         case '&': {t.pitch(rwdata.delta); break; }
         case '^': {t.pitch(rwdata.ndelta); break; }
         case '\\': {t.roll(rwdata.delta); break; }
         case '/': {t.roll(rwdata.ndelta); break; }
         case '|': {t.yaw(180); break; }
         case '!': {rwdata.stemsize -= 1; t.setSize(rwdata.stemsize); break;}
         case "'": {
            rwdata.ci++;
            if (rwdata.ci == rwdata.ctable.length) { rwdata.ci = 0;}
            t.setColor(rwdata.ctable[rwdata.ci]);
            break;
         }
         case '\[': { 
            let s = t.getState();
            rwstack.push([s, rwdata.ci, rwdata.stemsize]); break;}
         case '\]': {
            let s = rwstack.pop();
            if (s) {
	       rwdata.ci = s[1];
	       rwdata.stemsize = s[2];
	       t.setState(s[0]);
            }
            break;
         }
         case 'A':
         case 'S':
         case 'L': break;
         case '{': {rwdata.notInPolygon = false; break;}
         case '}': {rwdata.notInPolygon = true; break;}
         default: { }   //puts(`ignoring module ${i}: ${m}`);}
         }
      }

      lblNumDrawn.textContent=i;
      if (i < tree.length) {
         rwdata.mi = i;
         rAF = requestAnimationFrame(doModule); 

         // if (i % 2500 != 0) {
         //    setTimeout(doModule,5);  
         // } else {
         //    setTimeout(doModule,100);
         // }
      } else {
         lblNumDrawn.backgroundColor = "green"
      }
   }
   doModule();
  // for (const m of ls.current) {
  //   if (rwdata.mi % 500 == 0) {puts(`${rwdata.mi} of ${ls.current.length}`);}
  //   rwdata = await doModule(t,m,rwdata);
  //   rwdata.mi++;
  // }
}
