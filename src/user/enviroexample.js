export default class enviroDefault {
  #cname = 'default';
  zeropt = null;
  eResults;
  isInitialized = false;

  get name() {return this.#cname};

  init(opts = {count: 0}) {
    this.zeropt = null;
    this.eResults = []; //Array.from({length: opts.count});
    this.isInitialized = true;
  }

  update(input) {
    puts(`enviroDefault entry\nTurtle position: ${JSON.stringify(input.turtle.P)}, moduleIndex: ${input.mIndex}, moduleArgs: ${input.mArgs}`);
    
    let eresult = {mIndex: input.mIndex, argVals: []}; // must return module index
    let tstr = 'xyz';
    let tndx = 0;
    eresult.argVals.push(input.mArgs[0]); // no change
    if (input.mArgs[0] === 0) {
      if (this.zeropt === null){
        this.zeropt = 0;
        eresult.argVals.push(0);
      } 
      // this shouldn't happen
    } else {
      this.zeropt++;
      if (input.mArgs[0] % 4 === 0) {
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

    this.eResults.push(eresult);

    return new Promise((res, rej) => {
      eresult.resolve = res;
      eresult.reject = rej;
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
    this.isInitialized = false;
  }
}
