// https://playground.babylonjs.com/#ZFBKN9#3
var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    camera = new BABYLON.UniversalCamera("camera",newV(11,8,-4), scene);
    camera.setTarget(newV(0,9,4));
    camera.attachControl(canvas, true);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
   makeAxes( scene);
}
var mat0 = new BABYLON.StandardMaterial("trackMat", scene);
mat0.diffuseColor = BABYLON.Color3.Green();
var mat1 = new BABYLON.StandardMaterial("trackMat", scene);
mat1.diffuseColor = BABYLON.Color3.Red();

var trackShape = [];
trackShape.push(newV(-0.5,0,0));
trackShape.push(newV(0,-0.05,0));
trackShape.push(newV(0,0.25,0));
trackShape.push(newV(0.5,0,0));
trackShape.push(newV(0.5,0,0));

var track = [];


track.push(newV(0 , 5 , 0));
track.push(newV(1.2246467991473532e-16 , 5 , 2));
track.push(newV(2.0906028553828465e-16 , 6.414213562373095 , 3.414213562373095));
track.push(newV(2.0906028553828467e-16 , 8.414213562373096 , 3.4142135623730954));
track.push(newV(1.2246467991473537e-16 , 9.828427124746192 , 2.000000000000001));
track.push(newV(4.930380657631324e-32 , 9.828427124746192 , 8.881784197001252e-16));
           
const radtodeg = 180/Math.PI;
const degtorad = Math.PI/180;

function getscale(i,distance) {return 1;}           
/*  thoughts are:
    0: both first and second points have zero rotation
    1: first point has rotation, second is zero
    2: both points have rotation
    3: first point has zero, second has rotation
    4: insert a point between the two points

    qualified by the observation that first two segments appear correct,
    so rotation is globally set to zero for those
*/

var myrotation = 0;
var thought = 0;

function getrotation(i,distance) {
   let rotation = 0;
   if (i == 0) {
      switch (thought) {
      case 0:
      case 3:
      case 4:
         break;
      case 1:
      case 2:
         rotation = myrotation;
         break;
      }
   } else /* i==1 */ {
      switch (thought) {
      case 0:
      case 1:
      case 4:
         break;
      case 2:
      case 3:
         rotation = myrotation;
         break;
      }
   }      
   console.log(`i: ${i}, angle: ${radtodeg * rotation}`);
   return rotation;
}           
/*
  this sets myrotation based on segment, and the observation of 
  what zero rotation looks like on first set
*/
function setMyRotation( segment) {
   switch (segment) {
   case 2:
      myrotation = Math.PI/2;
      break;
   case 3:
   case 4:
      myrotation = Math.PI;
      break;
   default:
      myrotation = 0;
   }
}
// run through all the thoughts
var zoff = newV(0,0,0);
const zdelta = newV(0,0,5);
for (thought = 0; thought < 5; thought++) {   
   for (let s = 0; s< 5; s++) {
      var pathpts = [];
      setMyRotation(s);
      pathpts.push(track[s].add(zoff));
      if (thought == 4) {
         pathpts.push(track[s+1].add*track[s].scaleInPlace(0.5).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.1)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.2)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.3)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.4)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.5)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.6)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.7)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.8)).addInPlace(zoff));
         pathpts.push(track[s].add(v.scale(0.9)).addInPlace(zoff));
      }
      pathpts.push(track[s+1].add(zoff));
      var segment = BABYLON.MeshBuilder.ExtrudeShapeCustom('t', 
                                                           {shape: trackShape, 
                                                            path: pathpts, 
                                                            updatable: true, 
                                                            scaleFunction: getscale, 
                                                            rotationFunction: getrotation,
                                                            closePath: false,
                                                            sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                                                           });
      segment.isVisible=true;
      segment.material =mat0;
   }
   zoff.addInPlace(zdelta);
}

// put whole path extrusion to left
zoff = newV(0,0,-5);
pathpts=[];
for (let s = 0; s < 6; s++) {
   pathpts.push(track[s].add(zoff));
}
var segment = BABYLON.MeshBuilder.ExtrudeShapeFixCustom('t', 
                                                     {shape: trackShape, 
                                                      path: pathpts, 
                                                      updatable: true, 
                                                      //scaleFunction: getscale, 
                                                      //rotationFunction: getrotation,
                                                      closePath: false,
                                                      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
                                                     });
segment.isVisible=true;
segment.material =mat1;
    return scene;
};

function makeAxes (scene, size=10) {
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

function newV(x=0,y=0,z=0) {
   return new BABYLON.Vector3(x,y,z);
}

const tmpMatrixFix = BABYLON.Matrix.Identity();

function ExtrudeShapeFix(
   name,
   options, /* {
               shape: Vector3[];
               path: Vector3[];
               scale?: number;
               rotation?: number;
               closeShape?: boolean;
               closePath?: boolean;
               cap?: number;
               updatable?: boolean;
               sideOrientation?: number;
               frontUVs?: Vector4;
               backUVs?: Vector4;
               instance?: Mesh;
               invertUV?: boolean;
               } */
   scene = null
) {
   const path = options.path;
   const shape = options.shape;
   const firstNormal = options.firstNormal || null;
   const scale = options.scale || 1;
   const rotation = options.rotation || 0;
   const cap = options.cap === 0 ? 0 : options.cap || BABYLON.Mesh.NO_CAP;
   const updatable = options.updatable;
   const sideOrientation = options.sideOrientation || BABYLON.Mesh.FRONTSIDE;
   const instance = options.instance || null;
   const invertUV = options.invertUV || false;
   const closeShape = options.closeShape || false;
   const closePath = options.closePath || false;
   console.log(`extrudeShapeCustom. firstNormal: ${firstNormal}`);

   return _ExtrudeShapeFixGeneric(
      name,
      shape,
      path,
      scale,
      rotation,
      null,
      null,
      closePath,
      closeShape,
      cap,
      false,
      scene,
      updatable ? true : false,
      sideOrientation,
      instance,
      invertUV,
      options.frontUVs || null,
      options.backUVs || null,
      options.firstNormal || null
   );
}

function ExtrudeShapeFixCustom(
   name,
   options, /* {
               shape: Vector3[];
               path: Vector3[];
               scaleFunction?: Nullable<{ (i: number, distance: number): number }>;
               rotationFunction?: Nullable<{ (i: number, distance: number): number }>;
               ribbonCloseArray?: boolean;
               ribbonClosePath?: boolean;
               closeShape?: boolean;
               closePath?: boolean;
               cap?: number;
               updatable?: boolean;
               sideOrientation?: number;
               frontUVs?: Vector4;
               backUVs?: Vector4;
               instance?: Mesh;
               invertUV?: boolean;
               firstNormal: Vector3;
               } */ 
   scene = null
) {
   const path = options.path;
   const shape = options.shape;
   const firstNormal = options.firstNormal || null;
   console.log(`extrudeShapeCustom. firstNormal: ${firstNormal}`);
   const scaleFunction =
         options.scaleFunction ||
         (() => {
            return 1;
         });
   const rotationFunction =
         options.rotationFunction ||
         (() => {
            return 0;
         });
   const ribbonCloseArray = options.closePath || options.ribbonCloseArray || false;
   const ribbonClosePath = options.closeShape || options.ribbonClosePath || false;
   const cap = options.cap === 0 ? 0 : options.cap || BABYLON.Mesh.NO_CAP;
   const updatable = options.updatable;
   const sideOrientation = BABYLON.Mesh.FRONTSIDE;
   const instance = options.instance;
   const invertUV = options.invertUV || false;
   
   return _ExtrudeShapeFixGeneric(
      name,
      shape,
      path,
      null,
      null,
      scaleFunction,
      rotationFunction,
      ribbonCloseArray,
      ribbonClosePath,
      cap,
      true,
      scene,
      updatable ? true : false,
      sideOrientation,
      instance || null,
      invertUV,
      options.frontUVs || null,
      options.backUVs || null,
      options.firstNormal || null
   );
}

function _ExtrudeShapeFixGeneric(
    name,
    shape,
    curve,
   scale = null,
   rotation = null,
    scaleFunction = null,
    rotateFunction = null,
    rbCA,
    rbCP,
    cap,
    custom,
    scene = null,
    updtbl,
    side,
    instance = null,
    invertUV,
    frontUVs = null,
   backUVs = null,
    firstNormal = null
) {
    // extrusion geometry
    const extrusionPathArray = (
       shape,
       curve,
       path3D,
       shapePaths,
       scale,
       rotation,
       scaleFunction,
       rotateFunction,
       cap,
       custom
    ) => {
        const tangents = path3D.getTangents();
        const normals = path3D.getNormals();
        const binormals = path3D.getBinormals();
        const distances = path3D.getDistances();
       console.log(`normals: ${normals}`);
        let angle = 0;
        const returnScale = () => {
            return scale !== null ? scale : 1;
        };
        const returnRotation = () => {
            return rotation !== null ? rotation : 0;
        };
        const rotate = custom && rotateFunction ? rotateFunction : returnRotation;
        const scl = custom && scaleFunction ? scaleFunction : returnScale;
        let index = cap === BABYLON.Mesh.NO_CAP || cap === BABYLON.Mesh.CAP_END ? 0 : 2;
       const rotationMatrix = tmpMatrixFix;         // : Matrix = TmpVectors.Matrix[0]; 

        for (let i = 0; i < curve.length; i++) {
            const shapePath = new Array();
            const angleStep = rotate(i, distances[i]);
            const scaleRatio = scl(i, distances[i]);
            for (let p = 0; p < shape.length; p++) {
               BABYLON.Matrix.RotationAxisToRef(tangents[i], angle, rotationMatrix);
               const planed = tangents[i].scale(shape[p].z).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y));
               const rotated = shapePath[p] ? shapePath[p] : BABYLON.Vector3.Zero();
               BABYLON.Vector3.TransformCoordinatesToRef(planed, rotationMatrix, rotated);
               rotated.scaleInPlace(scaleRatio).addInPlace(curve[i]);
               shapePath[p] = rotated;
            }
            shapePaths[index] = shapePath;
            angle += angleStep;
            index++;
        }
        // cap
        const capPath = (shapePath) => {
            const pointCap = [];
            const barycenter = BABYLON.Vector3.Zero();
            let i;
            for (i = 0; i < shapePath.length; i++) {
                barycenter.addInPlace(shapePath[i]);
            }
            barycenter.scaleInPlace(1.0 / shapePath.length);
            for (i = 0; i < shapePath.length; i++) {
                pointCap.push(barycenter);
            }
            return pointCap;
        };
        switch (cap) {
            case BABYLON.Mesh.NO_CAP:
                break;
            case BABYLON.Mesh.CAP_START:
                shapePaths[0] = capPath(shapePaths[2]);
                shapePaths[1] = shapePaths[2];
                break;
            case BABYLON.Mesh.CAP_END:
                shapePaths[index] = shapePaths[index - 1];
                shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                break;
            case BABYLON.Mesh.CAP_ALL:
                shapePaths[0] = capPath(shapePaths[2]);
                shapePaths[1] = shapePaths[2];
                shapePaths[index] = shapePaths[index - 1];
                shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                break;
            default:
                break;
        }
        return shapePaths;
    };
    let path3D;
    let pathArray;
    //firstNormal = null;
    if (instance) {
        // instance update
        const storage = instance._creationDataStorage;
       path3D = storage.path3D.update(curve, firstNormal);
        pathArray = extrusionPathArray(shape, curve, storage.path3D, storage.pathArray, scale, rotation, scaleFunction, rotateFunction, storage.cap, custom);
        instance = BABYLON.MeshBuilder.CreateRibbon("", { pathArray, closeArray: false, closePath: false, offset: 0, updatable: false, sideOrientation: 0, instance }, scene || undefined);

        return instance;
    }
    // extruded shape creation
   
    path3D = new BABYLON.Path3D(curve, firstNormal);
   console.log(`extrudeShapeGeneric. firstNormal: ${firstNormal}`);
   console.log(`path3D: ${path3D._normals}`);
   const newShapePaths = new Array();
   cap = cap < 0 || cap > 3 ? 0 : cap;
   pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom);
    const extrudedGeneric = BABYLON.MeshBuilder.CreateRibbon(
        name,
       {
            pathArray: pathArray,
            closeArray: rbCA,
            closePath: rbCP,
            updatable: updtbl,
            sideOrientation: side,
            invertUV: invertUV,
            frontUVs: frontUVs || undefined,
            backUVs: backUVs || undefined,
        },
        scene
    );
    extrudedGeneric._creationDataStorage.pathArray = pathArray;
    extrudedGeneric._creationDataStorage.path3D = path3D;
    extrudedGeneric._creationDataStorage.cap = cap;

    return extrudedGeneric;
}
