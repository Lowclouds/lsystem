const {createMacro} = require('babel-plugin-macros')

module.exports = createMacro(putsMacro);

      
function putsMacro({references, state, babel}) {
   //const code =
}




/*
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
*/
