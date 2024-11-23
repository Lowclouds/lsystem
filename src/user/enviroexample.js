/*
  This class defines the base interface needed for an environment program:
  - the file is a module that exports a default class - it could import 
    other stuff. 
  - the file itself must be in  /public/code/user to be found
  - it must define a property called name - which should be constant
  - it must define the following methods:
  - - init([opts]) This will be called at the beginning of each interpretation step. Getting opts
      to the call is TBD
  - - update(input) This will be called for each ?E module
  - -     input is an object/struct that is guaranteed to contain, at least, the following
          { mIndex: <number>,   // index of ?E module in L-system string
            mArgs: <array>,     // array of values of ?E module
            turtle: <TurtleBasicState>, // object with abbreviated turtle state of 
            // {P:<pos>, H:<heading>, L: <left>, U: <up>, size: <pensize>, penIsDown: <boolean>, color: <tbd>}
  - -     must return a Promise that resolves to the result value (i.e. the argVals). The Promise
          may be resolved immediately, or later in the finalize method
  - - finalize() This is called at the end of the interpretation step and must resolve any unresolved
      Promises. It should also set isInitialized to false, so init() works again. Making this 
      method async may help the browser to stay happy. If the actual resolving takes a lot of time,
      you may need to make that process async, too.
      - The result returned by the promise, eresult, below, must be an object

  If you export an initOpts object (see below), it will be assigned to the L-system and used in 
  the init() call.
  If you assign an object to a global enviroInitOpts in your L-system, that will take precedence over
  the default provided in the module file. E.g.:
    ....
    enviroInitOpts = {maxCount: 1000, size: 0.5}
    ....
    Lsystem: envirols
    ....
*/

// import {distance} from '/code/vendor/math.js'
export default class enviroExample {
  #cname = 'example';
  zeropt = null;
  eResults;
  #isInitialized = false;

  get name() {return this.#cname};

  init(opts = {count: 0}) {
  //   this.zeropt = null;
    this.eResults = []; //Array.from({length: opts.count});
    this.#isInitialized = true;
  }

   update(input) {
      puts(`enviroDefault entry\nTurtle position: ${JSON.stringify(input.turtle.P)}, moduleIndex: ${input.mIndex}, moduleArgs: ${input.mArgs}`);
      
      let eresult = {mIndex: input.mIndex, argVals: []}; // must return module index
      let tstr = 'xyz';
      let tndx = 0;
      eresult.argVals.push(input.mArgs[0]); // no change

      if (input.mArgs[0] === 0) {
         this.zeropt = Object.values(input.turtle.P); // convert to an array
         console.log(`this.zeropt = ${this.zeropt})`)
         eresult.argVals.push(0);
      } else {
         let pt = Object.values(input.turtle.P); // convert to an array
         console.log(`distance(${this.zeropt}, ${pt})`)
         if (this.zeropt && math.distance(this.zeropt, pt) < 0.01) {
            eresult.argVals.push(1);
         } else {
            eresult.argVals.push(0);
         }
      }
      /* 
       *  from here to the end is pretty much boilerplate
       */
      // eResults and the epromises are parallel, there must be
      // one eresult per promise. The promise may already be resolved,
      // but here we wait until the finalize call

      return new Promise((res, rej) => {
         // we could just resolve this here, but normally
         // we need to wait
         eresult.resolve = res;
         eresult.reject = rej;
         this.eResults.push(eresult);
      });
   }   
   async finalize(){
      /* here is where'd you put some delayed computation
         compute eresults;
         -- or you could have been doing it asynchronously in the background
         -- then here's where you'd wait for it to complete
      */
      console.log(JSON.stringify(this.eResults));
      this.eResults.forEach((eresult) => eresult.resolve(eresult));
      this.#isInitialized = false;
   }
}

export const initOpts = {
   maxCount: 100,
   size: 1,
};
