/*
  connect lsystem with turtle, implementing interpretation steps
*/ 
var idata;

async function turtleInterp (ti, ls, opts=null, ifcUpd) {
   let desiredFps = 30;

   if (ls.interp.length === 0) {
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
      miCount: opts?.miCount ?? 200, // number of modules to interpret/frame
      useMT: opts?.useMT ?? false,                // USE MULTIPLE turtles, or not
      useDefaultTurtle: opts.useDefaultTurtle ? opts.useDefaultTurtle : true,
      interval: 1000 / (10 * desiredFps),
      lastTime: performance.now(),
      ctable:  null,
      //ctable: colorTableDefault,
      cpoly: null,
      useTracksAlways: false,
      disableDraw: opts?.disableDraw ?? false, // for environmental queries - just moves turtle.
      doGencode: opts?.gencode ?? false,
      trackTag: 'lsystem',
      code: ''
   }
   if (opts != null) {
      if (LogTag.isSet(NTRP_INIT)) {
         for (const [k,v] of Object.entries(opts)) {
            console.log(`${k}: ${v}`);
            idata[k] = v;
         }
      }
      console.log('miCount: ', opts.miCount);
   }
   
   idata.gencode = (snippet) => {3
      if (idata.doGencode) {
         idata.code += snippet;
      }
   };

   idata.show =  function () {
     return `step: ${this.step}, stemsize: ${this.stemsize}, delta: ${this.delta}, useTracksAlways: ${idata.useTracksAlways}, disableDraw: ${idata.disableDraw}`;
   }

   puts(`miCount: ${idata.miCount}, interval: ${idata.interval}, useMT: ${idata.useMT}`);

   for (const p of ['step', 'delta', 'stemsize', 'ctable']) {
      let v;
      if (undefined != (v = ls.locals.get(p))) {
         idata[p] = v;
      } else if (undefined != (v = ls.globals.get(p))) {
         idata[p] = v;
      } else if (undefined != (v = ls[p])) {
         idata[p] = v;
      } else {
         continue;
      }
      puts(`set idata[${p}] to ${v}`,NTRP_INIT);
   }

   let view = ls.globals.get('view');
   if (! view) {
     view = {auto: 'X'};
   }
   puts(`lsystem view is ${JSON.stringify(view)}`, NTRP_SETTING);
   idata.view = view;
   ifcUpd.updateView(idata.trackTag, idata.view);      

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

   idata.gencode('t0.hide().');
   t0.hide();
   t0.penDown();
   idata.gencode('pd();\n');
   t0.disableDraw(idata.disableDraw);
   idata.gencode(`.disableDraw(${idata.disableDraw}});\n`);

  puts(`lsystem. dDone = ${ls.dDone}`);
   var iDone = ls.dDone;
   var branches = [{turtle: t0, spos: 0, keep: true}]; 
   idata.gencode('var branches = [{turtle: t0, spos: 0, keep: true}];\n');
   var lstring = ls.interp;
   puts(`lsystem has ${lstring.length} modules`, NTRP_INIT);
   puts(`using settings with turtle ${t0.Turtle}, ` + idata.show(), NTRP_INIT);
  var enviroInst = ls.environment;
  
   ifcUpd.updateLsysInfo ({bgcolor: 'lightgray', ndrawn: lstring.length});

   // if (idata.useTrackAlways) {
   //    t0.newTrack();
   //    idata.gencode('t0.newTrack();\n');
   // }

   let ts = t0.getState()
   puts(`turtleMode: track=${ts.trackType}, drawMode=${ts.drawMode}, branchStacklength: ${t0.branchStack.length}`); // , NTRP_INIT
   //idata.lastTime = performance.now();

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

   let ipromise = new Promise((resolve, reject) => {
      //console.log('in Promise');
      let ePromises  = [];

      doInterp();

      function doInterp() {
        setTimeout(doSomeModules,0); // faster than above, but you still need to all frames to run
      }

      function doSomeModules () {
         if (branches.length == 0) {
            packItUp(t0);
            return;
         }

         let branch = 0;
         let turtle = branches[branch].turtle;
         let branchpos = branches[branch].spos;
         let i = 0;
         let isPM = false;
         let isEnviroCall = false;
         
         idata.gencode(`let turtle = branches[${branch}].turtle;\n`);
         // assumption is that lstring is not empty, so lstring[branchpos] is not empty
         do {
            try {
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

                  reject(`Walked off end of lstring: branchpos: ${branchpos}, branch: ${branch}, branches length: ${branches.length}`);
                  // return `Walked off end of lstring: branchpos: ${branchpos}, branch: ${branch}, branches length: ${branches.length}`;
                  return;
               }

               let m;
               let pmArgs, p0;         // most modules that have parameters have only one
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
                        idata.gencode('.pd()');
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
                  let inhibitTaper = false; // taper is default
                  if (isPM ) {
                     idata.stemsize = p0;
                     if (pM.p.length > 1) {
                        inhibitTaper = pM.p[1] ? true : false;
                     }
                  } else {
                     idata.stemsize -= idata.stemsize > .1 ? .1 : 0;
                  }
                  puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
                  turtle.setSize(idata.stemsize, inhibitTaper);
                  idata.gencode(`turtle.setSize(${idata.stemsize}, ${inhibitTaper});\n`);
                  break;
               }
               case '#': {    // increase or set stem/branch size
                  let inhibitTaper = false; // taper is default
                  if (isPM ) {
                     idata.stemsize = p0;
                     if (pM.p.length > 1) {
                        inhibitTaper = pM.p[1] ? true : false;
                     }
                  } else {
                     let os = turtle.getSize();
                     idata.stemsize = os+1;
                  }
                  puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
                  turtle.setSize(idata.stemsize, inhibitTaper);
                  idata.gencode(`turtle.setSize(${idata.stemsize}, ${inhibitTaper});\n`);
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
                     // idata.ci = turtle.TurtleState.trackMaterial;
                     // idata.stemsize = turtle.getSize();
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
                  if ( idata.inPolygon > 0) {
                     if (!isPM || p0 == '""') {
                        puts('ending polygon', NTRP_TRACKS);
                        turtle.endPolygon();
                        idata.gencode(`turtle.endPolygon();\n`);
                     } else {
                        puts('ending polygon as mesh ' + p0, NTRP_TRACKS);
                        turtle.endPolygon(p0);
                        idata.gencode(`turtle.endPolygon(${p0});\n`);
                     }
                     idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon - 1 : 0;
                     if (idata.inPolygon == 0) {
                        idata.ptCaptureMode = Turtle3d.CAPTURE_NONE; // turn off polygon capture
                     }
                  } else {
                     let tt = turtle.getDrawMode();
                     if (tt > Turtle3d.CAPTURE_NONE) {
                        puts(`--->>>end track: ${pmArgs}`, NTRP_TRACKS);
                        if (!isPM) {
                           turtle.endTrack();
                           idata.gencode(`turtle.endTrack(});\n`);
                           puts('ending track, type:' + tt, NTRP_TRACKS);
                        } else {
                           turtle.endTrack(p0);
                           idata.gencode(`turtle.endTrack(${p0});\n`);
                           puts('ending track, type:' + tt + ' to mesh: ' + p0, NTRP_TRACKS);
                        }
                     } else {
                        console.warn('Tried to end track when track capture not started!');
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
               case '@Ge': {
                  if (isPM) {
                     turtle.setTrackQuality(p0);
                     idata.gencode(`turtle.setTrackQuality(${p0});\n`);
                  }
                  let id = (pmArgs.length == 2) ? pmArgs[1] : null;
                  
                  turtle.endTrack(id);
                  idata.gencode(`turtle.endTrack(${id});\n`);
               }
                  break;
               case '.': // record a polygon or path point
                  turtle.storePoint(turtle.getPos());
                  idata.gencode(`turtle.storePoint(turtle.getPos());\n`);
                  puts(`added pt ${turtle.getPos()}, using "."`, NTRP_TRACKS);
                  break;
               case '@Gc': {
                  if (isPM) {
                     turtle.setTrackQuality({strips: p0});
                     idata.gencode(`turtle.setTrackQuality({strips: ${p0}});\n`);
                  }
                  // idata.cpoly.push(otoa(turtle.getPos()));
                  turtle.storePoint(turtle.getPos());
                  idata.gencode(`turtle.storePoint(turtle.getPos());\n`);
                  puts(`added pt ${turtle.getPos()}, using "."`, NTRP_TRACKS);
               }
                  break;
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
               case '@Gr': {    // set the radius curve for the spline
                  if (!isPM) {
                     console.warn('module @Gr requires two or four parameters!');
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
               case '@Cs': {
                  if (isPM) {
                     // we're capturing points for a contour. can specify
                     // number of final points, and open, 0, or closed, 1
                     let p1 = pM.p.length > 1 ? (pM.p[1] ?  true : false) : false; // s.b. 0 or 1
                     if (p0 == 0 || p0 > 1) {
                        turtle.beginContour(p0, p1);
                        idata.gencode(`turtle.beginContour(${p0}, ${p1}));\n`);
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
               case '@Ce': {
                  if (isPM) {
                     turtle.endContour(p0); // use default number of points = 8
                     idata.gencode(`turtle.endContour(${p0});\n`);

                     puts(`endContour(${p0})`, NTRP_CONTOUR);
                     puts(`getTrackShape(${p0}) = ${turtle.getTrackShape(p0)}`, NTRP_CONTOUR)
                  } else {
                     throw new Error('@Ce end Contour module requires an id parameter');
                  }

                  idata.ptCaptureMode = Turtle3d.CAPTURE_NONE;
                  break;
               }
               case '@Ca': {
                  let type = (isPM) ? p0 : 0;
                  let opts;
                  switch (type) {
                  case 0:       // arc through 3 last pts
                     turtle.generateContourSegment(Turtle3d.CONTOUR_ARC_3PT);
                     idata.gencode(`turtle.generateContourSegment(Turtle3d.CONTOUR_ARC_3PT);`);
                     break;
                  case 1: // arc center at pt1, start at pt2, radius-angle = p1
                     opts = pM.p.length > 1 ? {angle: pM.p[1]} : null;
                     turtle.generateContourSegment(Turtle3d.CONTOUR_ARC_CENTER, opts);
                     idata.gencode(`turtle.generateContourSegment(Turtle3d.CONTOUR_ARC_CENTER, ${opts});`);
                     break;
                  default:
                     throw new Error('@Ca: unsupported arc type: ' + p0);
                  }
               }
                  break;
               case '@Cb':
                  turtle.generateContourSegment(Turtle3d.CONTOUR_BEZIER);
                  idata.gencode(`turtle.generateContourSegment(Turtle3d.CONTOUR_BEZIER);\n`);
                  break;
               case '@Cm':
                  if (isPM && p0 >= 1) {
                     turtle.setContourMultiplicity(p0);
                     idata.gencode(`turtle.setContourMultiplicity(${p0};\n`);
                     puts(`setting multiplicity to ${p0}`, NTRP_CONTOUR);
                  } else {
                     throw new Error('@Cm(n) requires a parameter n >= 1 specifying multiplicity');
                  }
                  break;
               case '@Cn':
                  if (isPM && p0 >= 4) {
                     turtle.setContourSegmentPoints(p0);
                     idata.gencode(`turtle.setContourSegmentPoints(${p0};\n`);
                  } else {
                     console.warn('Contour segment points must >= 4');
                  }
                  break;
               case '@Cc': {
                  let opts = {npts: 0, isClosed: 0};
                  if (isPM && p0 >= 0) {
                     opts.npts = p0 > 2 || p0 == 0 ? p0 : 0;
                     if (pM.p.length > 1) {
                        opts.isClosed = pM.p[1] != 0;
                     }
                  }
                  turtle.generateContourSegment(Turtle3d.CONTOUR_CATMULLROM,opts);
                  idata.gencode(`turtle.generateContourSegment(Turtle3d.CONTOUR_CATMULLROM,${opts});`);
               }
                  break;
               case '@Ct':
                  if (isPM) {
                     if (pM.p.length == 2) {
                        turtle.setContourSegmentMultipliers(p0,pM.p[1]);                     
                        idata.gencode(`turtle.setContourSegmentMultipliers(${p0},${pM.p[1]});\n`);
                     } else {
                        throw new Error('@Ct hermite spline segment takes 0 or 2 arguments');  
                     }
                  }
                  turtle.generateContourSegment(Turtle3d.CONTOUR_HERMITE);
                  idata.gencode(`turtle.generateContourSegment(Turtle3d.CONTOUR_HERMITE);`);
                  break;
               case '@#': {
                  if (isPM) {
                     turtle.setTrackShape(p0);
                     idata.gencode(`turtle.setTrackShape(${p0});\n`);
                     puts (`setTrackShape(${p0})`, NTRP_CONTOUR);
                     //puts (`trackPath.shape = ${turtle.TurtleState.trackShape}`);
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
               case '?E':
                   isEnviroCall = true;
               case '?P':
               case '?H':
               case '?L':
               case '?U':
                 if (iDone >= 0) {
                   if (isPM) {
                     let tstate = turtle.getBasicState();
                     if (LogTag.areSet([NTRP_ENVIRO]) ) {
                       Object.keys(tstate).forEach((k) => { 
                         puts(`looking at key: ${k}`);
                         if ('PHLU'.includes(k)) {
                           for (const p of 'xyz') { 
                             puts(`tstate.${k}.${p} = ${tstate[k][p]}`);
                           }
                         }});
                     }
                     if (isEnviroCall) {
                       isEnviroCall = false; // reset
                       if (enviroInst === null) {
                         if (ls?.environmentClass) {
                           enviroInst = new ls.environmentClass();
                           puts(`Instantiated enviroClass ${enviroInst.name}`, NTRP_ENVIRO);
                         } else {
                           console.warn('no environment supplied. Using default for now');
                           // throw new Error('no environment supplied. bailing');
                           // break;
                           enviroInst = new enviroDefault();
                         }
                         ls.environment = enviroInst;
                       }
                       if (! enviroInst.isInitialized) {
                         let opts = ls.enviroInitOpts ?? {};
                         enviroInst.init(opts);
                         puts(`Called enviroInst.init(${JSON.stringify(opts)}): ${enviroInst.name}`, NTRP_ENVIRO);
                       }
                       puts(`enviroCall: ${enviroInst.name}`, NTRP_ENVIRO);
                       ePromises.push(enviroInst.update({mIndex: branchpos, mArgs: pmArgs, turtle: tstate}));
                     } else {
                       let i=0;
                       let tparam = m[1];
                       for (const p of 'xyz') {
                         //puts(`?${tparam}: tstate.${tparam}.${p} -> pmArgs[${i}] == ${tstate[tparam][p]}`, TRTL_SETGET);
                         pmArgs[i] = tstate[tparam][p];
                         i++;
                         if (i === pmArgs.length) break;
                       } 
                       puts(`Updated ?${tparam}(xxxx) to ?${tparam}(${pmArgs})`, NTRP_ENVIRO);
                     }
                   } else {
                     puts(`?X asks for turtle state, but no parameter supplied`);
                   }
                 }
                 break;
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
            } catch (error) {
               puts('Caught error in doSomeModules');
               reject(error);
               //return error;
               return
            }
            idata.mi++;         // for UI
         } while (i < idata.miCount && branches.length>0);


         ifcUpd.updateLsysInfo ({ndrawn: idata.mi});

         let userStop = ifcUpd.wantStop();
         if (branches.length == 0 || userStop) {
            if (userStop) puts('User requested stop');
            packItUp(t0);
            return;
         } else {
           if (idata.view?.continuousUpdate) {
             ifcUpd.updateView(idata.trackTag, idata.view);
           }
           doInterp();
         }
      }

      async function collectEnviroResponse(promises) {
         puts('results of enviroCall');
         let results = await Promise.all(promises);
         results.forEach((element) => {
           console.log(`mIndex: ${element.mIndex} <-- ${JSON.stringify(element)}`);
           let pM = lstring[element.mIndex];
           pM.p.forEach((e,i) => {pM.p[i] = element.argVals[i];
                                  console.log(`    param: ${i} = ${element.argVals[i]}`);});
         });
      }

      async function packItUp(turtle) {
         if (ePromises.length > 0) {
           enviroInst.finalize(ePromises);
           await collectEnviroResponse(ePromises);
         }

         let ts = turtle.getState()
         if (turtle.branchStack.length > 0) {
            puts(' done with lstring'); // , NTRP_INIT
            puts(`turtleMode: track=${ts.trackType}, drawMode=${ts.drawMode}, branchStacklength: ${turtle.branchStack.length}`); // , NTRP_PROGRESS
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

         ifcUpd.updateView(idata.trackTag, idata.view);

         ifcUpd?.updateTurtleInfo(ti,0);
         ifcUpd?.updateLsysInfo ({bgcolor: 'lightgreen', code: idata.code});
         resolve(true);
      }

   });

   return ipromise
}

/*
  temporary default environmental program
 */ 
class enviroDefault {
  zeropt = null;
  eResults;
  isInitialized = false;

  init(opts = {count: 0}) {
    this.zeropt = null;
    this.eResults = Array.from({length: opts.count});
    this.isInitialized = true;
  }

  update(input) {
    puts(`enviroDefault entry\nTurtle position: ${JSON.stringify(input.turtle.P)}, moduleIndex: ${input.mIndex}, moduleArgs: ${input.mArgs}`);
    
    let eresult = {mIndex: input.mIndex, argVals: []}; // must return module index
    let tstr = 'xyz';
    let tndx = 0;
    eresult.argVals.push(input.mArgs[0]); // no change
    if (input.mArgs[0] === 0) {
      if (this.zeropt === null){
        this.zeropt = 0;
        eresult.argVals.push(0);
      } 
      // this shouldn't happen
    } else {
      this.zeropt++;
      if (input.mArgs[0] % 4 === 0) {
        eresult.argVals.push(1);
      } else {
        eresult.argVals.push(0);
      }
    }
/* 
 *  from here to the end is pretty much boilerplate
 */
    // eResults and the epromises are parallel, there must be
    // one eresult per promise. The promise may already be resolved,
    // but here we wait until the finalize call

    this.eResults.push(eresult);

    return new Promise((res, rej) => {
      eresult.resolve = res;
      eresult.reject = rej;
    });
  }

  async finalize(){
    /* here is where'd you put some delayed computation
       compute eresults;
       -- or you could have been doing it asynchronously in the background
       -- then here's where you'd wait for it to complete
    */
    console.log(JSON.stringify(this.eResults));
    this.eResults.forEach((eresult) => eresult.resolve(eresult));
    this.isInitialized = false;
  }
}
