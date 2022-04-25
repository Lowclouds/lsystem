
class LogTag {
   static tagSet = 0;
   static set(...tags) {
      for (const tag of tags) {
         LogTag.tagSet |= tag;  // set bit
      }
   }
   static isSet(tag) {
      return (tag & LogTag.tagSet) != 0;
   }
   static clear(...tags) {
      for (const tag of tags) {
         LogTag.tagSet ^= tag;  // clear bit
      }
   }

   static log(o, ...tags) {
      if (tags.length == 0) {
         console.log(o);
      } else {
         for (const tag of tags) {
            if (tag & LogTag.tagSet ) {
               console.log(o);
               return;
            }
         }
      }
   }
}

const  puts = LogTag.log;
// define your tags here or elsewhere
const  MAIN_ALL         =1;  //0
const  LSYS_PARSE       =2;  // 1
const  LSYS_IN_ITEMS    =4;  // 2
const  LSYS_IN_PROD     =8;  // 3
const  LSYS_IN_DECOMP  =16;  // 4
const  LSYS_IN_HOMO    =32;  // 5
const  LSYS_IN_WANT    =64;  // 6
const  LSYS_PARSE_PROD=128; // 7  
const  LSYS_PARSE_MOD =256; // 8  
const  LSYS_PARSE_SUCC=512; // 9  

const  LSYS_REWRITE = 1024; // 10
const  LSYS_EXPAND  = 2048; // 11
const  LSYS_MATCH   = 4096; // 12
const  LSYS_CONTEXT = 8192; // 13

const  TRTL_CAPTURE  =  16384; // 14
const  TRTL_MATERIAL =  2**15;
const  TRTL_TEXTURE  =  2**16; 
const  TRTL_TRACK    =  2**17; 
const  TRTL_CONTOUR  =  2**18; 
const  TRTL_DRAW  =     2**19;
const  TRTL_POLYGON  =  2**20; 

const  NTRP_INIT     =  2**21;
const  NTRP_SETTING  =  2**22;
const  NTRP_MOTION   =  2**23;
const  NTRP_HEADING  =  2**25;
const  NTRP_SIZE     =  2**26;
const  NTRP_BRANCH   =  2**27;
const  NTRP_PROGRESS =  2**28;

