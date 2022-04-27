// 
// connect lsystem with turtle, implementing interpretation step
// 
//var colorTableDefault = initCTable();

// var interpdata = {
//    step:  1,
//    stemsize: 0.05,
//    delta: 90,
//    ndelta: -90,
//    stack: [],
//    ci: 0,                       // color index
//    notInPolygon: true,
//    mi: 0,                       // module index
//    ctable:  colorTableDefault,
//    cpoly: null
// }

// function interpdataShow() {
//    return `step: ${interpdata.step}, stemsize: ${interpdata.stemsize}, delta: ${interpdata.delta}`;
// }

// This links the lsystem generator with turtle graphics

function turtleInterp (ti, ls, opts=null) {
   let desiredFps = 10;

   idata = {
      step:  1,
      stemsize: 0.1,
      delta: 90,
      ndelta: -90,

      ci: 0,                       // color index
      inPolygon: 0,                // not
      ptCaptureMode: Turtle3d.CAPTURE_NONE, // 
      mi: 0,                       // module index
      miCount: 2000,               // number of modules to interpret/frame
      interval: 1000 / (10 * desiredFps),
      lastTime: performance.now(),
      ctable:  null,
      //ctable: colorTableDefault,
      cpoly: null,
      useTracksAlways: false,
      code: ''
   }
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
   idata.ndelta= -1*idata.delta,
   ti.setSize(idata.stemsize, true); //this sets both size and lastsize to stemsize
   idata.code  += 'ti.setSize(' + idata.stemsize + ', true);\n';
   //  ti.fd(0); // this was the first way; i waffle
   if (idata.ctable != null && idata.ctable != []) {
      ti.deleteMaterials();
      let numMat = ti.materialList.length;
      idata.ctable.forEach((e) => {
         ti.addMaterial(null, e);
         puts(`add material w/color: ${e}`);
      }); 
      ti.setMaterial(1);
      puts(`set ${ti.getTurtle()} material to idx ${numMat}, color ${ti.getColor()}`);
   }
   lblNumDrawn.textContent = 0;
   ti.hide();
   ti.penDown();
   idata.code  += 'ti.hide();\n';
   idata.code  += 'ti.penDown();\n';
   branchstack = [];
   polygonstack = [];
   let tree = ls.current;
   puts(`lsystem has ${tree.length} modules`);
   puts(`using settings: ` + idata.show());
   
   if (idata.useTrackAlways) {
      ti.newTrack();
      code += 'ti.newTrack();\n'
   }
   let ts = ti.getState()
   puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`);

   function doModule () {
      let i;
      let isPM = false;

      if (idata.mi < tree.length) {
         rAF = requestAnimationFrame(doModule); 

         let now = performance.now();
         let delta = now - idata.lastTime;
         if (delta < idata.interval) {
            // ease off on number of modules to interpret
            idata.miCount *= 0.95;
            return;
         } else {
            idata.miCount *=1.05;
         }
      } else {
         let ts = ti.getState()
         if (ti.branchStack.length > 0) {
            puts(' done with tree');
            puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`);
            //   puts(`tp.shape is: ${ti.getState().trackPath.shape}`);
            if (idata.useTrackAlways || ts.trackPath != null) {
               ti.endTrack();
               idata.code  += 'ti.endTrack();\n';
            }           
         } else {
            if (idata.useTrackAlways || ts.trackPath != null) {
               ti.endTrack();
               idata.code  += 'ti.endTrack();\n';
            }           
            puts('done with tree and ti.branchStack.length == 0');
         }
         updateTurtleInfo(ti,0);
         lblNumDrawn.backgroundColor = "green";
         lsCode.value = idata.code;
      }

      for (i=idata.mi; i < Math.min(tree.length, idata.mi+idata.miCount); i++) {
         let pM = tree[i];
         puts(pM.toString(), NTRP_PROGRESS);
         //puts(ti.getPos());
         let m;
         let pmArg, p0;         // most functions have only one parameter
         if (typeof pM == 'string') {
            m = pM
            pmArg=null;
            isPm = false;
         } else {
            m = pM.m;
            p0 = pM.p[0];
            isPm = true;
         }
         switch (m) {
         case 'F': {
            let d = isPm ? p0 : idata.step;
            idata.code  += 'ti';
            if (! ti.isPenDown()) {
               ti.penDown();
               idata.code += '.pd()';
            }
            ti.forward(d);
            idata.code  += `.fd(${d});\n`;
            //puts('fd: ' + d);
            break;
         }
         case 'f': {
            let d = isPm ? p0 : idata.step;
            let pState = ti.isPenDown();
            idata.code += 'ti';
            if (pState) {
               ti.penUp();
               idata.code  += '.pu()';
            }
	    ti.forward(d); 
	    idata.code  += `.fd(${d})`;

            if (pState) {
               ti.penDown();
               idata.code  += 'ti.pd()';
            }
            idata.code += ';\n';
            break;
         }
         case 'G': {
            let d = isPm ? p0 : idata.step;
            idata.code  += 'ti';
            if (! ti.isPenDown()) {
               ti.penDown();
               idata.code += '.pd()';
            }
            ti.forward(d, false);
	    idata.code  += `.fd(${d},false);\n`;
            //puts('Gfd: ' + d);
            break;
         }
         case 'g': {
            let d = isPm ? p0 : idata.step;
            let p = ti.isPenDown();
            idata.code  += 'ti';
            if (p) {
               ti.penUp();
               idata.code  += '.pu()';
            }
	    ti.forward(d,false); 
	    idata.code  += `.fd(${d},false)`;
            if (p) {
               ti.penDown();
               idata.code  += '.pd()';
            }
            idata.code  += ';\n';
            // puts('gfd: ' + d);
            break;
         }
         case '@M': {
            if (isPm) {
               ti.goto(pM.p[0], pM.p[1],pM.p[2]);
               idata.code  += `ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]});\n`;
               puts(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`);
            } else {
               throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
            }
            break;
         }
         case '@m': {
            if (isPm) {
               let p = ti.isPenDown();
               idata.code  += 'ti';
               if (p) {
                  ti.penUp();
                  idata.code  += '.pu()';
               }
               ti.goto(pM.p[0], pM.p[1],pM.p[2]);
               idata.code  += `.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`;
               if (p) {
                  ti.penDown();
                  idata.code  += '.pd()';
               }
               idata.code += ';\n';
               puts(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`);
            } else {
               throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
            }
            break;
         }
         case '@O': {
            ti.drawSphere(p0);
            idata.code  += `ti.drawSphere(${p0});\n`;
            break;
         }
         case '@o': {
            ti.drawDisc(p0);
            idata.code  += `ti.drawDisc(${p0});\n`;
            break;
         }
         case '+': {            // yaw left
            let a = isPm ? p0 : idata.delta;
            ti.yaw(a);
            idata.code  += `ti.yaw(${a});\n`;
            // puts('yaw: ' + a);
            break; }
         case '-': {            // yaw right
            let a = -1*(isPm ? p0 : idata.delta);
            ti.yaw(a);
            idata.code  += `ti.yaw(${a});\n`;
            // puts('yaw: ' + a);
            break; }
         case '&': {            // pitch down
            let a = isPm ? p0 : idata.delta;
            ti.pitch(a);
            idata.code  += `ti.pitch(${a});\n`;
            //puts('pitch: ' + a);
            break; }
         case '^': {            // pitch up
            let a = -1*(isPm ? p0 : idata.delta);
            ti.pitch(a);
            idata.code  += `ti.pitch(${a});\n`;
            //puts('pitch: ' + a);
            break; }
         case '\\': {           // roll left
            let a = isPm ? p0 : idata.delta;
            ti.roll(a);
            idata.code  += `ti.roll(${a});\n`;
            //puts('roll: ' + a);
            break; }
         case '/': {            // roll right
            let a = -1*(isPm ? p0 : idata.delta);
            ti.roll(a); 
            idata.code  += `ti.roll(${a});\n`;
            //puts('roll: ' + a);
            break; }
         case '|': {
            ti.yaw(180); 
            idata.code  += `ti.yaw(180);\n`;
            break;
         }
         case '@R':             // set heading
            if (isPm) {
               if (pM.p.length >= 3 ) {
                  ti.setHeading(pM.p[0], pM.p[1], pM.p[2]);
                  idata.code  += `ti.setHeading(${pM.p[0]}, ${pM.p[1]}, ${pM.p[2]});\n`;
                  if ( pM.p.length == 6) {
                     ti.setUp(pM.p[3], pM.p[4], pM.p[5]);
                     idata.code  += `ti.setUp(${pM.p[3]}, ${pM.p[4]}, ${pM.p[5]});\n`;
                  } else if (pM.p.length !=3 ) {
                     throw new Error(`@R / setheading requires 3 or 6 parameters: ${pM.p}`);
                  }
               }
               puts(`heading: ${pM}`,NTRP_SETTING);
            } else {
               throw new Error('@R / setheading requires 3 or 6 parameters');
            }
            break;
         case '@v': {            // set L horizontal
            ti.levelL();
            idata.code  += `ti.levelL()`;
            break;
         }   
         case '!': {   // decrease or set stem/branch size
            if (isPm ) {
               idata.stemsize = p0;
            } else {
               idata.stemsize -= idata.stemsize > 1 ? 1 : 0;
            }
            puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
            ti.setSize(idata.stemsize);
            idata.code  += `ti.setSize(${idata.stemsize});\n`;
            break;
         }
         case '#': {    // increase or set stem/branch size
            if (isPm ) {
               idata.stemsize = p0;
            } else {
               idata.stemsize += 1;
            }
            puts(`set stemsize to: ${idata.stemsize}`, NTRP_SIZE);
            ti.setSize(idata.stemsize);
            idata.code  += `ti.setSize(${idata.stemsize});\n`;
            break;
         }
         case "'": {            // increment color table index
            if (isPm) {
               mi = p0;
            } else { 
               mi = t.getMaterialIdx();
               mi--;
            }
            ti.setMaterial(mi);
            idata.code  += `ti.setMaterial(${mi});\n`;
            // idata.ci %= idata.ctable.length;
            // ti.setColor(idata.ctable[idata.ci]);
            break;
         }
         case ';': {
            let mi;
            if (isPm) {
               mi = p0;
            } else { 
               mi = t.getMaterialIdx();
               mi++;
            }
            //puts(`setMaterial(${mi})`);
            ti.setMaterial(mi);
            idata.code  += `ti.setMaterial(${mi});\n`;
            break;
         }
         case '\[': {           // start a branch
            ti.newBranch({ci: idata.ci, st: idata.st});
            if (idata.useTracksAlways) {
               ti.newTrack('p0');
               puts('newTrack: p0', NTRP_MOTION);
               ti.storePoint();
            }
            // ti.newMesh();
            break;
         }
         case '\]': {           // end a branch
            if (idata.useTracksAlways) {
               ti.endTrack();
               idata.code  += 'ti.endTrack();\n';
            }
            let s = ti.endBranch();
            idata.code  += `ti.endBranch();\n`;
            idata.ci = ti.trackMaterial;
	    idata.stemsize = ti.getSize();
            break;
         }
         case '{': {
            if (!isPm) {
               idata.inPolygon++;
               idata.ptCaptureMode = Turtle3d.CAPTURE_POLYGON; // turn on polygon pt capture
               ti.newPolygon();
               idata.code  += `ti.newPolygon();\n`;
               idata.cpoly = [];
            } else {
               let ptype;
               switch (p0) {
               case 0:          // TABOP says this s.b. polygon, but we make it a path
               case 1:          // hermite open
               case 2:          // hermite closed
               case 3:          // bspline open
               case 4:          // bspline closed
               case '0':          // TABOP says this s.b. polygon, but we make it a path
               case '1':          // hermite open
               case '2':          // hermite closed
               case '3':          // bspline open
               case '4':          // bspline closed
                  ptype = 'p'+p0;
                  break;
               default:
                  puts('capture type of ' + p0 + 'not supported');
               }
               ti.newTrack('p0');
               idata.code  += `ti.newTrack(${ptype});\n`;
               puts(`Starting new Track, type: ${ptype}`);
            }
            break;}
         case '}': {
            if (!isPm) {
               if ( idata.inPolygon > 0) {
                  puts('ending polygon');
                  ti.endPolygon();
                  idata.code  += `ti.endPolygon();\n`;
                  idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon - 1 : 0;
                  if (idata.inPolygon < 1) {
                     idata.ptCaptureMode = Turtle3d.CAPTURE_NONE; // turn off polygon capture
                  }
               } else {
                  puts('end polygon attempted when no polygon started');
               }
            } else {
               ti.endTrack();
               idata.code  += `ti.endTrack();\n`;
            }
            break;
         }
         case '.': {            // record a polygon or path point
           // idata.cpoly.push(otoa(ti.getPos()));
            ti.storePoint(ti.getPos());
            idata.code  += `ti.storePoint(ti.getPos());\n`;
            //puts(`added pt ${ti.getPos()}, using "."`);
            break;
         }
         case '@Ds': {
            if (isPm) {
               // we're capturing points for a contour, but the contour, 
               // itself can be a plain path, or a spline of some type
               let p1 = pM.p.length > 1 ? pM.p[1] : Turtle3d.PATH_POINTS;
               ti.beginContour(p0, p1, p0) ;
               idata.code  += `ti.beginContour('${p0}', ${p1}, '${p0}');\n`;
               idata.ptCaptureMode = Turtle3d.CAPTURE_CONTOUR;
            } else {
               throw new Error('@Ds module requires an id/name parameter');
            }
            break;
         }
         case '@De': {
            if (isPm) {
               let cid = ti.endContour(p0);
               idata.code  += `ti.endContour('${p0}');\n`;
               puts(`endContour(${cid})`);
               puts(`trackContours.get(${cid}) = ${ti.trackContours.get(cid)}`)
            } else {
               throw new Error('@De end Contour module requires an id parameter');
            }
            idata.ptCaptureMode = Turtle3d.CAPTURE_NONE;
            break;
         }
         case '@#': {
            if (isPm) {
               ti.setTrackShape(p0);
               idata.code  += `ti.setTrackShape('${p0}');\n`;
               puts (`setTrackShape('${p0}')`);
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
   }


   doModule();

  // for (const m of ls.current) {
  //   if (idata.mi % 500 == 0) {puts(`${idata.mi} of ${ls.current.length}`);}
  //   idata = await doModule(t,m,idata);
  //   idata.mi++;
  // }
}

function otoa (o) {
   let a = new Array();
   a.push(o.x); a.push(o.y); a.push(o.z);
   return a;
}
