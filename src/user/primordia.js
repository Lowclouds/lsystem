export default class Primordia {
  static #cname = 'Primordia';
  static #singleton = null;
  #parray = null;
  #ndx = 0;
  get name() {return Primordia.#cname;}

  eResults = undefined;
  count = 0;
  // psize = 1;
  // color = [1,1,1];
  isTwoD = false;
  
  #isInitialized = false;
  get isInitialized() {return this.#isInitialized;}

  constructor(){
    if (Primordia.#singleton === null) {
      Primordia.#singleton = this;
    }
    return Primordia.#singleton;
  }
  
  init (initParams = {count: 100, psize: 1, color: [1,1,1], twod: false}) {
    let arraySize = initParams?.count ?? 100;
    this.#parray = Array(arraySize);    
    this.eResults = Array(arraySize);

    this.count = 0;
    // this.psize = init?.psize ?? 1;
    // this.color = init?.color ?? [1,1,1];
    this.isTwoD = initParams?.twod ?? false;
  }

  update(input){
    let eresult = {mIndex: input.mIndex, argVals: []}; // must return module index

    // testing only
    eresult.argVals.push(input.mArgs[0]);

    this.#parray[this.#ndx] = input.turtle.P;
    this.eResults[this.#ndx] = eresult;
    this.#ndx++;

    return new Promise((res, rej) => {
      eresult.resolve = res;
      eresult.reject = rej;
    });
  }

  async finalize(){
    this.eResults.forEach((eresult) => {
      if (eresult)  {
        console.log(eresult);
        eresult.argVals.push(Math.round(Math.random()));
        eresult.resolve(eresult);
      }
    });
    console.log(JSON.stringify(this.eResults));
    this.#isInitialized = false;
  }
  
  static #mparams = {
    p1: { type: 'number', 
          range: '[0,1]',
          dir: 'out',
        },
    turtle: { type: 'position' },
  };
  static #iparams = {
    p1: {count: 100, psize: 1, color: [1,1,1], twod: false}
  };

  get mparams() {return JSON.stringify(Primordia.#mparams)}
  get iparams() {return JSON.stringify(Primordia.#iparams)}

}
