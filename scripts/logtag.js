
class LogTag {
   static tagSet = 0n;
   static mode = 0;
   static set(...tags) {
      for (const tag of tags) {
         LogTag.tagSet |= tag;  // set bit
      }
   }
   static setMode(mode=LOG_ANYOF) {
      switch (mode) {
      case LogTag.LOG_ANYOF:
      case LogTag.LOG_ALLOF:
         LogTag.mode = mode;
         break;
      default:
         LogTag.mode = LogTag.LOG_ANYOF;
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
         if (LogTag.mode == LogTag.LOG_ANYOF) {
            for (const tag of tags) {
               if (tag & LogTag.tagSet ) {
                  console.log(o);
                  return;
               }
            }
         } else {
            let alltags=0n;
            for (const tag of tags) {
               alltags |= tag;
            }
            if (alltags == (alltags & LogTag.tagSet)) {
               console.log(o);
            }
         }
      }
   }
   // pass an array of key names and this will define a bunch of constants
   // in the global scope
   // static defTags(keys, scope=LogTag) {
   //    let expnt = 0n;
   //    keys.forEach( key => {
   //       Object.defineProperty(scope, key, {
   //          value: 2n**expnt,
   //          writable: false,
   //          enumerable: true,
   //          configurable: false
   //       });
   //       expnt += 1n;
   //    });
   // } 
}

// if you're gonna have classes, yer gonna want class constants, sheesh
function classConst (obj, map) {
   Object.keys(map).forEach(key => {
      Object.defineProperty(obj, key, {
         value: map[key],
         writable: false,
         enumerable: true,
         configurable: false
      });
   });
}

classConst(LogTag, {
   LOG_ANYOF: 0,
   LOG_ALLOF: 1,
});
const  puts = LogTag.log;

/* LogTag.defTags([
   
   ]);
*/


// define your tags here or elsewhere
// we use BigInt to allow for more than 32 tags
const LOGTAG_MORE        = 1n;
const LOGTAG_MOST        = 2n;
const MAIN_ALL           = 4n;
const LSYS_PARSE         = 8n;
const LSYS_IN_ITEMS      = 16n;
const LSYS_IN_PROD       = 32n;
const LSYS_IN_DECOMP     = 64n;
const LSYS_IN_HOMO       = 128n;
const LSYS_IN_WANT       = 256n;
const LSYS_PARSE_PROD    = 512n;
const LSYS_PARSE_MOD     = 1024n;
const LSYS_PARSE_SUCC    = 2048n;
const LSYS_REWRITE       = 4096n;
const LSYS_EXPAND        = 8192n;
const LSYS_MATCH         = 16384n;
const LSYS_CONTEXT       = 2n**15n;      
const TRTL_CAPTURE       = 2n**16n;      
const TRTL_MATERIAL      = 2n**17n;      
const TRTL_TEXTURE       = 2n**18n;      
const TRTL_TRACK         = 2n**19n;      
const TRTL_CONTOUR       = 2n**20n;      
const TRTL_DRAW          = 2n**21n;      
const TRTL_POLYGON       = 2n**22n;      
const TRTL_SETGET        = 2n**23n;      
const NTRP_INIT          = 2n**24n;      
const NTRP_SETTING       = 2n**25n;      
const NTRP_MOTION        = 2n**26n;      
const NTRP_HEADING       = 2n**27n;      
const NTRP_SIZE          = 2n**28n;      
const NTRP_BRANCH        = 2n**29n;      
const NTRP_PROGRESS      = 2n**30n;
const NTRP_TRACKS        = 2n**31n;
const NTRP_CONTOUR       = 2n**32n;
