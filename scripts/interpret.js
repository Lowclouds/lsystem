
// 
// connect lsystem with turtle, implementing interpretation steps
// 

function turtleInterp (ti, ls, opts=null) {
   let desiredFps = 10;

   idata = {
      step:  1,
      stemsize: 0.1,
      stemstep: 0.1,
      delta: 90,
      ndelta: -90,

      ci: 0,                       // color index
      inPolygon: 0,                // not
      ptCaptureMode: Turtle3d.CAPTURE_NONE, //
      mi: 0,                       // module index
      miCount: 200,               // number of modules to interpret/frame
      interval: 1000 / (10 * desiredFps),
      lastTime: performance.now(),
      ctable:  null,
      //ctable: colorTableDefault,
      cpoly: null,
      useTracksAlways: false,
      gencode: opts.gencode ? opts.gencode : false,
   }
   var code = '';
   function gencode (snippet) {
      if (idata.gencode) {
         code += snippet;
      }
   }

   puts(`miCount: ${idata.miCount}, interval: ${idata.interval}`);
   idata.show =  function () {
      return `step: ${this.step}, stemsize: ${this.stemsize}, delta: ${this.delta}, useTracksAlways: ${idata.useTracksAlways}`;
   }

   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      if (ls.hasOwnProperty(p)) {
         switch (p) {
         case 'step': {idata.step = ls.step; break;}
         case 'stemsize': {idata.stemsize = ls.stemsize; break;}
         case 'delta': {idata.delta = ls.delta; break;}
         case 'ctable': {idata.ctable = ls.ctable; puts("set ctable data"); break;}
         }
         puts(`set idata[${p}] to ${ls.ctable}`);
      }
   }
   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      puts(`checking for var ${p}`);
      if (ls.locals.get(p)) {
         switch (p) {
         case 'step': {idata.step = ls.locals.get(p); break;}
         case 'stemsize': {idata.stemsize = ls.locals.get(p); break;}
         case 'delta': {idata.delta = ls.locals.get(p); puts("set stemsize"); break;}
         case 'ctable': {idata.ctable = ls.locals.get(p); puts("set ctable data"); break;}
         }
         puts(`set idata[${p}] to ${ls.locals.get(p)}`);
      }
   }

   if (opts != null) {
      for (const p in opts) {
         idata[p] = opts[p];
         puts(`set idata[${p}] to ${opts[p]}`);
      }
   }
   let view = ls.locals.get('view');
   puts(`view is ${view}`);
   if (view) {
      if (view.position) {
         let vp = BABYLON.Vector3.FromArray(view.position.toArray());
         camera.position.copyFrom(vp)
         puts(`camera  position: ${camera.position} from ${view.position}`,NTRP_SETTING);
      }
      if (view.target) {
         camera.setTarget( BABYLON.Vector3.FromArray(view.target.toArray()));
         puts(`camera target: ${camera.target} from ${view.target}`,NTRP_SETTING);

      }
   } else {
      view = {auto: 'X'};
   }
   idata.view = view;

   idata.ndelta= -1*idata.delta;
   ti.setSize(idata.stemsize, true); //this sets both size and lastsize to stemsize
   ti.setHeading([0,1,0]);
   gencode('ti.setHeading([0,1,0])');
   gencode('.setSize(' + idata.stemsize + ', true);\n');
   if (idata.ctable != null && idata.ctable != []) {
      ti.deleteMaterials();
      let numMat = ti.materialList.length;
      idata.ctable.forEach((e) => {
         ti.addMaterial(null, e);
         puts(`add material w/color: ${e}`, NTRP_INIT);
      });
      ti.setMaterial(1);
      puts(`set ${ti.getTurtle()} material to idx ${numMat}, color ${ti.getColor()}`, NTRP_INIT);
   }

   ti.hide();
   ti.penDown();
   gencode('ti.hide().pd();\n');

   var branchstack = [];
   var polygonstack = [];
   let tree = ls.current;
   puts(`lsystem has ${tree.length} modules`, NTRP_INIT);
   puts(`using settings: ` + idata.show(), NTRP_INIT);

   lblNumDrawn.style.backgroundColor = 'lightgray';
   lblNumNodes.textContent = tree.length;

   if (idata.useTrackAlways) {
      ti.newTrack();
      gencode('ti.newTrack();\n');
   }
   let ts = ti.getState()
   puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`); // , NTRP_INIT
   //idata.lastTime = performance.now();

   let ipromise = new Promise((resolve, reject) => {
      console.log('in Promise');
      function doModule () {
         let i;
         let isPM = false;
         
         if (idata.mi >= tree.length) {
            let ts = ti.getState()
            if (ti.branchStack.length > 0) {
               puts(' done with tree'); // , NTRP_INIT
               puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`); // , NTRP_PROGRESS
               //   puts(`tp.shape is: ${ti.getState().trackPath.shape}`);
               if (ts.trackPath != null) {
                  if (idata.useTrackAlways) {
                     ti.endTrack();
                     gencode('ti.endTrack();\n');
                  } else {
                     ts.trackPath = null;
                     console.warn('trackPath not null at end of interpretation');
                  }
               }
            } else {
               if (idata.useTrackAlways && ts.trackPath != null) {
                  ti.endTrack();
                  gencode('ti.endTrack();\n');
               }
               puts('done with tree and ti.branchStack.length == 0', NTRP_PROGRESS);
            }
            if (idata.view.hasOwnProperty('auto')) {
               let bi = ti.getTrackBoundingInfo();
               let fPlanes = BABYLON.Frustum.GetPlanes(camera.getTransformationMatrix());               
               let target = bi.boundingSphere.center;
               let bx = target.x;
               let by = target.y;
               let bz = target.z;
               let distance = 2 * bi.boundingSphere.radius;
               let campos = newV(bx + distance, by, bz);
               if ('object' == typeof idata.view.auto ) {
                  campos = BABYLON.Vector3.FromArray(idata.view.auto.toArray());
                  campos.normalize().scaleInPlace(distance).addInPlace(target);
               } else {         // assume string
                  switch (idata.view.auto.toUpperCase()) {
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
            updateTurtleInfo(ti,0);
            lblNumDrawn.style.backgroundColor = 'lightgreen';
            //lblNumNodes.style.backgroundColor = 'lightgreen';
            lsCode.value = code;
            resolve(true);
            return;
         }

         for (i=idata.mi; i < Math.min(tree.length, idata.mi+idata.miCount); i++) {
            let pM = tree[i];
            puts(pM.toString(), NTRP_PROGRESS);
            //puts(ti.getPos());
            let m;
            let pmArgs, p0;         // most functions have only one parameter
            if (typeof pM == 'string') {
               m = pM
               pmArg=null;
               isPM = false;
            } else {
               m = pM.m;
               pmArgs=pM.p;
               p0 = pmArgs[0];
               isPM = true;
            }
            switch (m) {
            case 'F': {
               let d = isPM ? p0 : idata.step;
               gencode('ti');
               if (! ti.isPenDown()) {
                  ti.penDown();
                  gencode('.pd()');
               }
               ti.forward(d);
               gencode(`.fd(${d});\n`);
               //puts('fd: ' + d);
               break;
            }
            case 'f': {
               let d = isPM ? p0 : idata.step;
               let pState = ti.isPenDown();
               gencode('ti');
               if (pState) {
                  ti.penUp();
                  gencode('.pu()');
               }
               ti.forward(d);
               gencode(`.fd(${d})`);

               if (pState) {
                  ti.penDown();
                  gencode('.pd()');
               }
               gencode(';\n');
               break;
            }
            case 'G': {
               let d = isPM ? p0 : idata.step;
               gencode('ti');
               if (! ti.isPenDown()) {
                  ti.penDown();
                  gencode('.pd()');
               }
               ti.forward(d, false);
               gencode(`.fd(${d},false);\n`);
               //puts('Gfd: ' + d);
               break;
            }
            case 'g': {
               let d = isPM ? p0 : idata.step;
               let p = ti.isPenDown();
               gencode('ti');
               if (p) {
                  ti.penUp();
                  gencode('.pu()');
               }
               ti.forward(d,false);
               gencode(`.fd(${d},false)`);
               if (p) {
                  ti.penDown();
                  gencode('.pd()');
               }
               gencode(';\n');
               // puts('gfd: ' + d);
               break;
            }
            case '@M': {
               if (isPM) {
                  ti.goto(pM.p[0], pM.p[1],pM.p[2]);
                  gencode(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]});\n`);
                  puts(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`, NTRP_MOTION );
               } else {
                  throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
               }
               break;
            }
            case '@m': {
               if (isPM) {
                  let p = ti.isPenDown();
                  gencode('ti');
                  if (p) {
                     ti.penUp();
                     gencode('.pu()');
                  }
                  ti.goto(pM.p[0], pM.p[1],pM.p[2]);
                  gencode(`.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`);
                  if (p) {
                     ti.penDown();
                     gencode('.pd()');
                  }
                  gencode(';\n');
                  puts(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`, NTRP_MOTION);
               } else {
                  throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
               }
               break;
            }
            case '@O': {
               ti.drawSphere(p0);
               gencode(`ti.drawSphere(${p0});\n`);
               break;
            }
            case '@o': {
               ti.drawDisc(p0);
               gencode(`ti.drawDisc(${p0});\n`);
               break;
            }
            case '+': {            // yaw left
               let a = isPM ? p0 : idata.delta;
               ti.yaw(a);
               gencode(`ti.yaw(${a});\n`);
               puts('yaw: ' + a, NTRP_HEADING);
               break; }
            case '-': {            // yaw right
               let a = -1*(isPM ? p0 : idata.delta);
               ti.yaw(a);
               gencode(`ti.yaw(${a});\n`);
               puts('yaw: ' + a, NTRP_HEADING);
               break; }
            case '&': {            // pitch down
               let a = isPM ? p0 : idata.delta;
               ti.pitch(a);
               gencode(`ti.pitch(${a});\n`);
               puts('pitch: ' + a, NTRP_HEADING);
               break; }
            case '^': {            // pitch up
               let a = -1*(isPM ? p0 : idata.delta);
               ti.pitch(a);
               gencode(`ti.pitch(${a});\n`);
               puts('pitch: ' + a, NTRP_HEADING);
               break; }
            case '\\': {           // roll left
               let a = isPM ? p0 : idata.delta;
               ti.roll(a);
               gencode(`ti.roll(${a});\n`);
               puts('roll: ' + a, NTRP_HEADING);
               break; }
            case '/': {            // roll right
               let a = -1*(isPM ? p0 : idata.delta);
               ti.roll(a);
               gencode(`ti.roll(${a});\n`);
               puts('roll: ' + a, NTRP_HEADING);
               break; }
            case '|': {
               ti.yaw(180);
               gencode(`ti.yaw(180);\n`);
               break;
            }
            case '@R':             // set heading
               if (isPM) {
                  if (pM.p.length >= 3 ) {
                     ti.setHeading(pM.p[0], pM.p[1], pM.p[2]);
                     gencode(`ti.setHeading(${pM.p[0]}, ${pM.p[1]}, ${pM.p[2]});\n`);
                     if ( pM.p.length == 6) {
                        ti.setUp(pM.p[3], pM.p[4], pM.p[5]);
                        gencode(`ti.setUp(${pM.p[3]}, ${pM.p[4]}, ${pM.p[5]});\n`);
                     } else if (pM.p.length !=3 ) {
                        throw new Error(`@R / setheading requires 3 or 6 parameters: ${pM.p}`);
                     }
                  }
                  puts(`heading: ${pM}`, NTRP_HEADING);
               } else {
                  throw new Error('@R / setheading requires 3 or 6 parameters');
               }
               break;
            case '@v': {            // set L horizontal
               ti.levelL();
               gencode(`ti.levelL();\n`);
               break;
            }
            case '!': {   // decrease or set stem/branch size
               if (isPM ) {
                  idata.stemsize = p0;
               } else {
                  idata.stemsize -= idata.stemsize > .1 ? .1 : 0;
               }
               puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
               ti.setSize(idata.stemsize);
               gencode(`ti.setSize(${idata.stemsize});\n`);
               break;
            }
            case '#': {    // increase or set stem/branch size
               if (isPM ) {
                  idata.stemsize = p0;
               } else {
                  idata.stemsize += 0.1;
               }
               puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
               ti.setSize(idata.stemsize);
               gencode(`ti.setSize(${idata.stemsize});\n`);
               break;
            }
            case ',': {            // increment color table index
               if (isPM) {
                  mi = p0;
               } else {
                  mi = t.getMaterialIdx();
                  mi--;
               }
               ti.setMaterial(mi);
               gencode(`ti.setMaterial(${mi});\n`);
               // idata.ci %= idata.ctable.length;
               // ti.setColor(idata.ctable[idata.ci]);
               break;
            }
            case ';': {
               let mi;
               if (isPM) {
                  mi = p0;
               } else {
                  mi = t.getMaterialIdx();
                  mi++;
               }
               //puts(`setMaterial(${mi})`);
               ti.setMaterial(mi);
               gencode(`ti.setMaterial(${mi});\n`);
               break;
            }
            case '\[': {           // start a branch
               ti.newBranch({ci: idata.ci, st: idata.st});
               gencode(`ti.newBranch();\n`);
               if (idata.useTracksAlways) {
                  ti.newTrack('p0');
                  puts('newTrack(useTracksAlways in branch): p0', NTRP_BRANCH);
                  ti.storePoint();
                  gencode(`ti.newTrack('p0');ti.storePoint();\n`);
               }
               // ti.newMesh();
               break;
            }
            case '\]': {           // end a branch
               if (idata.useTracksAlways) {
                  ti.endTrack();
                  gencode('ti.endTrack();\n');
               }
               let s = ti.endBranch();
               gencode(`ti.endBranch();\n`);
               idata.ci = ti.trackMaterial;
               idata.stemsize = ti.getSize();
               break;
            }
            case '{': {
               if (!isPM) {
                  idata.inPolygon++;
                  idata.ptCaptureMode = Turtle3d.CAPTURE_POLYGON; // turn on polygon pt capture
                  ti.newPolygon();
                  gencode(`ti.newPolygon();\n`);
                  idata.cpoly = [];
               } else {
                  let ptype;
                  switch (p0) {
                  case 0:          // TABOP says this s.b. polygon, but we make it a path
                  case '0':          // TABOP says this s.b. polygon, but we make it a path
                  case 1:          // hermite open
                  case '1':          // hermite open
                     ptype = 'p'+p0;
                     break;
                  case 2:          // hermite closed
                  case '2':          // hermite closed
                  case 3:          // bspline open
                  case '3':          // bspline open
                  case 4:          // bspline closed
                  case '4':          // bspline closed
                  default:
                     puts('capture type of ' + p0 + 'not supported using p0');
                     ptype = 'p0';
                  }
                  ti.newTrack(ptype);
                  gencode(`ti.newTrack(${ptype});\n`);
                  puts(`Starting new Track, type: ${ptype}`, NTRP_TRACKS);
               }
               break;}
            case '}': {
               if (!isPM) {
                  if ( idata.inPolygon > 0) {
                     puts('ending polygon', NTRP_TRACKS);
                     ti.endPolygon();
                     gencode(`ti.endPolygon();\n`);
                     idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon - 1 : 0;
                     if (idata.inPolygon < 1) {
                        idata.ptCaptureMode = Turtle3d.CAPTURE_NONE; // turn off polygon capture
                     }
                  } else {
                     puts('end polygon attempted when no polygon started', NTRP_TRACKS);
                  }
               } else {
                  ti.endTrack(p0);
                  gencode(`ti.endTrack();\n`);
                  puts('ending track, type:' + p0, NTRP_TRACKS);
               }
               break;
            }
            case '@Gs': {
               ti.newTrack('p1');
               ti.storePoint(ti.getPos());
               gencode(`ti.newTrack('p1');\nti.storePoint(ti.getPos());\n`);
               puts(`Starting new Hermite Spline Track, type: 'p1'`, NTRP_TRACKS);
            }
               break;
            case '@Ge':
               if (isPM) {
                  ti.setTrackQuality(p0);
                  gencode(`ti.setTrackQuality(${p0});\n`);
               }
               ti.endTrack();
               gencode(`ti.endTrack();\n`);
               break;
            case '.': // record a polygon or path point
               ti.storePoint(ti.getPos());
               gencode(`ti.storePoint(ti.getPos());\n`);
               puts(`added pt ${ti.getPos()}, using "."`, NTRP_TRACKS);
               break;
            case '@Gc': {
               if (isPM) {
                  ti.setTrackQuality(p0);
                  gencode(`ti.setTrackQuality(${p0});\n`);
               }
               // idata.cpoly.push(otoa(ti.getPos()));
               ti.storePoint(ti.getPos());
               gencode(`ti.storePoint(ti.getPos());\n`);
               puts(`added pt ${ti.getPos()}, using "."`, NTRP_TRACKS);
               break;
            }
            case '@Gt': {
               if (!isPM || pmArgs.length != 2) {
                  console.warn('module @Gt requires two parameters!');
               } else {
                  ti.setTrackMultipliers(p0,pmArgs[1]);
                  gencode(`ti.setTrackMultipliers(${p0},${pmArgs[1]});\n`);
                  puts(`ti.setTrackMultipliers(${p0},${pmArgs[1]})`, NTRP_TRACKS);
               }
            }
               break;
            case '@Gr': {
               if (!isPM) {
                  console.warn('module @Gt requires two or four parameters!');
               } else {
                  if (pmArgs.length == 2) {
                     ti.setTrackRadiusSpline(p0,pmArgs[1], p0, pmArgs[1]);
                     gencode(`ti.setTrackRadiusSpline(${p0},${pmArgs[1]},${p0}, ${pmArgs[1]});\n`);
                     puts(`ti.setTrackRadiusSpline(${p0},${pmArgs[1]},${p0}, ${pmArgs[1]})`, NTRP_TRACKS);
                  } else if (pmArgs.length == 4) {
                     ti.setTrackRadiusSpline(p0,pmArgs[1], pmArgs[2], pmArgs[3]);
                     gencode(`ti.setTrackRadiusSpline(${p0},${pmArgs[1]},${pmArgs[2]}, ${pmArgs[3]});\n`);
                     puts(`ti.setTrackRadiusSpline(${p0},${pmArgs[1]},${pmArgs[2]}, ${pmArgs[3]})`, NTRP_TRACKS);
                  } else {
                     console.warn('module @Gr requires two or four parameters!');
                  }
               }
            }
               break;
            case '@Ds': {
               if (isPM) {
                  // we're capturing points for a contour, but the contour,
                  // itself can be a plain path, or a spline of some type
                  let p1 = pM.p.length > 1 ? pM.p[1] : Turtle3d.PATH_POINTS;
                  ti.beginContour(p0, p1, p0);
                  gencode(`ti.beginContour('${p0}', ${p1}, '${p0}');\n`);
                  idata.ptCaptureMode = Turtle3d.CAPTURE_CONTOUR;
               } else {
                  throw new Error('@Ds module requires an id/name parameter');
               }
               break;
            }
            case '@De': {
               if (isPM) {
                  let cid = ti.endContour(p0);
                  gencode(`ti.endContour('${p0}');\n`);
                  puts(`endContour(${cid})`, NTRP_CONTOUR);
                  puts(`trackContours.get(${cid}) = ${ti.trackContours.get(cid)}`, NTRP_CONTOUR)
               } else {
                  throw new Error('@De end Contour module requires an id parameter');
               }
               idata.ptCaptureMode = Turtle3d.CAPTURE_NONE;
               break;
            }
            case '@#': {
               if (isPM) {
                  ti.setTrackShape(p0);
                  gencode(`ti.setTrackShape('${p0}');\n`);
                  puts (`setTrackShape('${p0}')`, NTRP_CONTOUR);
                  //puts (`trackPath.shape = ${ti.TurtleState.trackPath.shape}`);
               } else {
                  throw new Error('@#/setTrackShape module requires an id parameter');
               }
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
         idata.mi = i;
         lblNumDrawn.textContent=i;
	 //lblNumNodes.textContent= tree.length - i;
         rAF = requestAnimationFrame(doModule);
      }
      doModule();
   })
   return ipromise;
}

function otoa (o) {
   let a = new Array();
   a.push(o.x); a.push(o.y); a.push(o.z);
   return a;
}
