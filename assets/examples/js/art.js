// from necips, playground https://playground.babylonjs.com/#2IUA4B#0
function art(trt) {
   let contour = []
   contour.push([0,0,0]);
   contour.push(0.5,0,0]);
   contour.push([0.5,0.1,0]);
   contour.push([-0.5,0.1,0]);
   contour.push([-0.5,0,0]);
   contour.push([0,0,0]);

   trt.setSize(1,true);
   trt.addTrackShape('flat', contour);
   trt.setTrackShape('flat');         

   let oldHeading = trt.getH();
   trt.penUp();
   trt.goto(1,1,1);
   for (let i = 0; i< 36; i++) {
      trt.penDown();
      trt.setHeading(-1,0,0);
      trt.setUp(0,1,0);
       for (let j = 0; j< 36; j++) {
          trt.fd(15);
          trt.pitch(-10);
       }
      trt.setHeading(oldHeading.x,oldHeading.y,oldHeading.z);
      trt.setUp(0,1,0);
      trt.penUp();
      trt.lt(10);
      trt.fd(15);
      oldHeading = trt.getH();
   }
}
