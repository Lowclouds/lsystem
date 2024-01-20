
export class LogTag {
   static tagSet = 0;
   static set(...tags) {
      for (const tag in tags) {
         LogTag.tagSet |= tag;  // set bit
      }
   }
   static clear(...tags) {
      for (const tag in tags) {
         LogTag.tagSet ^= tag;  // clear bit
      }
   }

   static log(o, ...tags) {
      if (tags.length == 0) {
         console.log(o);
      } else {
         for (const tag in tags) {
            if (tag & LogTag.tagSet ) {
               console.log(o);
               return;
            }
         }
      }
   }
}

// export const  puts = LogTag.log;
// define your tags here or elsewhere
export const  MAIN_ALL         =1;  //0
export const  LSYS_PARSE       =2;  // 1
export const  LSYS_IN_ITEMS    =4;  // 2
export const  LSYS_IN_PROD     =8;  // 3
export const  LSYS_IN_DECOMP  =16;  // 4
export const  LSYS_IN_HOMO    =32;  // 5
export const  LSYS_IN_WANT    =64;  // 6
export const  LSYS_PARSE_PROD=128; // 7  
export const  LSYS_PARSE_MOD =256; // 8  
export const  LSYS_PARSE_SUCC=512; // 9  

export const  LSYS_REWRITE = 1024; // 10
export const  LSYS_EXPAND  = 2048; // 11
export const  LSYS_MATCH   = 4096; // 12
export const  LSYS_CONTEXT = 8192; // 13

export const  TRTL_ALL      =16384; // 14
export const  TRTL_MATERIAL =  2**15;
export const  TRTL_TEXTURE  =  2**16; 
export const  TRTL_TRACK    =  2**17; 
export const  TRTL_CONTOUR  =  2**18; 
export const  TRTL_DRAW  =     2**19;
export const  TRTL_POLYGON  =  2**20; 

export const  NTRP_INIT     =  2**21;
export const  NTRP_MOTION   =  2**23;
export const  NTRP_HEADING  =  2**24;
export const  NTRP_SIZE     =  2**25;
export const  NTRP_BRANCH   =  2**26;
export const  NTRP_PROGRESS =  2**27;
