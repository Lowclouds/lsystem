#define STEPL 0.5
#define STEPA 3
#define LEAFL 30
#define STEPW 0.1
#define STEM 0.7
#define ISTEM 0.1
derivation length:40
stemsize=STEM

axiom: C;(85)[F(5))B(1)]
A(t) : t<=5 ->  #(t*STEPW)F(STEPL)-(STEPA)A(t+1)
A(t) : (t>=LEAFL-5) and (t <= LEAFL) -->  #((LEAFL-t)*STEPW)F(STEPL)-(STEPA)A(t+1)
A(t) --> F(STEPL)-(STEPA)A(t+1)
B(u) : u < 4 --> F(5)\60)[-(30);(2)@#('leaf')A(1)]#(STEM - u*ISTEM))B(u+1)
B(u) : u == 4 --> F(1)#(0.1)F(1)#(0.25)
C --> @Ds('leaf')D@De('leaf')@m(0,0,0)
D --> @m(-3,-1,0).@m(-2.7,-0.3,0).@m(-2,0,0).@m(2,0,0).@m(2.7,-0.3,0).@m(3,-1,0).



/*
define: {
   var oakleaf = function (trt) {
      let ts = trt.getState()
      trt.home();
      trt.penUp();
      trt.goto(-10,0,0);
      trt.pitch(-70);
      trt.setSize(0.02);
      //trt.penDown();
      
      trt.beginContour("oakleaf");

      trt.drawDisc(0.1); trt.updateContour();

      for (let i=10; i >= 0; i--) {
         trt.fd(0.6); 
         trt.drawDisc(0.1); trt.updateContour();
         trt.pitch(6);
      }
      for(let i=6; i>=0;i--) {
         trt.fd(.746); 
         trt.drawDisc(0.1); trt.updateContour();
         trt.pitch(1);
      }
      for (let i=20; i> 0; i--) {
         trt.fd(0.05); trt.updateContour(); trt.pitch(18);
      }
      trt.pitch(-6);
      
      for(let i=6; i>=0;i--) {
         trt.fd(.746); trt.pitch(1);
         trt.drawDisc(0.1); trt.updateContour();

      }
      for (let i=10; i >= 0; i--) {
         trt.fd(0.6); trt.pitch(6);
         trt.drawDisc(0.1); trt.updateContour();
      }
      trt.endContour('oakleaf');
      trt.setState(ts);
      return 'oakleaf';
   }
}
*/
