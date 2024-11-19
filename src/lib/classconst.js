// if you're gonna have classes, yer gonna want class constants, sheesh

export function classConst (obj, map) {
   Object.keys(map).forEach(key => {
      Object.defineProperty(obj, key, {
         value: map[key],
         writable: false,
         enumerable: true,
         configurable: false
      });
   });
}
