import {getContext} from 'svelte';
import {Engine, Scene, UniversalCamera, HemisphericLight, Vector3, Color3, Mesh, MeshBuilder,
        StandardMaterial, Plane, Coordinate, Frustrum,  Tags} from 'babylonjs';
import {GrassProceduralTexture} from 'babylonjs-procedural-textures';
import {GridMaterial} from 'babylonjs-materials'
// import * as BABYLON from '@babylonjs/core/Legacy/legacy';
// import GridMaterial from '@babylon.gridMaterial'
// // import {Engine, Scene, UniversalCamera, HemisphericLight, Vector3, Color3, Mesh, MeshBuilder,
// //        StandardMaterial} from '@babylonjs/core';
// import {GrassProceduralTexture} from '@babylonjs/procedural-textures';

export var engine = undefined;
export var camera;
export var ground
export var sky;
export var axes;
export var defaultTurtle;

export const cameraHomePosition = new Vector3(35, 10 ,-5);
export const cameraHomeTarget = Vector3.Zero();
export var skysize = 10000;

var skyOpts = {
  diameter: skysize, slice: 0.5, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true};

let scene;
let gmaterial;                  // aka ground material
let gtexture;                   // ... ground texture
let gridmat = null;                    // a grid material
let gridplanes = {xz: null, xy: null, yz: null};

export const createScene = (canvas) => {

   engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
   scene = new BABYLON.Scene(engine);  
  
   camera = new BABYLON.UniversalCamera("camera", cameraHomePosition.clone(), scene);
   camera.setTarget(cameraHomeTarget.clone());
   camera.inputs.addMouseWheel();
   camera.wheelDeltaPercentage = 0.0001;
   //camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y;
   camera.attachControl(canvas, true);
   camera.speed = 0.5;
   camera.angularSpeed = 0.25;

   const light0 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));
   light0.intensity = 1.5;
   const light1 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0));
   light1.intensity = 0.7;

   ground = BABYLON.MeshBuilder.CreateGround("ground", {width:skysize, height:skysize});

   gmaterial = new BABYLON.StandardMaterial("gmaterial", scene);
   gtexture = new BABYLON.GrassProceduralTexture('grass', 256, scene, {groundColor: new BABYLON.Vector3(0.8,0.6,0.50), grassColor: new BABYLON.Vector3(.9,.0,.0)});
   gtexture.grassColor = new BABYLON.Vector3(.8,.0,.0);
   gmaterial.ambientTexture = gtexture;
   ground.material = gmaterial;

   sky = makeSky();
   axes = makeAxes();
  
   engine.runRenderLoop(() => scene.render());

   defaultTurtle = new Turtle3d(scene);
   Turtle3d.loadFontData();

  return scene;
}

function makeSky() {
  // let sky = BABYLON.MeshBuilder.CreateSphere("sky", skyOpts, scene);
  let skybox = BABYLON.MeshBuilder.CreateBox("sky", {size: 10000}, scene);
  let skyMaterial = new BABYLON.StandardMaterial("skyMaterial", scene);
  skyMaterial.backFaceCulling = false;
  skyMaterial.diffuseColor = new BABYLON.Color3(93/255, 173/255, 220/255); //206/255, 227/255, 240/255);
  skyMaterial.ambientColor = new BABYLON.Color3(206/255, 227/255, 240/255);
  skybox.material = skyMaterial;
  return skybox;
}

function makeAxes (size=10) {
  var xaxis = BABYLON.Mesh.CreateLines('xaxis',[
    new BABYLON.Vector3(-20,0,0), 
    new BABYLON.Vector3(20,0,0)
  ], scene);
  xaxis.color = BABYLON.Color3.Red();
  BABYLON.Tags.AddTagsTo(xaxis, `axes`); 
  xaxis.doNotSerialize = true;
  var yaxis = BABYLON.Mesh.CreateLines('yaxis', [ 
    new BABYLON.Vector3(0, -20 ,0), new BABYLON.Vector3(0,20,0)
  ] , scene);
  yaxis.color = BABYLON.Color3.Green();
  yaxis.doNotSerialize = true;
  BABYLON.Tags.AddTagsTo(yaxis, `axes`); 
  var zaxis = BABYLON.Mesh.CreateLines('zaxis',[
    new BABYLON.Vector3(0,0,-20),new BABYLON.Vector3(0, 0, 20)
  ], scene);
  zaxis.color = BABYLON.Color3.Blue();
  zaxis.doNotSerialize = true;
  BABYLON.Tags.AddTagsTo(zaxis, `axes`); 
  return scene.getMeshesByTags('axes');
}

function getGridmat() {
  if (gridmat === null) {
        gridmat = new BABYLON.GridMaterial("groundMaterial", scene);
        gridmat.majorUnitFrequency = 10;
	gridmat.minorUnitVisibility = 0.25;
	gridmat.gridRatio = 1;
	gridmat.backFaceCulling = false;
	gridmat.mainColor = new BABYLON.Color3(1, 1, 1);
	gridmat.lineColor = new BABYLON.Color3(1.0, 1.0, 1.0);
	gridmat.opacity = 0.98;
  }
  return gridmat;
}

export const showHideGrid = (plane = null, showHide=false) => {
  if (plane != null) {
    let abstractPlane;
    switch (plane) {
    case 'xz':
      if (gridplanes.xz === null) {
        abstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 1, 0));
        gridplanes.xz = BABYLON.MeshBuilder.CreatePlane("plane", {sourcePlane: abstractPlane,  size: 1000, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
        gridplanes.xz.material = getGridmat();
      }
      gridplanes.xz.isVisible = showHide;
      //ground.isVisible = !showHide
      break;
    case 'xy':
      if (gridplanes.xy === null) {
        abstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 1));
        gridplanes.xy = BABYLON.MeshBuilder.CreatePlane("plane", {sourcePlane: abstractPlane,  size: 1000, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
        gridplanes.xy.material = getGridmat();
        gridplanes.xy.position.y = 500;
      }
      gridplanes.xy.isVisible = showHide;
      break;
    case 'yz':
      if (gridplanes.yz === null) {
        abstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 50, 0), new BABYLON.Vector3(1, 0, 0));
        gridplanes.yz = BABYLON.MeshBuilder.CreatePlane("plane", {sourcePlane: abstractPlane,  size: 1000, sideOrientation: BABYLON.Mesh.DOUBLESIDE});
        gridplanes.yz.material = getGridmat();
        gridplanes.yz.position.y = 500;
      }
      gridplanes.yz.isVisible = showHide;
      break;
    default:
    }
  }
}

export const showHideAxes = (which=true) => {
   which = which ? true : false;
   for (var index = 0; index < axes.length; index++) {
      axes[index].isVisible = which;
   }
}

export const resetView = (tag, view) => {
   if (view?.position) {
     let vp = BABYLON.Vector3.FromArray(view.position.toArray());
      camera.position.copyFrom(vp)
      puts(`camera  position: ${camera.position} from ${view.position}`,NTRP_SETTING);
   }
   if (view?.target) {
     if (typeof view.target === 'string') {
       let tgt = view.target.toLowerCase();
        switch(tgt) {
        case 'turtle':
           lookAtTurtle();
           break;
        case 'colortable':
           lookAtColortable()
           break;
        case 'mesh':
           let bi = Turtle3d.getBoundingInfoByTag(tag);
           if (bi) {
              camera.setTarget(bi.boundingSphere.center);
              puts(`camera target: ${camera.target} from bounding info`, NTRP_SETTING);
           }
       }
     } else {
       camera.setTarget( BABYLON.Vector3.FromArray(view.target.toArray()));
       puts(`camera target: ${camera.target} from view.target`, NTRP_SETTING);
     }
   } else {
      let bi = Turtle3d.getBoundingInfoByTag(tag);
      if (bi) {
         if (view.auto) {
            //let fPlanes = Frustum.GetPlanes(camera.getTransformationMatrix());               
            let target = bi.boundingSphere.center;
            let bx = target.x;
            let by = target.y;
            let bz = target.z;
            let distance = 3 * bi.boundingSphere.radius;
            let campos;
            if ('object' == typeof view.auto ) {
               // assume it's a vector specifying direction from camera to center
               campos = BABYLON.Vector3.FromArray(view.auto.toArray()).normalize();
               campos.scaleInPlace(distance).addInPlace(target);
            } else {         // assume string
               campos = newV(bx + distance, by, bz);
               switch (view.auto.toUpperCase()) {
               case 'Y':
                  campos.x = bx;
                  campos.y = by + distance;
                  break;
               case '-Y':
                  campos.x = bx;
                  campos.y = by - distance;
                  break;
               case 'Z':
                  campos.x = bx;
                  campos.z = bz + distance;
                  break;
               case '-Z':
                  campos.x = bx;
                  campos.z = bz - distance;
                  break;
               case '-X':
                  campos.x= bx - distance;
                  break;
               case 'X':
               default:
               }
            }
            camera.position.copyFrom(campos);
            camera.setTarget(target);
            puts(`camera position: ${camera.position}, target: ${camera.target}`, NTRP_SETTING)
            //puts(`camera position: ${camera.position.toArray()}, target: ${camera.target.toArray()}`, NTRP_SETTING)
         }
      }
   }
}

export const lookAtTurtle = () => {
  camera.setTarget(defaultTurtle.getPos());
};

export const lookAtOrigin = () => {
   camera.setTarget(BABYLON.Vector3.Zero());
};

export const lookAtColortable = () => {
  camera.position.copyFrom(new BABYLON.Vector3(8,25,-12));
  camera.setTarget(new BABYLON.Vector3(8,1,8));
};

export const clearLsystem = (evt) => {
  evt?.target.blur();

   try {
     defaultTurtle.clear();
     Turtle3d.clearTracksByTag('lsystem');
   } catch (error) {console.log();}
};

export const homeTurtle = (evt) => {
  try {
    evt?.target.blur();
    defaultTurtle.home();
  } catch (error) {console.log();}
};

export const resetScene = (evt) => {
  try {
    evt?.target.blur();
    Turtle3d.clearTracksByTag('lsystem');
    defaultTurtle.reset(true);
    // initCtable(t);
    camera.position.subtractInPlace(camera.position.subtract(cameraHomePosition));
    camera.setTarget(defaultTurtle.getPos());
  } catch (error) {console.log();}
};

export const showColorTable = () => {
   let tracks = defaultTurtle.getColorTableMeshes();
   let viewspec;
   if (tracks.length == 0) {
      Turtle3d.showColorTable(defaultTurtle);
      resetView('', {target: 'colortable'});
      return true;
   } else {
      let toggle = ! tracks[0].isVisible;
      tracks.forEach(m => m.isVisible = toggle);
     if (toggle) {
       resetView('', {target: 'colortable'});
     } else {
       resetView('', {auto: 'X'});
     }
      return toggle;
   }
};

export const useInstances = (onoff=true) => {
  Turtle3d.useInstancesOnInsert = onoff;
}
