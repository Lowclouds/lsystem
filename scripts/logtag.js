
class LogTag {
   static tagSet = 0n;
   static set(...tags) {
      for (const tag of tags) {
         LogTag.tagSet |= tag;  // set bit
      }
   }
   static isSet(tag) {
      return (tag & LogTag.tagSet) != 0n;
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
// we use BigInt to allow for more than 32 tags
const  MAIN_ALL         =1n;  //0
const  LSYS_PARSE       =2n;  // 1
const  LSYS_IN_ITEMS    =4n;  // 2
const  LSYS_IN_PROD     =8n;  // 3
const  LSYS_IN_DECOMP  =16n;  // 4
const  LSYS_IN_HOMO    =32n;  // 5
const  LSYS_IN_WANT    =64n;  // 6
const  LSYS_PARSE_PROD=128n; // 7  
const  LSYS_PARSE_MOD =256n; // 8  
const  LSYS_PARSE_SUCC=512n; // 9  

const  LSYS_REWRITE = 1024n; // 10
const  LSYS_EXPAND  = 2048n; // 11
const  LSYS_MATCH   = 4096n; // 12
const  LSYS_CONTEXT = 8192n; // 13

const  TRTL_CAPTURE  =  16384n; // 14
const  TRTL_MATERIAL =  2n**15n;
const  TRTL_TEXTURE  =  2n**16n; 
const  TRTL_TRACK    =  2n**17n; 
const  TRTL_CONTOUR  =  2n**18n; 
const  TRTL_DRAW  =     2n**19n;
const  TRTL_POLYGON  =  2n**20n; 
const  TRTL_SETGET   =  2n**21n;

const  NTRP_INIT     =  2n**22n;
const  NTRP_SETTING  =  2n**23n;
const  NTRP_MOTION   =  2n**25n;
const  NTRP_HEADING  =  2n**26n;
const  NTRP_SIZE     =  2n**27n;
const  NTRP_BRANCH   =  2n**28n;
const  NTRP_PROGRESS =  2n**29n;

