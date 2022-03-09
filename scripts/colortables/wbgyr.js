function initCTable () {
   let ctable=[];
   let cmm = [[0,1,0],[1,1,0],[1,0,1],[0,1,1],[1,0,0],[0,0,1],[0,0,0],[1,1,1]];
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
               ctable[i] = [r,g,b];
               puts(`s: ${s}, t:${t}, i:${i}, [${r},${g},${b}]`);
               i++;
               if (i > 255) {break;}
            }
            if (i > 255) {break;}
         }
         if (i > 255) {break;}
      }
   }
   // return ctable;
   return [[0.996,0.996,0.996],
           [0.984,0.992,0.996],
           [0.977,0.988,0.996],
           [0.965,0.984,0.992],
           [0.953,0.98,0.992],
           [0.945,0.977,0.992],
           [0.934,0.973,0.992],
           [0.922,0.969,0.988],
           [0.914,0.965,0.988],
           [0.902,0.961,0.988],
           [0.895,0.957,0.988],
           [0.883,0.953,0.988],
           [0.871,0.949,0.984],
           [0.863,0.945,0.984],
           [0.852,0.941,0.984],
           [0.84,0.938,0.984],
           [0.832,0.934,0.984],
           [0.82,0.93,0.98],
           [0.809,0.926,0.98],
           [0.801,0.922,0.98],
           [0.789,0.918,0.98],
           [0.777,0.914,0.977],
           [0.77,0.91,0.977],
           [0.758,0.906,0.977],
           [0.746,0.902,0.977],
           [0.738,0.898,0.977],
           [0.727,0.895,0.973],
           [0.715,0.891,0.973],
           [0.707,0.887,0.973],
           [0.695,0.883,0.973],
           [0.688,0.879,0.973],
           [0.676,0.875,0.969],
           [0.664,0.871,0.969],
           [0.656,0.867,0.969],
           [0.645,0.863,0.969],
           [0.633,0.859,0.965],
           [0.613,0.852,0.965],
           [0.605,0.844,0.961],
           [0.594,0.836,0.957],
           [0.586,0.828,0.949],
           [0.578,0.82,0.945],
           [0.57,0.813,0.941],
           [0.559,0.805,0.938],
           [0.551,0.797,0.93],
           [0.543,0.789,0.926],
           [0.531,0.781,0.922],
           [0.523,0.77,0.918],
           [0.516,0.762,0.914],
           [0.504,0.754,0.906],
           [0.496,0.746,0.902],
           [0.488,0.738,0.898],
           [0.48,0.73,0.895],
           [0.469,0.723,0.891],
           [0.461,0.715,0.883],
           [0.453,0.707,0.879],
           [0.441,0.699,0.875],
           [0.434,0.691,0.871],
           [0.426,0.684,0.863],
           [0.414,0.676,0.859],
           [0.406,0.668,0.855],
           [0.398,0.66,0.852],
           [0.391,0.652,0.848],
           [0.379,0.645,0.84],
           [0.371,0.637,0.836],
           [0.363,0.625,0.832],
           [0.352,0.617,0.828],
           [0.344,0.609,0.824],
           [0.336,0.602,0.816],
           [0.324,0.594,0.813],
           [0.316,0.586,0.809],
           [0.309,0.578,0.805],
           [0.301,0.57,0.797],
           [0.281,0.555,0.789],
           [0.281,0.559,0.773],
           [0.281,0.563,0.762],
           [0.281,0.566,0.746],
           [0.281,0.57,0.734],
           [0.281,0.574,0.719],
           [0.281,0.578,0.707],
           [0.281,0.582,0.691],
           [0.281,0.586,0.676],
           [0.281,0.59,0.664],
           [0.281,0.598,0.648],
           [0.281,0.602,0.637],
           [0.281,0.605,0.621],
           [0.281,0.609,0.609],
           [0.281,0.613,0.594],
           [0.281,0.617,0.578],
           [0.281,0.621,0.566],
           [0.281,0.625,0.551],
           [0.281,0.629,0.539],
           [0.285,0.633,0.523],
           [0.285,0.637,0.512],
           [0.285,0.641,0.496],
           [0.285,0.645,0.484],
           [0.285,0.648,0.469],
           [0.285,0.652,0.453],
           [0.285,0.656,0.441],
           [0.285,0.66,0.426],
           [0.285,0.664,0.414],
           [0.285,0.672,0.398],
           [0.285,0.676,0.387],
           [0.285,0.68,0.371],
           [0.285,0.684,0.355],
           [0.285,0.688,0.344],
           [0.285,0.691,0.328],
           [0.285,0.695,0.316],
           [0.285,0.699,0.301],
           [0.285,0.707,0.273],
           [0.305,0.711,0.277],
           [0.324,0.719,0.277],
           [0.34,0.723,0.281],
           [0.359,0.73,0.281],
           [0.379,0.734,0.285],
           [0.398,0.738,0.289],
           [0.414,0.746,0.289],
           [0.434,0.75,0.293],
           [0.453,0.754,0.293],
           [0.473,0.762,0.297],
           [0.492,0.766,0.301],
           [0.508,0.773,0.301],
           [0.527,0.777,0.305],
           [0.547,0.781,0.305],
           [0.566,0.789,0.309],
           [0.586,0.793,0.313],
           [0.602,0.797,0.313],
           [0.621,0.805,0.316],
           [0.641,0.809,0.316],
           [0.66,0.816,0.32],
           [0.676,0.82,0.32],
           [0.695,0.824,0.324],
           [0.715,0.832,0.328],
           [0.734,0.836,0.328],
           [0.754,0.84,0.332],
           [0.77,0.848,0.332],
           [0.789,0.852,0.336],
           [0.809,0.859,0.34],
           [0.828,0.863,0.34],
           [0.848,0.867,0.344],
           [0.863,0.875,0.344],
           [0.883,0.879,0.348],
           [0.902,0.883,0.352],
           [0.922,0.891,0.352],
           [0.938,0.895,0.355],
           [0.957,0.902,0.355],
           [0.977,0.906,0.359],
           [0.977,0.895,0.355],
           [0.977,0.879,0.348],
           [0.977,0.867,0.344],
           [0.973,0.852,0.336],
           [0.973,0.84,0.332],
           [0.973,0.828,0.328],
           [0.973,0.813,0.32],
           [0.973,0.801,0.316],
           [0.973,0.785,0.313],
           [0.973,0.773,0.305],
           [0.973,0.762,0.301],
           [0.969,0.746,0.293],
           [0.969,0.734,0.289],
           [0.969,0.719,0.285],
           [0.969,0.707,0.277],
           [0.969,0.695,0.273],
           [0.969,0.68,0.27],
           [0.969,0.668,0.262],
           [0.965,0.652,0.258],
           [0.965,0.641,0.25],
           [0.965,0.625,0.246],
           [0.965,0.613,0.242],
           [0.965,0.602,0.234],
           [0.965,0.586,0.23],
           [0.965,0.574,0.227],
           [0.961,0.559,0.219],
           [0.961,0.547,0.215],
           [0.961,0.535,0.207],
           [0.961,0.52,0.203],
           [0.961,0.508,0.199],
           [0.961,0.492,0.191],
           [0.961,0.48,0.188],
           [0.961,0.469,0.184],
           [0.957,0.453,0.176],
           [0.957,0.441,0.172],
           [0.957,0.414,0.16],
           [0.953,0.406,0.16],
           [0.949,0.398,0.16],
           [0.945,0.391,0.16],
           [0.941,0.383,0.16],
           [0.938,0.375,0.16],
           [0.934,0.367,0.16],
           [0.934,0.359,0.16],
           [0.93,0.352,0.16],
           [0.926,0.344,0.16],
           [0.922,0.336,0.16],
           [0.918,0.328,0.16],
           [0.914,0.32,0.16],
           [0.91,0.313,0.16],
           [0.906,0.305,0.16],
           [0.902,0.297,0.16],
           [0.898,0.289,0.16],
           [0.895,0.281,0.16],
           [0.891,0.273,0.16],
           [0.891,0.262,0.156],
           [0.887,0.254,0.156],
           [0.883,0.246,0.156],
           [0.879,0.238,0.156],
           [0.875,0.23,0.156],
           [0.871,0.223,0.156],
           [0.867,0.215,0.156],
           [0.863,0.207,0.156],
           [0.859,0.199,0.156],
           [0.855,0.191,0.156],
           [0.852,0.184,0.156],
           [0.848,0.176,0.156],
           [0.848,0.168,0.156],
           [0.844,0.16,0.156],
           [0.84,0.152,0.156],
           [0.836,0.145,0.156],
           [0.832,0.137,0.156],
           [0.824,0.121,0.156],
           [0.816,0.121,0.156],
           [0.809,0.117,0.152],
           [0.805,0.117,0.152],
           [0.797,0.117,0.148],
           [0.789,0.117,0.148],
           [0.781,0.113,0.148],
           [0.777,0.113,0.145],
           [0.77,0.113,0.145],
           [0.762,0.113,0.141],
           [0.754,0.109,0.141],
           [0.75,0.109,0.141],
           [0.742,0.109,0.137],
           [0.734,0.105,0.137],
           [0.727,0.105,0.133],
           [0.723,0.105,0.133],
           [0.715,0.105,0.133],
           [0.707,0.102,0.129],
           [0.699,0.102,0.129],
           [0.695,0.102,0.125],
           [0.688,0.102,0.125],
           [0.68,0.098,0.121],
           [0.672,0.098,0.121],
           [0.668,0.098,0.121],
           [0.66,0.098,0.117],
           [0.652,0.094,0.117],
           [0.645,0.094,0.113],
           [0.641,0.094,0.113],
           [0.633,0.09,0.113],
           [0.625,0.09,0.109],
           [0.617,0.09,0.109],
           [0.613,0.09,0.105],
           [0.605,0.086,0.105],
           [0.598,0.086,0.105],
           [0.59,0.086,0.102],
           [0.586,0.086,0.102],
           [0.57,0.082,0.098],
           [0.0,0.0,0.0]];
}
