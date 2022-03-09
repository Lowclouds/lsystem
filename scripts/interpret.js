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
   idata = {
      step:  1,
      stemsize: 0.1,
      delta: 90,
      ndelta: -90,

      ci: 0,                       // color index
      inPolygon: 0,                // not
      ptCaptureMode: 0,             // we're going to use bit manipulation here
      mi: 0,                       // module index
      ctable:  null,
      //ctable: colorTableDefault,
      cpoly: null,
      useTracksAlways: true
   }
   idata.show =  function () {
      return `step: ${this.step}, stemsize: ${this.stemsize}, delta: ${this.delta}`;
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
   ti.hide();
   ti.penDown();
   branchstack = [];
   polygonstack = [];
   let tree = ls.current;
   puts(`lsystem has ${tree.length} modules`);
   puts(`using settings: ` + idata.show());

   function doModule () {
      let i;
      let isPM = false;
      
      for (i=idata.mi; i < Math.min(tree.length, idata.mi+2000); i++) {
         let pM = tree[i];
         //puts(pM.toString());
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
            ti.penDown();
            ti.forward(d);
            if (idata.ptCaptureMode) {
               ti.storePoint(ti.getPos());
            }
            //puts('fd: ' + d);
            break;
         }
         case 'f': {
            let d = isPm ? p0 : idata.step;
            let pState = ti.isPenDown();
            if (pState) {
               ti.penUp();
            }
	    ti.forward(d); 
            if (idata.ptCaptureMode) {
               ti.storePoint();
            }
            if (pState) {
               ti.penDown();
            }
            break;
         }
         case 'G': {
            let d = isPm ? p0 : idata.step;
            ti.penDown();
            ti.forward(d);
            //puts('Gfd: ' + d);
            break;
         }
         case 'g': {
            let d = isPm ? p0 : idata.step;
            let p = ti.isPenDown();
            if (p) {
               ti.penUp();
            }
	    ti.forward(d); 
            if (p) {
               ti.penDown();
            }
            // puts('gfd: ' + d);
            break;
         }
         case '@M': {
            if (isPm) {
               ti.goto(pM.p[0], pM.p[1],pM.p[2]);
               puts(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`);
            } else {
               throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
            }
            break;
         }
         case '@m': {
            if (isPm) {
               let p = ti.isPenDown();
               if (p) {
                  ti.penUp();
               }
               ti.goto(pM.p[0], pM.p[1],pM.p[2]);
               if (p) {
                  ti.penDown();
               }
               puts(`ti.goto(${pM.p[0]}, ${pM.p[1]},${pM.p[2]})`);
            } else {
               throw new Error('module @M requires three x,y,z parameters not ' + pM.toString());
            }
            break;
         }
         case '@O': {
            ti.drawSphere(p0);
            break;
         }
         case '@o': {
            ti.drawDisc(p0);
            break;
         }
         case '+': {            // yaw left
            let a = isPm ? p0 : idata.delta;
            ti.yaw(a);
            // puts('yaw: ' + a);
            break; }
         case '-': {            // yaw right
            let a = -1*(isPm ? p0 : idata.delta);
            ti.yaw(a);
            // puts('yaw: ' + a);
            break; }
         case '&': {            // pitch down
            let a = isPm ? p0 : idata.delta;
            ti.pitch(a);
            //puts('pitch: ' + a);
            break; }
         case '^': {            // pitch up
            let a = -1*(isPm ? p0 : idata.delta);
            ti.pitch(a);
            //puts('pitch: ' + a);
            break; }
         case '\\': {           // roll left
            let a = isPm ? p0 : idata.delta;
            ti.roll(a);
            //puts('roll: ' + a);
            break; }
         case '/': {            // roll right
            let a = -1*(isPm ? p0 : idata.delta);
            ti.roll(a); 
            //puts('roll: ' + a);
            break; }
         case '|': {
            ti.yaw(180); 
            break;
         }
         case '@R':             // set heading
            if (isPm) {
               if (pM.p.length >= 3 ) {
                  ti.setHeading(pM.p[0], pM.p[1], pM.p[2]);
                  if ( pM.p.length == 6) {
                     ti.setUp(pM.p[3], pM.p[4], pM.p[5]);
                  } else if (pM.p.length !=3 ) {
                     throw new Error(`@R / setheading requires 3 or 6 parameters: ${pM.p}`);
                  }
               }
            } else {
               throw new Error('@R / setheading requires 3 or 6 parameters');
            }
            break;
         case '@v': {            // set L horizontal
            ti.levelL();
            break;
         }   
         case '!': {   // decrease or set stem/branch size
            if (isPm ) {
               idata.stemsize = p0;
            } else {
               idata.stemsize -= idata.stemsize > 1 ? 1 : 0;
            }
            //puts(`set stemsize to: ${idata.stemsize}`);
            ti.setSize(idata.stemsize);
            break;
         }
         case '#': {    // increase or set stem/branch size
            if (isPm ) {
               idata.stemsize = p0;
            } else {
               idata.stemsize += 1;
            }
            //puts(`set stemsize to: ${idata.stemsize}`);
            ti.setSize(idata.stemsize);
            break;
         }
         case "'": {            // increment color table index
            let mi = ti.getMaterialIdx()
            mi--;
            ti.setMaterial(mi); // 
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
            break;
         }
         case '\[': {           // start a branch
            ti.newBranch({ci: idata.ci, st: idata.st});
            if (idata.useTracksAlways) {
               ti.newTrack('p0');
               puts('newTrack: p0', NTRP_MOTION);
            }
            // ti.newMesh();
            break;
         }
         case '\]': {           // end a branch
            if (idata.useTracksAlways) {
               ti.endTrack();
            }
            let s = ti.endBranch();
            idata.ci = ti.trackMaterial;
	    idata.stemsize = ti.getSize();
            break;
         }
         case '{': {
            idata.inPolygon++;
            idata.ptCaptureMode |= 1; // turn on polygon pt capture
            ti.newPolygon();
            idata.cpoly = [];
            break;}
         case '}': {
            if ( idata.inPolygon > 0) {
               puts('ending polygon');
               ti.endPolygon();
               idata.inPolygon = idata.inPolygon > 0 ? idata.inPolygon - 1 : 0;
               if (idata.inPolygon < 1) {
                  idata.ptCaptureMode ^= 1; // turn off polygon capture
               }
            } else {
               puts('end polygon attempted when no polygon started');
            }
            break;
         }
         case '.': {            // record a polygon point
           // idata.cpoly.push(otoa(ti.getPos()));
            if (idata.ptCaptureMode) {
               ti.storePoint();
               //puts(`added pt ${ti.getPos()}, using "."`);
            } else {
               throw new Error(`saw "." while not in ptCaptureMode`);
            }
            //puts(`save state in polygon mode: ${ti.getPos()}`)
            break;
         }
         case '@Ds': {
            if (isPm) {
               let p1 = pM.p.length > 1 ? pM.p[1] : 0;
               ti.beginContour(p0, p1, null) ;
               idata.ptCaptureMode |= 2;
            } else {
               throw new Error('@Ds module requires an id/name parameter');
            }
            break;
         }
         case '@De': {
            if (isPm) {
               ti.endContour(p0);
               puts(`endContour(${p0})`);
               puts(`trackContours.get(${p0}) = ${ti.trackContours.get(p0)}`)
            }
            idata.ptCaptureMode ^= 2; 
            break;
         }
         case '@#': {
            if (isPm) {
               ti.setTrackShape(p0);
               puts (`setTrackShape(${p0})`);
               puts (`trackPath.shape = ${ti.TurtleState.trackPath.shape}`);
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
      //updateTurtleInfo(t,0);
      lblNumDrawn.textContent=i;
      if (i < tree.length) {
         idata.mi = i;
         rAF = requestAnimationFrame(doModule); 

         // if (i % 2500 != 0) {
         //    setTimeout(doModule,1000);  
         // } else {
         //    setTimeout(doModule,100);
         // }
      } else {
         let ts = ti.getState()
         if (ti.branchStack.length > 0) {
            puts(' done with tree');
            puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`);
            //   puts(`tp.shape is: ${ti.getState().trackPath.shape}`);
            if (idata.useTrackAlways || ts.trackPath != null) {
               ti.endTrack();
            }           
         } else {
            if (idata.useTrackAlways || ts.trackPath != null) {
               ti.endTrack();
            }           
            puts('done with tree and ti.branchStack.length == 0');
         }
         updateTurtleInfo(ti,0);
         lblNumDrawn.backgroundColor = "green";
      }
   }

   if (idata.useTrackAlways) {      ti.newTrack();
   }
   let ts = ti.getState()
   puts(`turtleMode: track=${ts.track}, drawMode=${ts.drawMode}, branchStacklength: ${ti.branchStack.length}`);

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
