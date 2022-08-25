// 
// connect lsystem with turtle, implementing interpretation steps
// 
var idata;
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
      miCount: opts.miCount? opts.miCount : 200, // number of modules to interpret/frame
      useMT: opts.useMT ? opts.useMT : false,                // USE MULTIPLE turtles, or not
      interval: 1000 / (10 * desiredFps),
      lastTime: performance.now(),
      ctable:  null,
      //ctable: colorTableDefault,
      cpoly: null,
      useTracksAlways: false,
      doGencode: opts.gencode ? opts.gencode : false,
      trackTag: 'lsystem',
      code: ''
   }
   // if (opts != null) {
   //    for (const p in opts) {
   //       idata[p] = opts[p];
   //       puts(`set idata[${p}] to ${opts[p]}`);
   //    }
   // }

   idata.gencode = function gencode (snippet) {
      if (idata.doGencode) {
         idata.code += snippet;
      }
   }

   idata.show =  function () {
      return `step: ${this.step}, stemsize: ${this.stemsize}, delta: ${this.delta}, useTracksAlways: ${idata.useTracksAlways}`;
   }

   puts(`miCount: ${idata.miCount}, interval: ${idata.interval}, useMT: ${idata.useMT}`);

   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      if (ls[p]) {
         switch (p) {
         case 'step': {idata.step = ls.step; break;}
         case 'stemsize': {idata.stemsize = ls.stemsize; break;}
         case 'delta': {idata.delta = ls.delta; break;}
         case 'ctable': {idata.ctable = ls.ctable; break;}
         }
         puts(`set idata[${p}] to ${ls[p]}`);
      }
   }
   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      puts(`checking for var ${p}`);
      if (ls.locals.get(p)) {
         switch (p) {
         case 'step': {idata.step = ls.locals.get(p); break;}
         case 'stemsize': {idata.stemsize = ls.locals.get(p); break;}
         case 'delta': {idata.delta = ls.locals.get(p);  break;}
         case 'ctable': {idata.ctable = ls.locals.get(p); break;}
         }
         puts(`set idata[${p}] to ${ls.locals.get(p)}`);
      }
   }

   let view = ls.locals.get('view');
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
   puts(`lsystem view is ${view}`);
   idata.view = view;

   idata.ndelta= -1*idata.delta;

   var t0 = new Turtle3d(ti.scene, {noturtle: true});  // , globalPolygons: true});
   idata.gencode('var t0 = new Turtle3d(ti.scene, {noturtle: true})');
   let ts = ti.getState();
   t0.setState(ts);
   idata.gencode('t0.setState(ti.getState());\n');

   t0.addTag(idata.trackTag);
   t0.setSize(idata.stemsize, true); //this sets both size and lastsize to stemsize
   t0.setHeading([0,1,0]);
   idata.gencode(`
  t0.addTag('${idata.trackTag}');
  t0.setHeading([0,1,0])`);
   idata.gencode('.setSize(' + idata.stemsize + ', true);\n');

   // if (idata.ctable != null && idata.ctable != []) {
   //    t0.deleteMaterials();
   //    let numMat = t0.materialList.length;
   //    idata.ctable.forEach((e) => {
   //       t0.addMaterial(null, e);
   //       puts(`add material w/color: ${e}`, NTRP_INIT);
   //    });
   //    t0.setMaterial(1);
   //    puts(`set ${t0.getTurtle()} material to idx ${numMat}, color ${t0.getColor()}`, NTRP_INIT);
   // }

   t0.hide();
   t0.penDown();
   idata.gencode('t0.hide().pd();\n');
   
   var branches = [{turtle: t0, spos: 0, keep: true}]; 
   idata.gencode('var branches = [{turtle: t0, spos: 0, keep: true}];\n');
   var lstring = ls.current;
   puts(`lsystem has ${lstring.length} modules`, NTRP_INIT);
   puts(`using settings: ` + idata.show(), NTRP_INIT);

   lblNumDrawn.style.backgroundColor = 'lightgray';
   lblNumNodes.textContent = lstring.length;

   // if (idata.useTrackAlways) {
   //    t0.newTrack();
   //    idata.gencode('t0.newTrack();\n');
   // }

   ts = t0.getState()
   puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${t0.branchStack.length}`); // , NTRP_INIT
   //idata.lastTime = performance.now();

   let ipromise = new Promise((resolve, reject) => {
      console.log('in Promise');
      function doModule () {
         let branch, branchpos, turtle;
         let i;
         let isPM = false;
         
         if (branches.length == 0) {
            packItUp(t0);
            return;
         }
         idata.gencode('let turtle;\n');
         for (i = 0, branch=0; i < idata.miCount && branches.length>0; i++,branch++) {
            branch %= branches.length;
            branchpos = branches[branch].spos;
            turtle = branches[branch].turtle;
            idata.gencode(`turtle = branches[${branch}].turtle;\n`);
            puts(`branch: ${branch} of ${branches.length}, branchpos: ${branchpos}, turtle: ${turtle.Turtle}`, NTRP_PROGRESS);
            if (branchpos >= lstring.length) {
               let shouldKeep = branches[branch].keep;
               branches.splice(branch,1); // remove this branch - could be first
               idata.gencode(`branches.splice(${branch},1);\n`);
               if (! shouldKeep) {
                  turtle.dispose(false); // don't dispose tracks, thought
                  idata.gencode('turtle.dispose(false);\n');
               }
               continue;
            }               
            let pM = lstring[branchpos];
            puts(pM.toString(), NTRP_PROGRESS);
            branches[branch].spos++; // for next time
            idata.mi++;

            //puts(turtle.getPos());
            let m;
            let pmArgs, p0;         // most functions have only one parameter
            if (typeof pM === 'string') {
               m = pM
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
               idata.gencode('turtle');
               if (! turtle.isPenDown()) {
                  turtle.penDown();
                  idata.gencode('.pd()');
               }
               turtle.forward(d);
               idata.gencode(`.fd(${d});\n`);
               //puts('fd: ' + d);
               break;
            }
            case 'f': {
               let d = isPM ? p0 : idata.step;
               let pState = turtle.isPenDown();
               idata.gencode('turtle');
               if (pState) {
                  turtle.penUp();
                  idata.gencode('.pu()');
               }
               turtle.forward(d);
               idata.gencode(`.fd(${d})`);

               if (pState) {
                  turtle.penDown();
                  idata.gencode('.pd()');
               }
               idata.gencode(';\n');
               break;
            }
            case 'G': {
               let d = isPM ? p0 : idata.step;
               idata.gencode('turtle');
               if (! turtle.isPenDown()) {
                  turtle.penDown();
                  idata.gencode('.pd()');
               }
               turtle.forward(d, false);
               idata.gencode(`.fd(${d},false);\n`);
               //puts('Gfd: ' + d);
               break;
            }
            case 'g': {
               let d = isPM ? p0 : idata.step;
               let p = turtle.isPenDown();
               idata.gencode('turtle');
               if (p) {
                  turtle.penUp();
                  idata.gencode('.pu()');
               }
               turtle.forward(d,false);
               idata.gencode(`.fd(${d},false)`);
               if (p) {
                  turtle.penDown();
                  idata.gencode('.pd()');
               }
               idata.gencode(';\n');
               // puts('gfd: ' + d);
               break;
            }
            case '@M': {
               if (isPM) {
                  turtle.goto(pM.p[0], pM.p[1],pM.p[2]);
                  idata.gencode(`turtle.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]});\n`);
                  puts(`turtle.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`, NTRP_MOTION );
               } else {
                  throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
               }
               break;
            }
            case '@m': {
               if (isPM) {
                  let p = turtle.isPenDown();
                  idata.gencode('turtle');
                  if (p) {
                     turtle.penUp();
                     idata.gencode('.pu()');
                  }
                  turtle.goto(pM.p[0], pM.p[1],pM.p[2]);
                  idata.gencode(`.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`);
                  if (p) {
                     turtle.penDown();
                     idata.gencode('.pd()');
                  }
                  idata.gencode(';\n');
                  puts(`turtle.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`, NTRP_MOTION);
               } else {
                  throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
               }
               break;
            }
            case '@O': {
               turtle.drawSphere(p0);
               idata.gencode(`turtle.drawSphere(${p0});\n`);
               break;
            }
            case '@o': {
               turtle.drawDisc(p0);
               idata.gencode(`turtle.drawDisc(${p0});\n`);
               break;
            }
            case '+': {            // yaw left
               let a = isPM ? p0 : idata.delta;
               turtle.yaw(a);
               idata.gencode(`turtle.yaw(${a});\n`);
               puts('yaw: ' + a, NTRP_HEADING);
               break; }
            case '-': {            // yaw right
               let a = -1*(isPM ? p0 : idata.delta);
               turtle.yaw(a);
               idata.gencode(`turtle.yaw(${a});\n`);
               puts('yaw: ' + a, NTRP_HEADING);
               break; }
            case '&': {            // pitch down
               let a = isPM ? p0 : idata.delta;
               turtle.pitch(a);
               idata.gencode(`turtle.pitch(${a});\n`);
               puts('pitch: ' + a, NTRP_HEADING);
               break; }
            case '^': {            // pitch up
               let a = -1*(isPM ? p0 : idata.delta);
               turtle.pitch(a);
               idata.gencode(`turtle.pitch(${a});\n`);
               puts('pitch: ' + a, NTRP_HEADING);
               break; }
            case '\\': {           // roll left
               let a = isPM ? p0 : idata.delta;
               turtle.roll(a);
               idata.gencode(`turtle.roll(${a});\n`);
               puts('roll: ' + a, NTRP_HEADING);
               break; }
            case '/': {            // roll right
               let a = -1*(isPM ? p0 : idata.delta);
               turtle.roll(a);
               idata.gencode(`turtle.roll(${a});\n`);
               puts('roll: ' + a, NTRP_HEADING);
               break; }
            case '|': {
               turtle.yaw(180);
               idata.gencode(`turtle.yaw(180);\n`);
               break;
            }
            case '@R':             // set heading
               if (isPM) {
                  if (pM.p.length >= 3 ) {
                     turtle.setHeading(pM.p[0], pM.p[1], pM.p[2]);
                     idata.gencode(`turtle.setHeading(${pM.p[0]}, ${pM.p[1]}, ${pM.p[2]});\n`);
                     if ( pM.p.length == 6) {
                        turtle.setUp(pM.p[3], pM.p[4], pM.p[5]);
                        idata.gencode(`turtle.setUp(${pM.p[3]}, ${pM.p[4]}, ${pM.p[5]});\n`);
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
               turtle.levelL();
               idata.gencode(`turtle.levelL();\n`);
               break;
            }
            case '!': {   // decrease or set stem/branch size
               if (isPM ) {
                  idata.stemsize = p0;
               } else {
                  idata.stemsize -= idata.stemsize > .1 ? .1 : 0;
               }
               puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
               turtle.setSize(idata.stemsize);
               idata.gencode(`turtle.setSize(${idata.stemsize});\n`);
               break;
            }
            case '#': {    // increase or set stem/branch size
               if (isPM ) {
                  idata.stemsize = p0;
               } else {
                  idata.stemsize += 0.1;
               }
               puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
               turtle.setSize(idata.stemsize);
               idata.gencode(`turtle.setSize(${idata.stemsize});\n`);
               break;
            }
            case ',': {            // increment color table index
               let mi;
               if (isPM) {
                  mi = p0;
               } else {
                  mi = turtle.getMaterialIdx();
                  mi--;
               }
               turtle.setMaterial(mi);
               puts(`setMaterial(${mi})`, NTRP_SETTING);
               idata.gencode(`turtle.setMaterial(${mi});\n`);
               // idata.ci %= idata.ctable.length;
               // turtle.setColor(idata.ctable[idata.ci]);
               break;
            }
            case ';': {
               let mi;
               if (isPM) {
                  mi = p0;
               } else {
                  mi = turtle.getMaterialIdx();
                  mi++;
               }
               puts(`setMaterial(${mi})`, NTRP_SETTING);
               turtle.setMaterial(mi);
               idata.gencode(`turtle.setMaterial(${mi});\n`);
               break;
            }
            case '[': {           // start a branch
               if (idata.useMT) {
                  let s = turtle.getState(); 
                  let newt = new Turtle3d(turtle.scene, {noturtle: true});
                  newt.setState(s); // inherit current turtle state
                  newt.addTag(idata.trackTag);
                  branches.push({turtle: newt, spos: branchpos + 1, keep: false});
                  idata.gencode(`{
   let s = turtle.getState(); 
   let newt = new Turtle3d(turtle.scene, {noturtle: true});
   newt.setState(s);
   newt.addTag('${idata.trackTag}');
   branches.push({turtle: newt, spos: ${branchpos + 1}, keep: false});
}`);

                  // skip past new twig on this branch
                  let [m,newpos] = Lsystem.skipbrackets(lstring, branchpos, 1);
                  branches[branch].spos = newpos;
               } else {
                  turtle.newBranch({ci: idata.ci, st: idata.st});
                  idata.gencode(`turtle.newBranch();\n`);
               }
               break;
            }
            case ']': {           // end a branch
               if (idata.useMT) {
                  // should probably complain about unfinished tracks and polygons...
                  let shouldKeep = branches[branch].keep;
                  branches.splice(branch,1); // remove this branch - could be first
                  idata.gencode(`branches.splice(${branch},1);\n`);
                  if (! shouldKeep) {
                     turtle.dispose(false); // don't dispose tracks, thought
                     idata.gencode('turtle.dispose(false);\n');
                  }
               } else {
                  // let s = no state to save
                  turtle.endBranch();
                  idata.gencode(`turtle.endBranch();\n`);

                  //this is problematic
                  idata.ci = turtle.trackMaterial;
                  idata.stemsize = turtle.getSize();
               }
                  break;
            }
            case '{': {
               if (!isPM) {
                  idata.inPolygon++;
                  idata.ptCaptureMode = Turtle3d.CAPTURE_POLYGON; // turn on polygon pt capture
                  turtle.newPolygon();
                  idata.gencode(`turtle.newPolygon();\n`);
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
                  turtle.newTrack(ptype);
                  idata.gencode(`turtle.newTrack(${ptype});\n`);
                  puts(`Starting new Track, type: ${ptype}`, NTRP_TRACKS);
               }
               break;}
            case '}': {
               if (!isPM) {
                  if ( idata.inPolygon > 0) {
                     puts('ending polygon', NTRP_TRACKS);
                     turtle.endPolygon();
                     idata.gencode(`turtle.endPolygon();\n`);
                     idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon - 1 : 0;
                     if (idata.inPolygon < 1) {
                        idata.ptCaptureMode = Turtle3d.CAPTURE_NONE; // turn off polygon capture
                     }
                  } else {
                     puts('end polygon attempted when no polygon started', NTRP_TRACKS);
                  }
               } else {
                  turtle.endTrack(p0);
                  idata.gencode(`turtle.endTrack();\n`);
                  puts('ending track, type:' + p0, NTRP_TRACKS);
               }
               break;
            }
            case '@Gs': {
               turtle.newTrack('p1');
               turtle.storePoint(turtle.getPos());
               idata.gencode(`turtle.newTrack('p1');\nturtle.storePoint(turtle.getPos());\n`);
               puts(`Starting new Hermite Spline Track, type: 'p1'`, NTRP_TRACKS);
            }
               break;
            case '@Ge':
               if (isPM) {
                  turtle.setTrackQuality(p0);
                  idata.gencode(`turtle.setTrackQuality(${p0});\n`);
               }
               turtle.endTrack();
               idata.gencode(`turtle.endTrack();\n`);
               break;
            case '.': // record a polygon or path point
               turtle.storePoint(turtle.getPos());
               idata.gencode(`turtle.storePoint(turtle.getPos());\n`);
               puts(`added pt ${turtle.getPos()}, using "."`, NTRP_TRACKS);
               break;
            case '@Gc': {
               if (isPM) {
                  turtle.setTrackQuality(p0);
                  idata.gencode(`turtle.setTrackQuality(${p0});\n`);
               }
               // idata.cpoly.push(otoa(turtle.getPos()));
               turtle.storePoint(turtle.getPos());
               idata.gencode(`turtle.storePoint(turtle.getPos());\n`);
               puts(`added pt ${turtle.getPos()}, using "."`, NTRP_TRACKS);
               break;
            }
            case '@Gt': {
               if (!isPM || pmArgs.length != 2) {
                  console.warn('module @Gt requires two parameters!');
               } else {
                  turtle.setTrackMultipliers(p0,pmArgs[1]);
                  idata.gencode(`turtle.setTrackMultipliers(${p0},${pmArgs[1]});\n`);
                  puts(`turtle.setTrackMultipliers(${p0},${pmArgs[1]})`, NTRP_TRACKS);
               }
            }
               break;
            case '@Gr': {
               if (!isPM) {
                  console.warn('module @Gt requires two or four parameters!');
               } else {
                  if (pmArgs.length == 2) {
                     turtle.setTrackRadiusSpline(p0,pmArgs[1], p0, pmArgs[1]);
                     idata.gencode(`turtle.setTrackRadiusSpline(${p0},${pmArgs[1]},${p0}, ${pmArgs[1]});\n`);
                     puts(`turtle.setTrackRadiusSpline(${p0},${pmArgs[1]},${p0}, ${pmArgs[1]})`, NTRP_TRACKS);
                  } else if (pmArgs.length == 4) {
                     turtle.setTrackRadiusSpline(p0,pmArgs[1], pmArgs[2], pmArgs[3]);
                     idata.gencode(`turtle.setTrackRadiusSpline(${p0},${pmArgs[1]},${pmArgs[2]}, ${pmArgs[3]});\n`);
                     puts(`turtle.setTrackRadiusSpline(${p0},${pmArgs[1]},${pmArgs[2]}, ${pmArgs[3]})`, NTRP_TRACKS);
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
                  turtle.beginContour(p0, p1, p0);
                  idata.gencode(`turtle.beginContour('${p0}', ${p1}, '${p0}');\n`);
                  idata.ptCaptureMode = Turtle3d.CAPTURE_CONTOUR;
               } else {
                  throw new Error('@Ds module requires an id/name parameter');
               }
               break;
            }
            case '@De': {
               if (isPM) {
                  let cid = turtle.endContour(p0);
                  idata.gencode(`turtle.endContour('${p0}');\n`);
                  puts(`endContour(${cid})`, NTRP_CONTOUR);
                  puts(`getTrackShape(${cid}) = ${turtle.getTrackShape(cid)}`, NTRP_CONTOUR)
               } else {
                  throw new Error('@De end Contour module requires an id parameter');
               }
               idata.ptCaptureMode = Turtle3d.CAPTURE_NONE;
               break;
            }
            case '@#': {
               if (isPM) {
                  turtle.setTrackShape(p0);
                  idata.gencode(`turtle.setTrackShape('${p0}');\n`);
                  puts (`setTrackShape('${p0}')`, NTRP_CONTOUR);
                  //puts (`trackPath.shape = ${turtle.TurtleState.trackPath.shape}`);
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
            case 'L': 
               break;
            default: 
               //puts(`no Action for module ${i}: ${m}`);}
            }
         }
         lblNumDrawn.textContent = idata.mi;
         //lblNumNodes.textContent= lstring.length - i;
         if (branches.length == 0) {
            packItUp(t0);
            return;
         } else {
            let rAF = requestAnimationFrame(doModule);
         }
      }
      doModule();

      function packItUp(turtle){
         let ts = turtle.getState()
         if (turtle.branchStack.length > 0) {
            puts(' done with lstring'); // , NTRP_INIT
            puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${turtle.branchStack.length}`); // , NTRP_PROGRESS
            //   puts(`tp.shape is: ${turtle.getState().trackPath.shape}`);
            if (ts.trackPath != null) {
               if (idata.useTrackAlways) {
                  turtle.endTrack();
                  idata.gencode('turtle.endTrack();\n');
               } else {
                  ts.trackPath = null;
                  console.warn('trackPath not null at end of interpretation');
               }
            }
         } else {
            if (idata.useTrackAlways && ts.trackPath != null) {
               turtle.endTrack();
               idata.gencode('turtle.endTrack();\n');
            }
            puts('done with lstring and turtle.branchStack.length == 0', NTRP_PROGRESS);
         }

         resetView(idata.trackTag, idata.view);

         updateTurtleInfo(ti,0);
         lblNumDrawn.style.backgroundColor = 'lightgreen';
         lsCode.value = idata.code;
         resolve(true);
      }
   })
   return ipromise;
}

function otoa (o) {
   let a = new Array();
   a.push(o.x); a.push(o.y); a.push(o.z);
   return a;
}

function resetView(tag, view) {
   if (view.auto) {
      let bi = Turtle3d.getBoundingInfoByTag(tag);
      if (bi) {
         //let fPlanes = BABYLON.Frustum.GetPlanes(camera.getTransformationMatrix());               
         let target = bi.boundingSphere.center;
         let bx = target.x;
         let by = target.y;
         let bz = target.z;
         let distance = 2.0 * bi.boundingSphere.radius;
         let campos = newV(bx + distance, by, bz);
         if ('object' == typeof view.auto ) {
            // assume it's a vector specifying direction from camera to center
            campos = BABYLON.Vector3.FromArray(view.auto.toArray());
            campos.normalize().scaleInPlace(distance).addInPlace(target);
         } else {         // assume string
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
