var colorTableDefault = [0,0,0];

function initCTable () {
   let cmm = [[0,0,0],[1,1,1],[1,1,0],[1,0,1],[0,1,1],[1,0,0],[0,1,0],[0,0,1]];
   let cstep = 32/256;
   let delta = 0.1
   for (let i=1, s=0; s < cmm.length; s++) {
      for (let t=s+1; t < cmm.length; t++) {
         puts(`from ${cmm[s]} to ${cmm[t]}`);

         if (t==s) {
            puts(`s: ${s}, t:${t}: skipping this iteration`);
         } else {
            let r = cmm[s][0], r1 = cmm[t][0];
            let g = cmm[s][1], g1 = cmm[t][1];
            let b = cmm[s][2], b1 = cmm[t][2];
            let rstep = (r == r1) ? 0 : (r < r1) ? cstep : -1*cstep;
            let gstep = (g == g1) ? 0 : (g < g1) ? cstep : -1*cstep;
            let bstep = (b == b1) ? 0 : (b < b1) ? cstep : -1*cstep;

            for (let rep = 0; rep < Math.floor(1/cstep); rep++) {
               r += rstep;
               g += gstep;
               b += bstep;
               colorTableDefault[i] = [r,g,b];
               puts(`s: ${s}, t:${t}, i:${i}, [${r},${g},${b}]`);
               i++;
               if (i > 255) {break;}
            }
            if (i > 255) {break;}
         }
         if (i > 255) {break;}
      }
   }
}
