// 
// connect lsystem with turtle, implementing interpretation steps
// 
var idata;
function turtleInterp (ti, ls, opts=null) {
   let desiredFps = 10;

   if (ls.current.length == 0) {
      puts('top level lsystem is empty, returning');
      return;
   }

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
      useDefaultTurtle: opts.useDefaultTurtle ? opts.useDefaultTurtle : true,
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
   // if (opts) {
   //     opts.keys().forEach(p => {
   //       idata[p] = opts[p];
   //       puts(`set idata[${p}] to ${opts[p]}`);
   //    });
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
      let v;
      if (v = ls.locals.get(p)) {
         idata[p] = v;
      } else if (v = ls.globals.get(p)) {
         idata[p] = v;
      } else if (v = ls[p]) {
         idata[p] = v;
      } else {
         continue;
      }
      puts(`set idata[${p}] to ${v}`,NTRP_INIT);
   }

   let view = ls.globals.get('view');
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
   puts(`lsystem view is ${view.toString()}`, NTRP_SETTING);
   idata.view = view;

   idata.ndelta= -1*idata.delta;

   
   var t0;
   if (idata.useDefaultTurtle) {
      t0 = ti;
   } else {
      t0 = new Turtle3d(ti.scene, {noturtle: true});  // , globalPolygons: true});
      idata.gencode('var t0 = new Turtle3d(ti.scene, {noturtle: true});\n');
      let ts = ti.getState();
      t0.setState(ts);
      idata.gencode('t0.setState(ti.getState());\n');
   }
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
   puts(`using settings with turtle ${t0.Turtle}:` + idata.show(), NTRP_INIT);

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
      //console.log('in Promise');
      function doModule () {
         if (branches.length == 0) {
            packItUp(t0);
            return;
         }

         let branch = 0
         let turtle = branches[branch].turtle;;
         let branchpos = branches[branch].spos;
         let i = 0;
         let branchIsDead = false;
         let isPM = false;
         
         idata.gencode('let turtle = branches[branch].spos;\n');
         // assumption is that lstring is not empty, so lstring[branchpos] is not empty
         do {
            if (branchpos >= lstring.length) {
               removeBranch(branch, turtle);
               branch++;                // switch branch
               branch %= branches.length;
               turtle = branches[branch].turtle;
               branchpos = branches[branch].spos; // 
               continue;
            }

            if (idata.useMT) {
               idata.gencode(`turtle = branches[${branch}].turtle;\n`);
               puts(`branch: ${branch} of ${branches.length}, branchpos: ${branchpos}, turtle: ${turtle.Turtle}`, NTRP_PROGRESS);
            }
            let pM = lstring[branchpos];
            branches[branch].spos++; // update position on this branch
            if (pM) {
               puts(pM.toString(), NTRP_PROGRESS);
            } else {
               console.error(`Walked off end of lstring: branchpos: ${branchpos}, branch: ${branch}, branches length: ${branches.length}`);
               throw `Walked off end of lstring: branchpos: ${branchpos}, branch: ${branch}, branches length: ${branches.length}`
            }

            let m;
            let pmArgs, p0;         // most functions have only one parameter
            if (typeof pM === 'string') {
               m = pM
               isPM = false;
               pmArgs = [];
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
               turtle.forward(d, false); /* do not store a path or polygon point */
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
                  let p = turtle.isPenDown();
                  idata.gencode('turtle');
                  if (!p) {
                     turtle.penDown();
                     idata.gencode('.pu()');
                  }
                  turtle.goto(pM.p[0], pM.p[1],pM.p[2]);
                  idata.gencode(`.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]});\n`);
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
               turtle.penDown();
               turtle.drawSphere(p0);
               idata.gencode(`turtle.pd().drawSphere(${p0});\n`);
               break;
            }
            case '@o': {
               turtle.penDown();
               turtle.drawDisc(p0);
               idata.gencode(`turtle.pd().drawDisc(${p0});\n`);
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
            case ',': {            // decrement color table index
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
            case ';': {             // increment color table index
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
}\n`);

                  // skip past new twig on this branch
                  let [m,newpos] = Lsystem.skipbrackets(lstring, branchpos, 1);
                  if (newpos < lstring.length) {
                     branches[branch].spos = newpos;
                  } else {
                     removeBranch(branch,turtle);
                  }
               } else {
                  turtle.newBranch({ci: idata.ci, st: idata.st});
                  idata.gencode(`turtle.newBranch();\n`);
               }
               break;
            }
            case ']': {           // end a branch
               // should probably complain about unfinished tracks and polygons...
               if (turtle.isTrackStarted()) {
                  turtle.endTrack();
                  idata.gencode('turtle.endTrack();\n')
                  console.warn('branch ended with unfinished track');
               }
               if (idata.useMT) {
                  removeBranch(branch, turtle);
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
               if (!isPM || p0 == '""') {
                  if ( idata.inPolygon > 0) {
                     if (pmArgs.length < 2) {
                        puts('ending polygon', NTRP_TRACKS);
                        turtle.endPolygon();
                        idata.gencode(`turtle.endPolygon();\n`);
                     } else {
                        puts('ending polygon as mesh ' + pmArgs[1], NTRP_TRACKS);
                        turtle.endPolygon(pmArgs[1]);
                        idata.gencode(`turtle.endPolygon(${pmArgs[1]});\n`);
                     }
                     idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon - 1 : 0;
                     if (idata.inPolygon < 1) {
                        idata.ptCaptureMode = Turtle3d.CAPTURE_NONE; // turn off polygon capture
                     }
                  } else {
                     puts('end polygon attempted when no polygon started', NTRP_TRACKS);
                  }
               } else {
                  puts(`end track: pmArgs: ${pmArgs}`);
                  if (pmArgs.length < 2) {
                     turtle.endTrack();
                     idata.gencode(`turtle.endTrack(${p0});\n`);
                     puts('ending track, type:' + p0, NTRP_TRACKS);
                  } else {
                     turtle.endTrack(pmArgs[1]);
                     idata.gencode(`turtle.endTrack(${pmArgs[1]});\n`);
                     puts('ending track, type:' + p0 + ' to mesh: ' + pmArgs[1], NTRP_TRACKS);
                  }
               }
               break;
            }
            case '@Gs': {
               puts(`Starting new Hermite Spline Track, type: 'p1'`, NTRP_TRACKS);
               turtle.newTrack('p1');
               turtle.storePoint(turtle.getPos());
               idata.gencode(`turtle.newTrack('p1').storePoint(turtle.getPos());\n`);
            }
               break;
            case '@Ge':
               if (isPM) {
                  turtle.setTrackQuality(p0);
                  idata.gencode(`turtle.setTrackQuality(${p0});\n`);
               }
               let id = (pmArgs.length == 2) ? pmArgs[1] : null;
               turtle.storePoint(turtle.getPos());

               turtle.endTrack(id);
               idata.gencode(`turtle.endTrack(${id});\n`);
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
                  // we're capturing points for a contour. can specify
                  // number of final points, and open, 0, or closed, 1
                  let p1 = pM.p.length > 1 ? pM.p[1] : 0; // s.b. 0 or 1
                  if (p0 > 1) {
                     turtle.beginContour(p0, p1);
                     idata.gencode(`turtle.beginContour('${p0}', ${p1}));\n`);
                     idata.ptCaptureMode = Turtle3d.CAPTURE_CONTOUR;
                     puts(`beginContour(${p0}, ${p1})`, NTRP_CONTOUR);
                  } else {
                     throw new Error('wrong value of contour numpts: npts > 1');
                  }
               } else {
                  turtle.beginContour();
                  idata.gencode(`turtle.beginContour();\n`);
                  idata.ptCaptureMode = Turtle3d.CAPTURE_CONTOUR;
                  puts(`beginContour()`, NTRP_CONTOUR);
               }
               break;
            }
            case '@De': {
               if (isPM) {
                  let cid;
                  let p1 = pM.p.length > 1 ? pM.p[1] : null; // 
                  puts(`endContour(${cid}, ${p1})`, NTRP_CONTOUR);
                  if (p1 != null && p1 >= 2) {
                     cid = turtle.endContour(p0, p1);
                     idata.gencode(`turtle.endContour('${p0}', ${p1});\n`);
                  } else {
                     cid = turtle.endContour(p0); // use default number of points = 8
                     idata.gencode(`turtle.endContour('${p0}');\n`);
                  }
                  puts(`endContour(${cid}, ${p1})`, NTRP_CONTOUR);
                  puts(`getTrackShape(${cid}) = ${turtle.getTrackShape(cid)}`, NTRP_CONTOUR)
                  
               } else {
                  throw new Error('@De end Contour module requires an id parameter');
               }
               idata.ptCaptureMode = Turtle3d.CAPTURE_NONE;
               break;
            }
            case '@Da':
               if (isPM) {
                  switch (p0) {
                  case 0:       // arc through 3 last pts
                     turtle.generateContourSegment(Turtle3d.CONTOUR_ARC_3PT);
                     idata.gencode(`turtle.generateContourSegment(${Turtle3d.CONTOUR_ARC_3PT});`);
                     break;
                  case 1: // arc center at pt1, start at pt2, radius-angle = p1
                     let opts = pM.p.length > 1 ? {angle: pM.p[1]} : null;
                     turtle.generateContourSegment(Turtle3d.CONTOUR_ARC_CENTER, opts);
                     idata.gencode(`turtle.generateContourSegment(${Turtle3d.CONTOUR_ARC_CENTER}, opts);`);
                     break;
                  default:
                     throw new Error('@Da: unsupported arc type: ' + p0);
                  }
               } else {
                  throw new Error('@Da arc requires 1 or 2 args, p0=0 => arc btw 3 pts ');
               }
               break;
            case '@Dm':
               if (isPM && p0 >= 1) {
                  turtle.setContourMultiplicity(p0);
                  idata.gencode(`turtle.setContourMultiplicity(${p0};\n`);
               } else {
                  throw new Error('@Dm(n) requires a parameter n >= 1 specifying multiplicity');
               }
               break;
            case '@Dt':
               if (isPM) {
                  if (pM.p.length == 2) {
                     turtle.setContourSegmentMultipliers(p0,pM.p[1]);                     
                     idata.gencode(`turtle.setContourSegmentMultipliers(${p0},${pM.p[1]});\n`);
                  } else {
                     throw new Error('@Dt hermite spline segment takes 0 or 2 arguments');  
                  }
               }
               turtle.generateContourSegment(Turtle3d.CONTOUR_HERMITE);
               idata.gencode(`turtle.generateContourSegment(${Turtle3d.CONTOUR_HERMITE});`);
               break;
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
            case '~':
               if (isPM) {
                  puts(`insert mesh: ${pmArgs}`, NTRP_TRACKS);
                  turtle.insertMesh(p0,pmArgs[1] ? pmArgs[1] : 1);
                  idata.gencode(`turtle.insertMesh('${p0}',${pmArgs[1] ? pmArgs[1] : 1});`);
               } else {
                  puts(`insert mesh: needs some arguments, but got none`);
               }
               break;
            case '@H':
               turtle.home();
               idata.gencode('turtle.home()');
               if (isPM && p0) {
                  idata.gencode(';\n');
               } else {
                  turtle.pitch(-90);
                  idata.gencode('.pitch(-90);\n');
               }
               break;      
            case 'S':
            case 'L': 
               break;
            default: 
               //puts(`no Action for module ${i}: ${m}`);}
            }
            i++;
            if (idata.useMT) {
               do {
                  if (branches.length) {
                     branch++;                // switch branch
                     branch %= branches.length;
                     turtle = branches[branch].turtle;
                     branchpos = branches[branch].spos; // 
                     //puts(`branch: ${branch}, branchpos: ${branchpos}, blength: ${branches.length}`);
                     if (branchpos >= lstring.length) {
                        removeBranch(branch, turtle);
                     } else {
                        break;
                     }
                  } else {
                     break;
                  }
               } while (1);
            } else {            // single turtle => interpreting string left to right
               branchpos++;
               if (branchpos >= lstring.length) {
                  let shouldKeep = branches[branch].keep;
                  if (! shouldKeep) {
                     turtle.dispose(false); // don't dispose tracks, thought
                     idata.gencode('turtle.dispose(false);\n');
                  }
                  branches = [];
                  idata.gencode(`branches = [];\n`);
               }
            }
            idata.mi++;         // for UI

         } while (i < idata.miCount && branches.length>0);

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

      function removeBranch(branch, turtle) {
         let shouldKeep = branches[branch].keep;
         branches.splice(branch,1); // remove this branch - could be first
         idata.gencode(`branches.splice(${branch},1);\n`);
         if (! shouldKeep) {
            turtle.dispose(false); // don't dispose tracks, though
            idata.gencode('turtle.dispose(false);\n');
         }
         puts(`deleted branch: ${branch} moving on; branches.length: ${branches.length}`, NTRP_PROGRESS);
      }

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
