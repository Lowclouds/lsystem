
/*
  This is a hack of Babylonjs Extrude functions to allow us to pass in an initial normal vector. This ability
  allows us to create correctly oriented extrusions in the case where the path is straight and 90-180 degrees
  from the xz plane.
*/

// TmpVectors aren't in the BABYLON public API */
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
//   console.log(`extrudeShapeFix. firstNormal: ${firstNormal}`);

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
      firstNormal
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
   //console.log(`extrudeShapeFixCustom. firstNormal: ${firstNormal}`);
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
   const sideOrientation = options.sideOrientation || BABYLON.Mesh.FRONTSIDE;
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
      firstNormal
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
       scaleFunction = null,
       rotateFunction = null,
       cap,
       custom
    ) => {
        const tangents = path3D.getTangents();
        const normals = path3D.getNormals();
        const binormals = path3D.getBinormals();
        const distances = path3D.getDistances();
        console.log(`extrusionPathArray: normals: ${normals}`);
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
    if (instance) {
        // instance update
       const storage = instance._creationDataStorage;
       path3D = firstNormal ? storage.path3D.update(curve, firstNormal) : storage.path3D.update(curve);
       pathArray = extrusionPathArray(shape, curve, storage.path3D, storage.pathArray, scale, rotation, scaleFunction, rotateFunction, storage.cap, custom);
       instance = BABYLON.MeshBuilder.CreateRibbon("", { pathArray, closeArray: false, closePath: false, offset: 0, updatable: false, sideOrientation: 0, instance }, scene || undefined);

        return instance;
    }
    // extruded shape creation
   
   path3D = firstNormal ? new BABYLON.Path3D(curve, firstNormal) : new BABYLON.Path3D(curve);
   console.log(`extrudeShapeGeneric. firstNormal: ${firstNormal}`);
   //console.log(`path3D normals: ${path3D._normals}`);
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
