/*
  The goal is to handle most L-systems defined in The Algorithmic Beauty of Plants,
  referred to here as TABOP, or by the Lsystems programs developed by Przemyslaw 
  Prusinkiewicz' group at the University of Calgary, available here: 
  http://algorithmicbotany.org
*/
/* 
   required packages
   -supplied here
   --turtle3d.js for actually drawing
   --interpret.js unites this file and turtle3d.js
   --colortables.js
   --logtag.js for tagged logging and class global variables
   
   -external packages
   --cpp.js to remove comments and expand #defines.
      this version modified to ignore // comments, since they 
      can occur in production strings
   --math.js for math.evaluate
   --babylon.js and some of its dependencies, for underlying graphics environment
   --one of earcut, libtess, or triangulate for mesh triangulation
     libtess is winning, so far, but we're using none of them
*/

'use strict';

/*
  regular expressions used in parsing L-systems
  variables ending in ReStr are plain strings used to compose REs
  Regular expressions are always defined as RE.<re name>
*/
    
// RE is the container for all regular expressions. this s.b. in LSystem class
const RE = {};
let greekSymbols = [
  '\u22D0', '\u22D1', '\u0393', '\u0394', '\u0398',
  '\u039B', '\u039E', '\u03A0', '\u03A3', '\u03A6',
  '\u03A8', '\u03A9', '\u03B1', '\u03B2', '\u03B3',
  '\u03B4', '\u03B5', '\u03B6', '\u03B7', '\u03B8', 
  '\u03B9', '\u03BA', '\u03BB', '\u03BC', '\u03BD',
  '\u03BE', '\u03BF', '\u03C0', '\u03C1', '\u03C2',
  '\u03C3', '\u03C4', '\u03C5', '\u03C6', '\u03C7',
  '\u03C8', '\u03C9',
];

// symbolReStr is the recognizer for ALL module names in an axiom or production 
var symbolReStr = "[\\w\\d\\+\\-\\][,;'{}&^\\\\/#!\\.\\_|\\$%~]|@C[abcemnst]|@b[od]|@[#!bcoOsvMmRTD]|@G[scetr]|@Di]|@H|\\?[PHLU]?";
// moduleReStr recognizes a module, parameterized or not
var moduleReStr = `(${symbolReStr})(?:\\((\[^)]+)\\))?`; // A(m,n), or &, or $(3), or ?P(x,y)
/* test for module RE string
   'AB F(n)fGg@M(1,2,3)+-&^\\(1)/(3)|$% @v@c(x,y,z)?P(x,y,z)~S~S12'.matchAll(RE.module)
*/

var numReStr = '\\d+(?:\\.\\d+)?';
var varnameReStr = '\\w[\\w\\d]*';
// var startdReStr='^(?:define)[ \\t]+{';
// var enddReStr = '\)[ \\t]+([^ \\t].*)';
var startiReStr = '^(?:#?[iI]gnore:) *(';
var endiReStr = '\+)';
var startcReStr = '^(?:#?[cC]onsider:?) +\(';
// var param1ReStr=`${numReStr}|${varnameReStr}`;
// var expReStr = '(.*(?=->))';
var prodNameStr = '(?:^[pP]\\d+:)';

RE.defineStart = new RegExp('^(?:[\\s]*define:\\s+){[\\s]*(.*)','d');

RE.ignore = new RegExp(`${startiReStr}(${symbolReStr})${endiReStr}`);
RE.consider = new RegExp(`${startcReStr}(${symbolReStr})${endiReStr}`);
RE.dlength = new RegExp(`^(?:[Dd](?:erivation )?length): *\(\\d+)`);
RE.axiom = /^[aA]xiom:\s*(\S.*)/;  // new RegExp(`(?:^axiom: *)?${moduleReStr}`,'g')
RE.lsystem = /^[lL][sS]ystem: *([^ \\t]+)/;
RE.modules = new RegExp(`${moduleReStr} *`,'g');
RE.successorModule = new RegExp(`(${symbolReStr})(\\(.*)?`, 'gd');
RE.ws = /\s+/g;
RE.asterisk = /^\s*\*\s*/;
RE.prodTop = new RegExp(`${prodNameStr}? *(.*?)--?>(.*)`)
RE.leftSide = /(?:([^<>:]+)<)?([^>:]+)(?:>([^:]+))?(?::(.+))?/;
RE.pre_condition = /^ *({.+)/;  
RE.post_condition = /} *$/;
RE.var = new RegExp(`^${varnameReStr} *= *(.+)`);
RE.maxDepth = /^ *[Mm]ax.* +depth: *(\d+)/;

RE.assignAny = new RegExp(`(${varnameReStr})[ \t]*=[ \t]*([^;]+);?`,'g');
RE.assignNum = new RegExp(`(${varnameReStr})[ \t]*=[ \t]*(${numReStr}),?`,'g');
RE.anyGlobal = new RegExp(`(${varnameReStr}):[ \t]*([\\S]+)`,'i');

// this accepts function expressions only, not function declarations, not arrow functions
RE.assignFun = new RegExp(`(${varnameReStr}) *= *function *\\(([^\\)]*)\\) *(.*)`, 'g');

/* ParameterizedModule class
   {m: <modulename>, p: <parameter array> }
   A module in an L-system is either a bare string of one or more characters, or 
   a parameterized module, which carries parameters along with it enclosed in
   parentheses. The constructor takes the bare string name of the module and the
   string parameter(s) inside the parentheses. The individual parameters are then
   parsed into an array. Since a parameter can be an arbitrarily complex numeric
   function, containing embedded commas, such as, e.g., (x,atan(y,x)), we need
   to parse the string.
   This accepts modules like A(1), @C(x*rand()), ...
   Note that parameter expressions are not validated or evaluated here, except that
   matching parentheses
*/ 
var ParameterizedModule = function(name, parms) {
   this.m = name;
   this.p = parseParens(parms);
   normalizeStrings(this);
   this.toString = function() {return this.m + '(' + this.p.toString() + ')';}
   this.clone = function() {
      let pm =  new ParameterizedModule(this.m, '');
      pm.p = Array.from(this.p);
      return pm;
   }
   function parseParens(s) {
      let p=[];
      let pi = 0; // p array index
      let nested = 0;
      for (let i = 0; i < s.length; i++) {
         //puts(`i: ${i}, pi: ${pi},${s[i]}, nested: ${nested}`)
         if (s[i] == ',' && nested == 0) {
            pi++;
            // puts("onto next param");
            continue;
         } else if (s[i] === '(' || s[i] === '[') {
            nested++;
         } else if (s[i] == ')' || s[i] === ']') {
            nested--;
         }
         if (p[pi]) {
            p[pi] += s[i];
         } else {
            p[pi] = s[i];
         }
      }
      return p;
   }

   function normalizeStrings(o) {
      for (let i=0; i < o.p.length; i++) {
         let v = o.p[i];
         let end = v.length-1;
         let s0 = v[0];
         let s1 = v[end];
         if (s0 == s1 && (s0 == "'" || s0 == '"') ) {
            v = v.split('');
            v[0]='"';
            v[end] = '"';
            o.p[i] = v.join('');
         }
      }
   }
}

// evaluation environment might be a better word, but scope will do
// math.js likes to use maps for secure environments, so we extend Map
// for our purposes
class LsScope extends Map {

   constructor (strict = null, pre = null, post =  null) {
      super();
      this.strictCondition = strict;
      this.preCondition = pre;
      this.postCondition = post;
      
      // to keep track of global, local, and rule variables
      // var name = [0|1|2] 
      this.scopeMap = new Map();
      this.name = 'rules'
      this.expand = expandF(this, 'rules');
   }

   // order of the maps determines scoping of the variables
   // earlier maps will shadow later maps
   init(...maps) {
      this.clear();
      maps.forEach((vmap) => {
         this.dynamicBind(vmap);
      });
   }
   // dynamic binding part 1
   // set variables from enclosing scope and
   // keep track of where they came from
   dynamicBind(enclosingScope) {
      enclosingScope.forEach((v,k) => {
         if (! this.has(k)) {
            this.set(k,v);
            this.scopeMap.set(k,enclosingScope);
         }
      });
   }

   // bind formal parameters of modules in rule scope
   bind (v, exp) {
      puts(`bind(${v}=${exp})`, LSYS_PARSE_PROD);
      let end = exp.length-1;
      let s0 = exp[0];
      let s1 = exp[end];
      if (s0 == s1 && (s0 == "'" || s0 == '"') ) {
         this.set(v, exp); // keep strings
      } else {
         math.evaluate(v + '=' + exp, this);
      }
      this.scopeMap.set(v,null); // just set rule scope to null
   }

  // evaluate pre and post conditions for side effect
  // value test is result of strict condition
   test () {
      let r = true;
      if (this.preCondition) {
         puts(`test pre: ${this.preCondition}`, LSYS_MATCH);
         this.eval(this.preCondition);
      }
      if (this.strictCondition) {
         puts(`test strict: ${this.strictCondition}`, LSYS_MATCH);
         r = this.eval(this.strictCondition);
      }
     // only need to evaluate if strict condition is true
      if (r && this.postCondition) {
         puts(`test post: ${this.postCondition}`, LSYS_MATCH);
         this.eval(this.postCondition);
      }
      return r;
   }
   
   // Called from test() above for true/false condition
   // this can throw if the number of formal parameters exceeds the provided values
   // and one of the parameters is used in a condition. one could ferret out why, but
   // it's likely the rule just doesn't apply, so let it fail and return false
   eval(expr) {
      let result;
      try {
         result =  math.evaluate(expr, this); // really just need this for side-effect
      } catch(error) { result = false; }
      return result;
   }

   // dynamic binding  part 2
   // reset any variables in containing scopes
   // for rule scope, map is set to null in bind
   upbind () {
      let map;
      this.forEach((v,k) => {
         map = this.scopeMap.get(k);
         if (map) {
            map.set(k,v);       // may or may not have changed
            puts(`upbind: ${map.name} - ${k} <- ${v}`, LSYS_EXPAND);
         }
      });
   }
}

class LsProduction extends Array {
   constructor (...a) {
      super(...a);
      if (this.length !=  4) {
         puts('resetting rule to empty rule', LSYS_PARSE_PROD);
         this[0] = [[],[],[]];
         this[1] = [[],[],[]];
         this[2] = [];
         this[3] = null;
         this.length = 4;       // truncate array if needed
      }
   }
   get predecessor () {
      return this[0];
   }
   set predecessor (p) {
      this[0] = p;
   }
   get strictPredecessor () {
      return this[0][1];
   }
   set strictPredecessor (sp) {
      this[0][1] = sp;
   }
   get leftContext() {
      return this[0][0];
   }
   set leftContext(c) {
      this[0][0] = c;
   }
   get rightContext() {
      return this[0][2];
   }
   set rightContext(c) {
      this[0][2] = c;
   }
   get condition () {
      return this[1];
   }
   set condition (c) {
      this[1] = c;
   }
   get strictCondition () {
      return this[1][1];
   }
   set strictCondition (c) {
      this[1][1] = c;
   }
   get preCondition () {
      return this[1][0];
   }
   set preCondition (pc) {
      this[1][0] = pc;
   }
   get postCondition () {
      return this[1][2];
   }
   set postCondition (pc) {
      this[1][2] = pc;
   }
   get successor() {
      return this[2];
   }
   set successor(s) {
      this[2] = s;
   }
   get scope() {
      return this[3];
   }
   set scope(s) {
      this[3] = s;
   }
}

/*
  The constructor takes a plain-text L-System specification, typically from a file,
  and parses it. The Rewrite method will then expand the system into Lsystem.current.
  The syntax and semantics is as close to cpfg syntax as I could get it with a few 
  exceptions, among them:
   - stochastic models are not supported
   - '{(0)', the parameterized form of '{', is not a polygon, but a stepwise path.
   - @Ds() and @De() start user defined contours
   - stemsize is the variable for setting the diameter/size of a drawn line
   - it accepts all of 'n=<number>, 'derivation length: <number>' and 
     'dlength: <number>' as acceptable ways to define iteration length
   - view and 
 */
class Lsystem {
   // single map for all l-systems in a spec
   // we want the first entry to be the main lsystem
   static lsystems = new Map();
   static modLsystemStart = new  ParameterizedModule('$', 'i,s');
   static modLsystemEnd = '$';
   static globals = new Map();

   constructor(spec,lbl = '1') {
      this.spec = null; // should be a text file/string or empty for sub-lsystems
      if (spec == null) {
         this.spec = 'no specification';
      } else {
         this.spec = spec;      // should be a text file/string
      }
      this.label = lbl;
      this.axiom = [];
      this.rules = [];
      this.Dlength = 0; // number of iterations
      this.dDone = 0;   // number of iterations done;
      this.decomprules = null;      // unimplemented
      this.decompDepth = 1;      // unimplemented
      this.homorules = null;      // unimplemented
      this.homoDepth = 1;      // unimplemented
      this.stepStart = false;    // 
      this.current = [];
      this.interp = null;
      this.verbose = 0;
      this.scale = 1;
      this.stemsize = 0.1;
      this.step = 1;    // default forward step size
      this.delta = 90;  // default angle
      this.ignore=[];
      this.consider=[]; 
      this.restrict = null; // either ignore or consider
      this.needsEnvironment = false;
      this.locals = new LsScope();
      this.locals.name = 'locals';
      this.locals._expand_ = expandF(this.locals, 'locals');
      this.globals = Lsystem.globals;
   }

   // i read it in a magazine, oh
   static myTypeOf (o) {
      return Object.prototype.toString.call(o).slice(8,-1).toLowerCase(); 
   }

   show(w='all') {
      if (w == 'all') {
         for (const prop in this) {
            if (prop == 'subsystems') {
               let subs = this.subsystems.keys();
               subs.next();  /* skip main  */
               let sub = subs.next().value;
               while (sub) {
                  puts(`sub-Lsystem ${sub}`);
                  puts(this.subsystems.get(sub).serialize());
                  sub = subs.next().value;
                  puts(`    ------------\n`);
               }  
            } else {
               puts(this.showOneProp(prop));
            }
         }
      } else {
         puts(this.showOneProp(w));
      }
   }

   serialize() {
      let s = '';
      for (const prop in this) {
         if (prop != 'spec') {
            if (prop == 'subsystems') {
               let subs = this.subsystems.keys();
               subs.next();  /* skip main  */
               let sub = subs.next().value;
               while (sub) {
                  s += `/*    ------------    */\n`;
                  s += `sub-Lsystem ${sub}\n`;
                  s += `${this.subsystems.get(sub).serialize()}`;
                  sub = subs.next().value;
               }  
            } else {
               s = s + this.showOneProp(prop);
            }
         }
      }
      return s;
   }

   showOneProp(prop) {
      let s = '';
      if (this[prop]) {
         switch (prop ) {
         case 'axiom':
            s = `${prop} = ` + Lsystem.listtostr(this.axiom) + '\n';
            break;
         case 'rules':
         case 'homorules':
         case 'decomprules':
            if (this[prop].length == 0) {
               s = `${prop} := empty\n`;
            } else {
               s = `${prop}:= {pre, strict, post} {cond} {succ} {scope}\n`;
               this[prop].forEach((r) => {
                  //console.log(`Showing: ${r}`);
                  r.forEach((e,i) => {
                     s += '\{';
                     if (i < 3) {
                        s += `${e}`;
                     } else if (Lsystem.myTypeOf(e) === 'map') {
                        s += 'has scope';
                     }
                     
                     // switch(i) {
                     // case 0: 
                     //    e.forEach((p,j) => {
                     //       //console.log(`looking at ${p}`);
                     //       if (p) {s += Lsystem.listtostr([p]);}
                     //       if (j<2) {s += ',';}
                     //       return;
                     //    });
                     //    break;
                     // case 1:
                     //    s += e;
                     //    break;
                     // case 2:
                     //    s += Lsystem.listtostr(e);
                     //    break;
                     // }
                     s += '\}';
                     return;
                  });
                  s += `\n`;
                  return;
               });
            }
            break;
         case 'subsystems':
            break;
         default: {
           let t = Lsystem.myTypeOf(this[prop]);
           if (t == 'map') { 
             if (this[prop] == '') {
               return `${prop} is empty\n`;
             } else {
               s = `${prop} contains:\n`;
               for (let e of this[prop].entries()) { 
                 s = s + `  ${e}\n`;}
             }
           } else {
             s = `${prop} = ${this[prop]}\n`;
           }
         }
           break;
         }
      }
      return s;
   }
   // ------------------------------------------------------------

   initParse(parentLS = null) {
      if (parentLS) {
         // inherit locals from parent lsystem
         // maybe rethink this to keep lsystem variables apart and
         // force shared variables to be global.
         this.locals.init(parentLS.globals);
      }
      this.axiom = [];
      this.rules = [];
      this.decomprules = null;
      this.homorules = null;
      this.Dlength = 0;
      this.dDone = 0;
      this.stepStart = false;
      this.delta = 90;
      this.current=[];
      this.interp=null;
      this.restrict = null;
   }

   /*
     Parse a user supplied spec
     The Parse function is a wrapper for a bunch of variables used in the parse functions and 
     delegates all the work to parseHelper.
     Returns a parsed Lsystem instance
   */ 
   static Parse (spec, lsystem = null) {
      const  P_ERROR=0, P_UNHANDLED = 1, P_HANDLED = 2, P_TRANSITION=3;
      // preprocess the spec with standard Cpp-like preprocessor
      let pp = new cpp_js();
      // define these here so recursive invocations of parseHelper
      // all use the same spec and indices into it.
      let cppSpec = pp.run(spec), pos = 0;
      // there's a bug in cpp.js that sometimes doesn't do all replacements
      cppSpec=pp.run(cppSpec);

      cppSpec=cppSpec.replaceAll(/\n\n+/g, '\n'); // remove blank lines

      let end = cppSpec.length;      
      let m;                            // common match variable
      let nestPos;                      // where we left line mode
      let nesting = [];
      let ls0;
      if (lsystem) {
         ls0 = lsystem;
      } else {
         ls0 = new Lsystem(cppSpec, 'main'); // preemptively naming it 
      }
      Lsystem.lsystems.clear();
      Lsystem.lsystems.set('main', ls0);
      Lsystem.globals.clear();
      let labelSeen = false;    // have we seen the 'lsystem: xxx' label
      
      ls0.initParse();
      parseHelper(ls0);    // this is the toplevel l-system

      if (! ls0.Dlength) {
         if (ls0.locals.has('n')) {
            ls0.Dlength = ls0.locals.get('n');
         } else if (ls0.globals.has('n')) {
            ls0.Dlength = ls0.globals.get('n');
         } else {
            ls0.Dlength = 1;
            puts('Derivation length not specified; defaulting to 1');
         }
      }
      ls0.subsystems = Lsystem.lsystems;
      ls0.verbose=0;
      ls0.show();

      return ls0;

      function findEOL (s, p) {
         let r = `Start: ${p}`;
         let lstart=p
         do {
            let eol_ = s.indexOf('\n', lstart);
            if (eol_ == -1) {
               return s.length;
            } else {
               lstart = eol_ + 1; // peek past end of line
               r +=`, peek: pos: ${lstart} = '${s[lstart]}'`;
               if(lstart >= s.length) {
                  puts(r, LSYS_PARSE);
                  return s.length;
               } else if (s[lstart] == ' ' || s[lstart] == '\t') { // whitespace at BOL
                  if (s.slice(lstart,s.length-1).match(/[ \\t]+\\n/)) {
                     puts(r, LSYS_PARSE);
                     return eol_;
                  } else {
                     continue;
                  }
               } else {
                  puts(r, LSYS_PARSE);
                  return eol_;
               }
            }
         } while(1);
      }

      // this is a simple state machine, so all substates return to parent 
      // eliminating tricky transition discovery.
      // A sub L-system invokes a recursive call to this function.
      // states are functions, parseResult contains a code and a nextState
      // there is one state function call per line of input
      function parseHelper (ls, isSubLs = false) {
         let line='', eol = 0;
         let linectr = 0;
         if (!isSubLs && cppSpec == 'no specification') {
            puts('nothing to parse');
            return;
         } 

         let parseState  = inItems; // initial parse state
         let parseResult;       // {status, nextState}
         let emsg = '';
         let have_axiom=false;
         let have_homomorphism=false;
         while (pos < end) {
            eol = findEOL(cppSpec,pos);
            if ((eol - pos) < 1) {
               puts("skipping short line: " + cppSpec.slice(pos,eol), LSYS_PARSE);
               pos = eol + 1; // advance file pointer
               continue;
            }
            // remove extra spaces and carriage returns
            line = cppSpec.slice(pos,eol).replaceAll(/\s\s+/g,' ');
            // puts(`${pos}-${eol} : ${line}`, LSYS_PARSE);
            pos = eol + 1; // advance file pointer
            linectr++;
            let loop = true;
            do {
               puts(`state: ${parseState.name}, ${pos} ${eol}, ${line}`, LSYS_PARSE);
               parseResult = parseState(ls, line);
               switch (parseResult.status) {
               case P_ERROR:
                  return errorState(ls, line, linectr, pos, parseResult.emsg);
               case P_TRANSITION:
                  parseState = parseResult.nextState;
                  if (parseState == wantLsystem && isSubLs) {
                     // we are in a sub Lsystem after an endlsystem statement, so
                     // return this completed lsystem to the main one;
                     return ls;
                  }
                  // intentional fall through
               case P_HANDLED:
                  loop = false;
                  break;
               case P_UNHANDLED:
                  // not clear why we leave unhandled unhandled
                  puts(`Unhandled parse result, on line: ${line}`);
                  loop = false;
                  break;
               default:
                  puts('unexpected parse result');
                  return;
               }
            } while(loop);
         } // not at end of spec
         return ls;
      }
      
      function ParseResult (s=P_ERROR, n=errorState, msg='') {
         return {status: s, nextState: n, emsg: msg};
      }

      function inItems (ls, line) {
         puts(`inItems looking at: ${line}`, LSYS_IN_ITEMS);
         let pr = new ParseResult(P_HANDLED, inItems);
         if (m = line.match(RE.defineStart)) {
            // start of a define section, check if there's anything beyond the open brace
            // if (m[1] != '') {
            //    pos = m.indices[1][0]; // reset pos to whatever's there
            // }
            nestPos = pos;
            nesting = [1];
            puts(`Unimplemented: would call parseDefine at nextPos=${nestPos}`, LSYS_IN_ITEMS);
            //puts(`calling parseDefine at nextPos=${nestPos}`, LSYS_IN_ITEMS);
            pr.status = P_HANDLED;
            pr.nextState = inItems;
         } else if (RE.var.test(line)) {
            //m = line.matchAll(RE.assignNum);
            m = line.matchAll(RE.assignAny);
            if (m) {
               try {
                  for (let parts of m) {
                     let parts2 = parts[2].replaceAll('&&',' and ').replaceAll('||', 'or'); //.replaceAll('!', ' not ');
                     if (labelSeen) {
                        math.evaluate(parts[1]+'='+ parts2, ls.locals);
                        puts(`set local var ${parts[1]} to ${parts2}`, LSYS_IN_ITEMS);
                     } else {
                        math.evaluate(parts[1]+'='+ parts2, ls.globals);
                        puts(`set global var ${parts[1]} to ${parts2}`, LSYS_IN_ITEMS);
                     }
                     //ls.locals.set(parts[1], parts[2]);
                  }
               } catch (error) {
                  puts(`Error setting variable: ${error}`);
               }
            }         
            ls.show('vars');
            //ls.show('functions');
         } else if (null != ( m = line.match(RE.lsystem))) {
            // this should happen only on the initial lsystem and covers the case
            // of strictly valid lsystems with an 'lsystem: chars' statement
            // otherwise, we should pick up the lsystem statement in wantLsystem
            puts(`matched "lsystem: xxx" got: ${m[1]}`, LSYS_IN_ITEMS);
            // sanity check here
            let oldlabel = ls.label;
            let thelsystem = Lsystem.lsystems.get(oldlabel);
            if ((oldlabel != 'main') || ls != thelsystem) {
               pr.status=P_ERROR;
               pr.nextState=errorState;
               pr.emsg = `lsystem name s.b. main, but is ${oldlabel}`;
            } else {
               Lsystem.lsystems.delete(oldlabel);
               ls.label = m[1];
               Lsystem.lsystems.set(ls.label, ls);
               puts(`reset lsystem name to ${ls.label} from ${oldlabel}`, LSYS_IN_ITEMS);
               labelSeen = true;
               ls.show('label');
            }
         } else if (null != ( m = line.match(RE.dlength))) {
            puts(`matched "derivation length: " got: ${m[1]}`, LSYS_IN_ITEMS);
            ls.Dlength = Number(m[1]);
            ls.locals.set('Dlength', ls.Dlength)
            ls.show('Dlength');
         } else if (null != (m = line.match(RE.ignore))) {
            ls.ignore = Lsystem.strtolist(m[1]) 
            ls.show('ignore');
         } else if (null != (m = line.match(RE.consider))) {
            ls.consider = Lsystem.strtolist(m[1]) 
            ls.show('consider');
         } else if (null != (m = line.match(RE.axiom))) {
            //puts "$line -> $m -> [lindex $m 1] -> [strtolist [lindex $m 1]]"
            let tmp = m[1].replaceAll(RE.ws, ''); // remove embedded ws in axiom
            ls.axiom = parseSuccessor(tmp);
            ls.show('axiom');
            // create restrict if needed
            if (ls.ignore.length) {
               if (! ls.consider.length) {
                  ls.restrict = {ignore: ls.ignore};
               } else {
                  throw new Error('Both ignore and consider cannot be used');
               }
            } else if (ls.consider.length) {
               ls.restrict = {consider: ls.consider};
            } else {
               ls.restrict = null;
            }
            pr.status=P_TRANSITION;
            pr.nextState = inProductions;
         } else if (null != (m = line.match(RE.anyGlobal))) {
            ls.globals.set(m[1], m[2]);
            ls[m[1]] = m[2];
            puts(`matched "anyGlobal:" ${m[1]} = ${m[2]}`, LSYS_IN_ITEMS);
         } else {
            pr.status = P_UNHANDLED;
            puts(`unrecognized statement: ${line}`);
         }
         return pr;
      }

      function inProductions (ls, line) {
         let pr = new ParseResult(P_HANDLED, inProductions);
         puts(`inProductions looking at: ${line}`, LSYS_IN_PROD);
         if (line.includes('homomorphism')) {
            // should pick up warnings/no warnings
            pr.status = P_TRANSITION;
            pr.nextState = inHomomorphism;
         } else if (line.includes('decomposition')) {
            // should pick up warnings/no warnings
            pr.status = P_TRANSITION;
            pr.nextState = inDecomposition;
         } else if (line.includes('endlsystem')) {
            pr.status = P_TRANSITION;
            pr.nextState = wantLsystem;
         } else {
            let rule = parseProduction(ls, line)
            if (rule != null) {
               ls.rules.push(rule);
            } else {
               pr.status = P_UNHANDLED;
            }
         } 
         return pr;
      }
      function inDecomposition (ls, line) {
         let pr = new ParseResult(P_HANDLED, inProductions);
         if (ls.decomprules === null) ls.decomprules=[];
         puts(`inDecomposition looking at: ${line}`, LSYS_IN_DECOMP ); // , 
         if (line.includes('homomorphism')) {
            // should pick up warnings/no warnings
            pr.status = P_TRANSITION;
            pr.nextState = inHomomorphism;
         } else if (line.includes('decomposition')) {
            // should pick up warnings/no warnings
            pr.status = P_ERROR;
            pr.nextState = errorState;
            pr.emsg = "Can't follow a decomposition with decomposition";
         } else if (line.includes('endlsystem')) {
            pr.status = P_TRANSITION;
            pr.nextState = wantLsystem;
         } else if (m = line.match(RE.maxDepth)) {
            ls.decompDepth = Number(m[1]);;
         } else {
            let rule = parseProduction(ls, line)
            if (rule != null) {
               ls.decomprules.push(rule);
            } else {
               pr.status = P_UNHANDLED;
            }
         }
         return pr;
      }
      function inHomomorphism (ls, line) {
         let pr = new ParseResult(P_HANDLED, inProductions);
         if (ls.homorules === null) ls.homorules=[];
         puts(`inHomomorphism looking at: ${line}`, LSYS_IN_HOMO);
         if (line.includes('homomorphism')) {
            // should pick up warnings/no warnings
            pr.status = P_ERROR;
            pr.nextState = errorState;
            pr.emsg ="Can't have a homomorphism section in homomorphism";
         } else if (line.includes('decomposition')) {
            // should pick up warnings/no warnings
            pr.status = P_ERROR;
            pr.nextState = errorState;
            pr.emsg = "Can't follow a homomorphism with decomposition";
         } else if (line.includes('endlsystem')) {
            pr.status = P_TRANSITION;
            pr.nextState = wantLsystem;
         } else if (m = line.match(RE.maxDepth)) {
           ls.homoDepth = Number(m[1]);
         } else {
            let rule = parseProduction(ls, line)
            if (rule != null) {
               ls.homorules.push(rule);
            } else {
               pr.status = P_UNHANDLED;
            }
         }
         return pr;
      }
      function wantLsystem (ls, line) {
         let pr = new ParseResult(P_HANDLED, wantLsystem);
         puts(`wantLsystem looking at: ${line}`);
         if (null != ( m = RE.lsystem.exec(line))) {
            let lbl = m[1];
            if (Lsystem.lsystems.get(lbl)) {
               pr.status = P_ERROR;
               pr.nextState = errorState;
               pr.emsg = `Duplicate lsystem label: ${lbl}`;
            } else {
               // create a new lsystem and call parseHelper recursively
               let sls = new Lsystem('', lbl);
               sls.initParse(ls);
               parseHelper(sls, true);       // this is a subLs
               Lsystem.lsystems.set(lbl, sls); // update sublsystems map
            }
         }
         return pr;
      }

      function errorState (ls, line,linectr, pos=0, msg) {
         let err = `error in lsystem ${ls.label}, ${line}
at line:${linectr} | pos: ${pos}
${msg}`;
         return err;
      }

      function parseProduction(ls, line) {
         // break into pieces: [prodname:] leftside --> successor
         // then break leftside into: [lcontext <] strictpredecessor [> rcontext] [: condition]
         // prodname, lcontext, rcontext, and condition are optional. 
         // condition is only for parameterized lsystems. 
         // condition breaks into: [{precondition expr}] test [{postcondition expr}]
         // TABOP is fairly consistent for parameterized systems, but
         // kinda all over the map in terms of syntax. This tries to follow the grammar
         // and meaning described in documentation of the software here:
         // http://algorithmicbotany.org/virtual_laboratory/versions/L-studio-4.4.1-2976.zip
         // 
         // cpfg allows lcontext, strict predecessor, and rcontext to be strings of multiple
         // modules. Having the strict predecessor be multiple modules doesn't play well with 
         // the array implementation of the string, and I believe it can be worked around, by
         // which I mean transformed into one or more productions with single module strict
         // predecessors. So, it isn't supported, and will break on some LStudio example systems
         
         let rule = new LsProduction(); // empty rule
         let leftside, predecessor, condition, successor;
         let m, strict, dummy ;
         let scope = null, needScope=false;
         //puts(`in parseProduction: looking at ${line}`, LSYS_IN_PROD)

         m = RE.prodTop.exec(line);        // .replaceAll(' ',''));
         if (m == null) {
            puts(`Unrecognized production: ${line}`, LSYS_PARSE, LSYS_IN_PROD); 
            return null;
         }
         //puts(m);

         // turn successor into a list of modules
         // since we need to deal with nested parens, strtolist and simple REs don't work
         rule.successor = parseSuccessor(m[2].replaceAll(RE.ws, ''));
         // puts(`successor after parsing: ${rule.successor}`);
         if (rule.successor.find(e=>'object' == typeof e)) {
            needScope = true;
         }
         // --
         leftside = RE.leftSide.exec(m[1]);

         rule.leftContext = parseModules(leftside[1]);
         rule.strictPredecessor = parseModules(leftside[2], true); // only one module allowed for strict predecessor
         rule.rightContext = parseModules(leftside[3]);

         condition = leftside[4];   // undefined or not
         if (condition) {
            condition = condition.trim().replaceAll(RE.ws, ' ');
         }
         puts(`parseProd: condition = ${condition}`, LSYS_PARSE, LSYS_PARSE_PROD);
         if (condition) {
            let pre = null;
            let post = null;
            let p0 = 0;
            let p1 = 0;
            let c;
            
            condition = condition.replaceAll('&&',' and ').replaceAll('||', 'or'); // .replaceAll('!', ' not ');
            
            if ( RE.pre_condition.test(condition)) {
               while (condition[p0] != '{') { p0++; }
               [c,p1] = Lsystem.skipbrackets(condition, p0,1,1); // skip braces right
               pre = condition.slice(p0+1,p1-1);
               condition = condition.slice(p1);
               needScope=true;
               rule.preCondition = pre;
               puts(`pre-condition found: ${pre}`, LSYS_PARSE_PROD);
            }
            if (RE.post_condition.test(condition)) {
               let p1 = condition.length - 1 ;
               while (condition[p1] != '}') {p1--;}
               [c,p0] = Lsystem.skipbrackets(condition, p1,-1,1); // skip braces left
               post  = condition.slice(p0+2,p1);
               condition = condition.slice(0,p0);
               needScope=true;
               rule.postCondition = post;
               puts(`post-condition found: ${post}`, LSYS_PARSE_PROD);
            }

            if (condition.length == 1 && condition[0] == '*') {
               if (pre || post) {
                  condition = 'true';
               } else {
                  condition = null;
               }
            }

            rule.strictCondition = condition;
            // rule.preCondition = pre;
            // rule.postCondition = post;
            puts(`parseProd: condition = ${pre} | ${condition} ${post}`, LSYS_PARSE, LSYS_PARSE_PROD);
         }
         if (condition || needScope) {
            rule.scope = new LsScope(rule.strictCondition, rule.preCondition, rule.postCondition);
            puts("scope: " + Object.entries(rule.scope), LSYS_PARSE_PROD);
         } 

         puts(`rule: ${rule}`, LSYS_PARSE_PROD);
         return rule;
      }

      // predecessors can't have nested function calls, they are either
      // bare variables or numbers
      function parseModules(s, isStrict = false) {
         let mods = [];
         puts('parseModules looking at: ' + s, LSYS_PARSE_MOD);
         if (s) {
            let it = s.matchAll(RE.modules);
            for (m of it) {
               puts('parseModules matching: ' + m, LSYS_PARSE_MOD);
               if (m[2] === undefined) {
                  mods.push(m[1]);
               } else {
                  mods.push(new ParameterizedModule(m[1], m[2]));
               }
               if (isStrict) {     // only one module allowed for strict predecessor
                  return mods[0];  // return just the module, not an array
                  break;
               }
            }
         }
         return mods;
      }

      // need to handle, e.g. A((y+fn(x))), for any nested depth of function calls
      function parseSuccessor(s) {
         puts(`parseModules in ${s}`, LSYS_PARSE_SUCC);
         let l = new Array();
         let i = 0;
         let m;
         let re = RE.successorModule;
         while (m = re.exec(s)){
            puts(`matched: ${m[1]} : lastIndex = ${re.lastIndex}`, LSYS_PARSE_SUCC);
            if (m[2] === undefined) {
               l[i] = m[1];
            } else {
               let nested = 1;
               let j = m.indices[2][0] + 1; // one past initial left paren
               while (nested > 0 && j < m.indices[2][1]) {
                  if (s[j] == ')') {
                     nested--;
                  } else if (s[j] == '(') {
                     nested++;
                  }
                  j++;
                  //puts(`j: ${j}`);
               }
               if (nested == 0) {
                  let parms = s.substring(m.indices[2][0]+1, j-1);
                  l[i] = new ParameterizedModule(m[1], parms);
                  // reset s
                  re.lastIndex = j;
                  puts(`parms: ${parms} -> ${l[i].p.join(' ; ')}`, LSYS_PARSE_SUCC);
               } else {
                  let ss = s.substring(m.indices[2][0], j);
                  throw new Error(`Error: end of input while parsing: ${ss}`);
                  break;
               }
            }
            puts(`module ${i} = ${l[i]}`, LSYS_PARSE_SUCC);
            i++;
         }
         return l;
      }
   }; // end of Parse


   static flatten( list) {
      let r=[];
      let v;
      for (let i=0;i<list.length;i++) {
         v=list[i];
         if (Array.isArray(v)) {
            //put('list[' + i + ']: ' + v + ' is an array');
            v.forEach(m => {r.push(m)});
         } else {
            //put('list[' + i + ']: ' + v + ' is NOT an array');
            r.push(v);
         }
      }
      return r;
   }
   
   static strtolist(s) {
      let l= new Array();
      let i=0;
      let m=[];
      let mRe = new RegExp(`${moduleReStr}`,'g');
      while ( m = mRe.exec(s)) {
         //console.log(m);
         if (m[2] === undefined) {
            l[i] = m[1];
         } else {
            l[i] = new ParameterizedModule(m[1], m[2]);
         }
         //console.log(l[i]);
         i++;
      }
      return l;
   }

   static listtostr(l) {
      let r= new String('');
      if ('string' == typeof l) {return l;}
      l.forEach(e => { 
         if (e) {
            if ('object' == typeof e && e?.m != null) {
               r+= e.m + '(' + e.p + ')';
            } else  {
               r  += e;
            }
         }
         return '?';
      });
      return r;
   }
   
   // rewrite string derivation length times
   // generate step per cpfg docs
   // Assumption: if arg, 'it', is not zero, then rewrite 'it' times,
   // typically, once.
   // the property dDone keeps track of how many total iterations have
   // been done on the string.

  // Note well: string, mstring, and ls.current are arrays of modules, not actually strings

   Rewrite (ls = this, it = 0, string=null ) {
      let genv = new LsScope();      // set up local and global environment
      genv.init(ls.locals, Lsystem.globals); // locals will shadow globals
     // use axiom as initial string if none supplied
      if (string === null) {
        // evaluate any uninstantiated parameters in axiom
        ls.current = this.expand(new LsProduction(null,null,ls.axiom.slice(), genv));
      } else {
         ls.current = string;   // we assume the input has been rewritten/expanded
      }

      let niter = (it <= 0) ? (ls.Dlength ? ls.Dlength : 1) : it;
      puts(`axiom: ${ls.current}`, LSYS_REWRITE);
      puts(`Number of iterations done: ${ls.dDone} to do: ${niter}`, LSYS_REWRITE);
      let mstring = ls.current; 
      let lschanges;
      let lsLabel = ls.label;
      let rules = ls.rules;
      let locals = ls.locals;
      let lsStack = [];
      let restrict = ls.restrict;
      let mlength;

      function doOnePass() {
         puts(`doOnePass:\n${mstring}, mlength: ${mlength}`, LSYS_REWRITE_VERB);
         for (let n=0; n < mlength; n++)   {
            let module = mstring[n];
            puts(`looking at module[${n}] = ${module}, Lsys: ${lsLabel}`, LSYS_REWRITE);
            if (module == null || Array.isArray(module)) continue;

            // special handling of cut module, %, where the length of the lsystem is reduced
            if (module == '%') {
               let ol = mlength;
               let on = n;
               mlength = ls.cutInPlace(mstring, n);
               n--;   // redo module at this index: it has changed
               puts(`After cut at ${on}, old length was ${ol}, new length is${mlength}:`, LSYS_REWRITE);
               continue;
            }
            // 
            let doExpand = false;
            // find best rule match
            let bestrule = null;
            let bestruleContextLength = 0;
            let bestscope = null;
            for (const rule of rules) {
               puts(`matching against rule: ${rule}`, LSYS_REWRITE_VERB);
               let scope = rule.scope;
               if (scope) {
                  scope.init( locals, Lsystem.globals);
               }
               let strictp = rule.strictPredecessor;
               puts(`comparing  ${module} to strictp: ${strictp}`, LSYS_REWRITE_VERB);
               // todo: evaluate pre-condition expression before evaluating scope._test_()
               // side-effect of formalMatch is that scope is updated
               if (ls.formalMatch(strictp, module, scope)) {
                  let lctxt = rule.leftContext;
                  let rctxt = rule.rightContext;
                  if (lctxt.length && 
                      ! ls.findcontext(mstring, lctxt, n, -1, scope, restrict)) {
                     continue;
                  }
                  if (rctxt.length && 
                      ! ls.findcontext(mstring, rctxt, n, 1, scope, restrict)) {
                     continue;
                  }
                  // See if the condition is valid
                  // this will evaluate preCondition, and, if successful, postCondition
                  if (scope == null || scope.test()) {
                     if (bestrule === null) {
                        bestrule = rule;
                        bestruleContextLength = 0;
                        bestscope = scope;
                        puts(`initial bestrule set to ${bestrule}`, LSYS_REWRITE_VERB);
                     } else {
                        if (((lctxt.length + rctxt.length) > bestruleContextLength)) {
                           bestrule = rule;
                           bestruleContextLength = lctxt.length + rctxt.length;
                           bestscope = scope;
                        }
                     }
                  } else {
                     puts('failed scope.test_()',LSYS_REWRITE_VERB);
                     if (LogTag.isSet(LSYS_EXPAND)) {
                        puts("bound scope:");
                        scope.forEach((v,k) => {puts(`   ${k} == ${v}`);});
                     }
                  }
               }
            }
            puts(`bestrule is ${bestrule}`, LSYS_REWRITE);
            if (bestrule) {
               lschanges[n] = ls.expand(bestrule);
               if (bestscope) { 
                  // pass any changed local or global values up from rule scope
                  bestscope.upbind(); 
               }
               puts(`expanded ${mstring[n]} to ${lschanges[n]}`, LSYS_REWRITE, LSYS_EXPAND);
            }
            //          if (! doExpand) {
            // special case a few module types
            if (ls.formalMatch(Lsystem.modLsystemStart, module, null)) {
               let sublslabel = module.p[0].toString();
               let subls = Lsystem.lsystems.get(sublslabel);
               if (subls) {
                  lsStack.push(ls);
                  lsLabel= subls.label;
                  rules = subls.rules;
                  subls.locals.dynamicBind(locals); // dynamic parent ls local bindings
                  locals = subls.locals;
                  restrict = subls.restrict;
                  puts(`switching to lsystem: ${lsLabel}`, LSYS_REWRITE);
               } else {
                  throw new Error(`lsystem: ${sublslabel} not found in ${module}`); 
               }
            } else if (ls.formalMatch(Lsystem.modLsystemEnd, module, null)) {
               let upls = lsStack.pop()
               if (! upls) {
                  throw new Error(`Rewrite: no lsystem found on stack after "$"!`); 
               } else {
                  lsLabel = upls.label;
                  rules = upls.rules;
                  upls.locals.upbind(); // pass values up to parent scope
                  locals = upls.locals
                  restrict = upls.restrict;
                  puts(`Returning to lsystem: ${lsLabel}`, LSYS_REWRITE);
               }
            }
         }
      }

      for (let i=1; i <= niter; i++) {
         mlength = mstring.length;
         lschanges = [];    // changes introduced in this interation
         puts(`iteration ${i};`, LSYS_REWRITE);
         doOnePass();
         mstring = this.merge(mstring, lschanges);
         if (ls.decomprules !=  null) {
            rules = ls.decomprules;
            for (let j = 1; j <= ls.decompDepth; j++) {
               mlength = mstring.length;
               puts(`iteration ${i}; decomposition: ${j}`, LSYS_REWRITE);
               lschanges = [];
               doOnePass();
               mstring = this.merge(mstring, lschanges);
            }
            rules = ls.rules;
         }
      }
      ls.current = mstring;
      ls.interp = ls.current;
      if (ls.homorules != null) {
         rules = ls.homorules;
         mstring = ls.current.slice();
         mlength = mstring.length;
         for (let i = 1; i <= ls.homoDepth; i++) {
            lschanges=[];
            doOnePass();
            mstring = this.merge(mstring, lschanges);
         }
         ls.interp = mstring;
      }
      if (string === null) {
        ls.dDone = niter;      // 
      } else {
         ls.dDone += niter;     // step case: niter typically == 1
      }
      puts(`Expanded tree has ${ls.interp.length} nodes after ${ls.dDone} interations`);
      return ls.interp;
   }                            // end of Rewrite

  merge(source, changes) {
    let changecnt = 0, newsourcelen = 0;

    changes.forEach((e) => {newsourcelen += e.length; changecnt++;});
    
    // pre-allocate array
    let merged = Array.from({length: source.length + newsourcelen - changecnt});
    for (let i = 0, j=0; i < source.length; i++) {
      if (changes[i]) {
         changes[i].forEach((e) => {
            merged[j] = e;
            j++;
         });
      } else {
         if (source[i]) {
            merged[j] = source[i];
            j++;
         }
      }
    }
    return merged;
  }
   expand(rule) {
      puts(`expanding rule: ${rule}`, LSYS_EXPAND);
      let successor;
      let scope = rule.scope;  // rule[3]; 
      if (scope) {
         successor = rule.successor.slice();
         puts(`nominal rule: ${rule[0]} : ${rule[1]} -->  ${successor}`, LSYS_EXPAND)
         successor.forEach((mod,ndx) => {if (typeof mod === 'object') {
            let nmod = mod.clone();
            scope.expand(nmod);
            puts(`expanded module: ${nmod}`, LSYS_EXPAND);
            successor[ndx] = nmod;
         }});
         //puts(`successor: ${successor}`, LSYS_EXPAND);
         puts(`actual successor: ${rule[2]} --> ${successor}`, LSYS_EXPAND);
      } else {
         successor = rule.successor;
      }
      return successor;
   }

   moduleName(m) {
     if (!m ) {
       puts(`mlist[${n}] is null, ${mlist}`, LSYS_CONTEXT);
       return m;
     }
      if (typeof m == 'string') {
         return m;
      } else {                  // assume parameterized Module
         return m.m;
      }
   }
   // when rewriting/deriving an lsystem
   // nodeA must be a module in the rule with formal parameters
   // nodeB is a module in the axiom/expansion with an actual value which
   // gets bound to the formal parameter from nodeA
   // TABOP says that parameter length must match exactly, but then allows modules
   // to have optional parameters - so we check that the number of formal 
   // parameters is greater than or equal to the number of actual parameters
   formalMatch(nodeA, nodeB, scope=null) {
      puts(`formalMatch ${nodeA} against ${nodeB}`, LSYS_MATCH);
      if (typeof nodeA == typeof nodeB) {
         if (typeof nodeA == 'string') {
            return nodeA == nodeB;
         } else if ((nodeA.m == nodeB.m) && (nodeA.p.length >= nodeB.p.length)) {
            if (scope !== null) {
               for (let fp = 0; fp < nodeB.p.length; fp++) {
                  puts(`scope.bind(${nodeA.p[fp]}, ${nodeB.p[fp]})`, LSYS_MATCH);
                  scope.bind(nodeA.p[fp], nodeB.p[fp]);
               }
               if (LogTag.isSet(LSYS_MATCH)) {
                  puts("scope bind:");
                  scope.forEach((v,k) => {puts(`   ${k} == ${v}`);});
               }
            }
            return true;
         } else {
            return false;
         }
      } else {
         puts(`node types mismatch: A == ${typeof nodeA}, B=${typeof nodeB}`, LSYS_MATCH);
         return false;
      }
   }

   // mlist is string of modules we are working on
   // ctxt is the context we are searching for
   // cnode is the index of the current node
   // dir is the direction/context in the string: -1 for left, 1 for right
   // rscope is the scope for this rule, possibly trivial
   // optional restrict contains either an ignore or a consider list of modules
   // return true if ctxt matches, else false
   findcontext (mlist,ctxt, snode, dir, rscope, restrict=null) {

      let nmax = mlist.length;
      let n = snode + dir;      // index of the module to look at
      let ci = (dir < 0) ? ctxt.length -1 : 0; // start from end of left ctxt str
      let m;  // module in string  under consideration
      let c;  // module in context under consideration
      let ignore = false, consider=false;
      if (restrict != null) {
         if (restrict.hasOwnProperty('ignore')) {
            ignore = restrict.ignore.slice(); // copy
         } else if (restrict.hasOwnProperty('consider')) {
            consider = restrict.consider.slice();
         }
      }
      puts(`ctxt: ${ctxt}, snode: ${snode}, dir: ${dir}`, LSYS_CONTEXT);
      puts(`restrict: ${restrict}, ignore: ${ignore}, consider: ${consider}`, LSYS_CONTEXT);

      while (n >= 0 && n < nmax) {
         m = mlist[n];
         c = ctxt[ci];
         let mn = this.moduleName(m);
         let cn = this.moduleName(c);
         if ((ignore && ignore.includes(mn)) || (consider && !consider.includes(mn))) {
            n += dir;           // next module, same context
            puts(`skipping module ${m}`, LSYS_CONTEXT);
         } else {
            if (dir < 0) {         //# left context:upwards:acropetal
               switch (m) {
               case ']':
                  [m, n] = Lsystem.skipbrackets(mlist, n, dir);
                  break;
               case '[': 
                  n--;             // skip over bracket
                  puts('skipping over [ to left', LSYS_CONTEXT);
                  break;
               default:
                  if (this.formalMatch(c, m, rscope)) {
                     ci--;
                     if (ci < 0) {
                        return true;
                     }
                     n--;
                  } else {
                     return false;
                  }
               }
            } else {            //# dir == 1 right context:downwards:basipetal
               if (m == '[' && c != '[') { 
                  [m, n] = Lsystem.skipbrackets(mlist, n, dir);
               } else if (c == ']') {
                  while (m != ']') {
                     n++;
                     if (n < nmax) {
                        m = mlist[n];
                     } else {
                        puts('fell off right end of string looking for "]"', LSYS_CONTEXT);
                        return false;
                     }
                  }
                  n++;
                  ci++;
               } else if (this.formalMatch(c,m, rscope)) {
                  ci++;
                  n++;
               } else {
                  return false;
               }
               if (ci >= ctxt.length) {
                  return true;
               }
            } 
         }
      }
      return false;
   }

   //# basically skip (\[[^]+\])* from either the left or right
   //# dir is +/- 1; +1 skips right, -1 skips left
   // returns a list of first char beyond bracketed group and its position
   // if group is at either end, returns empty char and -1 or list length
   // will skip braces if skiptype is 1, or parens if 2
   static skipbrackets (marray, start, dir, skiptype = 0) {
      let l = marray;
      let nmax = l.length;
      let leftb, rightb;
      switch (skiptype) {
      case 0:
         leftb= '\[';
         rightb = ']';
         break;
      case 1:
         leftb= '\{';
         rightb = '}';
         break;
      case 2:
         leftb = '(';
         rightb = ')';
      }
      
      let startbracket = l[start];
      let openBracket, closeBracket;
      if (dir == 1) {
         if (startbracket == leftb) {
            openBracket = leftb;
            closeBracket = rightb;
         } else {
            puts(`starting with ${startbracket} must proceed to right`,LSYS_REWRITE);
            return ["", start];
         }
      } else {
         if (startbracket == rightb) {
            openBracket = rightb ;
            closeBracket = leftb ;
         } else {
            puts(`starting with ${startbracket} must proceed to left`,LSYS_REWRITE);
            return ["", start];
         }
      }  
      let n = start;
      let nested = 1;
      let c;
      puts(`skipbrackets at start: l[${n}] = ${l[n]}`,LSYS_REWRITE);
      while (nested > 0 && n > -1 && n < nmax) {
         n += dir;
         c = l[n];
         switch(c) {
         case closeBracket:
            nested += -1;
            break;
         case openBracket:
            nested += 1;
            break;
         }
         //puts(`l[${n}] = ${l[n]}`); 
      }
      if (nested == 0) {
         n += dir;
         if (n > -1 && n < nmax) {
            c = l[n];
         } else {
            c = "";
         }
      } else {
         puts(`ill-formed branch at ${start}: ${l[start]}`);
         throw new Error(`ill-formed branch at ${start}: ${l[start]}`);
      }
      return [c, n];
   }

   // null out all modules from start to first end-branch, ], module or to end
   // nxt is mstring
   // this depends on sequential left-right processing of L-system string
   /* dead code 9/1/2024
   cut (nxt, start) {
      let i = start;
      let j = 0;                // count to delete
      let atEnd=false;
      let nested = 0;
      do {
         // nxt[i] = [];            // this disappears when array is flattened
         nxt[i] = null;            // this will be skipped during merge
         i++;
         j++;
         if ( i >= nxt.length ){
            atEnd = true;
         } else {
            switch (nxt[i]) {
            case '[':
               nested++;
               break;
            case ']':
               atEnd = (nested === 0);
               nested--;
               break;
            default:
               break;
            }
         }
      } while(! atEnd);
      return i;
   }
   */
   cutInPlace (str, start) {
      let i = start;
      //puts(`cutInPlace: start at str[${i}] = ${str[i]}, str[${i+1}] = ${str[i+1]}`);
      let atEnd=false;
      let nested = 0;
      do {
         i++;
         if ( i >= str.length ){
            atEnd = true;
            i = str.length;
         } else {
            switch (str[i]) {
            case '[':
               nested++;
               break;
            case ']':
               atEnd = (nested === 0);
               nested--;
               break;
            default:
               break;
            }
         }
      } while(! atEnd);
     // puts(`cutInPlace cutting: ${str.slice(start, i)}`);
      str.splice(start,i-start);
      return str.length;
   }

} /* end Lsystem */

Lsystem.globals.name = 'globals';
Lsystem.globals._expand_ = expandF(Lsystem.globals, 'globals');

// return a function that will expand a module in the named scope
// call it as scope.expand(module)
function expandF(scope, name) {
   let n = name;
   return function (module) {
      module.p.forEach((arg,ndx) => {
         puts(`${n}: arg: ${arg}, ndx: ${ndx}`, LSYS_EXPAND);
         let end = arg.length-1;
         let s0 = arg[0];
         let s1 = arg[end];
         if (s0 == s1 && (s0 == "'" || s0 == '"') ) {
            let str = arg.split("");
            str[0] = '"';
            str[end] = '"';
            puts(`${n}: returning quoted string arg ${str}`, LSYS_EXPAND);
            module.p[ndx] = str.join('');
         } else {
            puts(`${n}: evaluating ${arg}`, LSYS_EXPAND);
            let r = math.evaluate(arg, scope);
            if (typeof r === 'object') {
               r = JSON.stringify(r);
            }
            module.p[ndx] = r;
         }
      });
   }
}

// flatten a list by one level
function flatten( list) {
   // puts('flattening');
   let r=[];
   let v;
   for (let i=0;i<list.length;i++) {
      v=list[i];
      if (Array.isArray(v)) {
         //puts('list[' + i + ']: ' + v + ' is an array');
         //for (let j=0, m; m=v[j]; j++) {r.push(m)}
         v.forEach(m => {r.push(m)});
      } else {
         //puts('list[' + i + ']: ' + v + ' is NOT an array');
         if (v != null && v != '') {
            r.push(v);
         }
      }
   }
   return r;
}

function strtolist(s) {
   let l= new Array();
   let i=0;
   let m=[];
   // let mRe = new RegExp(`${moduleReStr}`,'g');
   while ( m = RE.module.exec(s)) {
      //console.log(m);
      if (m[2] === undefined) {
         l[i] = m[1];
      } else {
         l[i] = new ParameterizedModule(m[1], m[2]);
      }
      //console.log(l[i]);
      i++;
   }
   return l;
}

function listtostr(l) {
   let r= new String('');
   if ('string' == typeof l) {return l;}
   l.forEach(e => { 
      if (e) {
         if ('object' == typeof e) {
            r+= e.toString();
         } else  {
            r  += e;
         }
      }
      return;
   });
   return r;
}




function substitute(defs, expr ) {
   let didSub, nexpr;
   let res = [];
   defs.forEach((v,k) => {
      res.push( {re: new RegExp(`\\b${k}\\b`, 'g'), sub: v});
   });
   res.forEach((def) => {puts(`${def.re}, ${def.sub}`);});

   do {
      didSub = false;
      res.forEach((def) => {
         nexpr = expr.replaceAll(def.re, def.sub);
         if (nexpr != expr) {
            didSub = true;
            expr = nexpr;
         }
      });
   } while (didSub);
   return expr;
}

function lappend (larray, ...items) {
   larray.splice(larray.length,0, ...items);
}


function flattenv( list) {
   let r=[];
   for (let i=0;i<list.length;i++) {
      v=list[i].asArray();
      if (Array.isArray(v)) {
         puts('list[' + i + ']: ' + v + ' is an array');
         v.forEach(m => {r.push(m)});
      } else {
         puts('list[' + i + ']: ' + v + ' is NOT an array');
         r.push(v);
      }
   }
   return r;
}

function includeJavascript(src) {
   if (document.createElement && document.getElementsByTagName) {
      var head_tag = document.getElementsByTagName('head')[0];
      var script_tag = document.createElement('script');
      script_tag.setAttribute('type', 'text/javascript');
      script_tag.setAttribute('src', src);
      head_tag.appendChild(script_tag);
   }
}
// Include javascript src file
//includeJavascript("http://www.mydomain.com/script/mynewscript.js");

const loadScript = src => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.onload = resolve
    script.onerror = reject
    script.src = src
    document.head.append(script)
  })
}

// loadScript('https://code.jquery.com/jquery-3.4.1.min.js')
//   .then(() => loadScript('https://code.jquery.com/ui/1.12.1/jquery-ui.min.js'))
//   .then(() => {
//     // now safe to use jQuery and jQuery UI, which depends on jQuery
//   })
//   .catch(() => console.error('Something went wrong.'))
// -------------------------------------------------------------
// Blob and Object URL

// First, the code:

// // Generates a text file download named `filename` with contents of `dataString`.
// const generateDownload = (filename, dataString) => {
//   const a = document.createElement('a')
//   document.body.appendChild(a)
//   a.style = 'display: none'
//   const blob = new Blob([dataString], {type: 'octet/stream'}),
//         url = URL.createObjectURL(blob)
//   a.href = url
//   a.download = filename
//   a.click()
//   window.webkitURL.revokeObjectURL(url)
//   a.parentElement.removeChild(a)
// }
// ===========================================================

// Data URL

// This option is more straightforward. As in, it uses less technologies and they are probably easier to understand:

// // Generates a text file download named `filename` with contents of `dataString`.
// const generateJSONDownload = (filename, dataString) => {
//   const data = 'text/json;charset=utf-8,' + encodeURIComponent(dataString)
//   const link = document.createElement('a')
//   a.style.display = 'none'

//   const attrDownload = document.createAttribute('download')
//   attrDownload.value = filename
//   link.setAttributeNode(attrDownload)

//   const attrHref = document.createAttribute('href')
//   attrHref.value = 'data:' + data
//   link.setAttributeNode(attrHref)

//   document.body.append(link)
//   link.click()
//   link.remove()
// }
// ------------------------------------------------------------
// var testls = `n=30,delta=22.5
// #ignore +-F
// axiom: F1F1F1
// p1: 0 < 0 > 0 -> 0
// p2: 0 < 0 > 1 -> 1[+F1F1]
// p3: 0 < 1 > 0 -> 1
// p4: 0 < 1 > 1 -> 1
// p4: 1 < 0 > 0 -> 0
// p4: 1 < 0 > 1 -> 1F1
// p4: 1 < 1 > 0 -> 0
// p4: 1 < 1 > 1 -> 0
// p5: + -> -
// p5: - -> +
//`

// unused REs
//RE.preRe = /(?:([^< ]+) *< *)?([^> ]+)(?: *> *([^ ]+))?/;

//var pfindReStr=`(${param1ReStr}),?`
//var pfindRe = new RegExp(pfindReStr, "g"); //use in loop to find parameters
//var formalparmsReStr=`(${varnameReStr})(,\[^)]+)?`;
//var mRe=`(${symbolReStr})(?:\\((${param1ReStr})(?:,(\[^)]+))*\\))?`;
//var fmRe=`(${symbolReStr})(?:\\((${formalparmsre})\\))?`;


