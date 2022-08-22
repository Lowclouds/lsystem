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

// symbolReStr is the recognizer for ALL module names in an axiom or production 
var symbolReStr = "[\\w\\d\\+\\-\\][,;'{}\&^\\\\/#!\\.\\_|\\$%]|@D[eimos]|@b[od]|@[#!bcoOsvMmRTD]|@G[scetr]|@D[idce]|\\?[PHLU]?|~\\w\\d*";
// moduleReStr recognizes a module, parameterized or not
var moduleReStr = `(${symbolReStr})(?:\\((\[^)]+)\\))?`; // A(m,n), or &, or $(3), or ?P(x,y)
/* test for module RE string
   'AB F(n)fGg@M(1,2,3)+-&^\\(1)/(3)|$% @v@c(x,y,z)?P(x,y,z)~S~S12'.matchAll(RE.module)
*/

var numReStr = '\\d+(?:\\.\\d+)?';
var varnameReStr = '\\w[\\w\\d]*';
var startdReStr='^(?:define)[ \\t]+{';
var enddReStr = '\)[ \\t]+([^ \\t].*)';
var startiReStr = '^(?:#?[iI]gnore:) *\(';
var endiReStr = '\+\)';
var startcReStr = '^(?:#?[cC]onsider:?) +\(';
var param1ReStr=`${numReStr}|${varnameReStr}`;
var expReStr = '(.*(?=->))';
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
RE.post_condition = / *([^{}]*) *(?:\* *{(.+)})?/;
RE.var = new RegExp(`^${varnameReStr} *= *(.+)`);

RE.assignAny = new RegExp(`(${varnameReStr})[ \t]*=[ \t]*([^;]+);?`,'g');
RE.assignNum = new RegExp(`(${varnameReStr})[ \t]*=[ \t]*(${numReStr}),?`,'g');
RE.anyGlobal = new RegExp(`(${varnameReStr}):[ \t]*([\\S]+)`,'i');

// this accepts function expressions only, not function declarations, not arrow functions
RE.assignFun = new RegExp(`(${varnameReStr}) *= *function *\\(([^\\)]*)\\) *(.*)`, 'g');

/* ParameterizedModule class
   {m: <modulename>, p: <parameter array> }
   A module in an L-system is either a bare string of one or more characters, or 
   a parameterized module, which, carries parameters along with it enclosed in outer
   parentheses. The constructor takes the bare string name of the module and the
   string parameter(s) inside the parentheses. The individual parameters are then
   parsed into an array. Since a parameter can be an arbitrarily complex numeric
   function, containing embedded commas, such as, e.g., (x,atan(y,x)), we need
   to parse the string.
   This accepts modules like A(1), @C(x*rand()), ...
   Note that parameter expressions are not validated or evaluated here.
*/ 
var ParameterizedModule = function(name, parms) {
   this.m = name;
   this.p = parseParens(parms);
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
         } else if (s[i] == '(') {
            nested++;
         } else if (s[i] == ')') {
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
     'dlength: <number>' are all acceptable ways to define iteration length
   - view and 
 */
class Lsystem {
   // single map for all l-systems in a spec
   // we want the first entry to be the main lsystem
   static lsystems = new Map();
   static modLsystemStart = new  ParameterizedModule('?', 'i,s');
   static modLsystemEnd = '$';
   static functions = new Map(); // functions also global for all l-systems

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
      this.decomprules = [];      // unimplemented
      this.homorules = [];      // unimplemented
      this.Dlength = 0; // number of iterations
      this.dDone = 0;   // number of iterations done;
      this.stepStart = false;    // 
      this.locals = new Map(); // from variable assignment statements
      this.locals._expand_ = (module) => {
         module.p.forEach((arg,ndx) => {
            if (arg[0] == "'" && arg[arg.length-1] == "'") {
               puts('returning quoted string arg', LSYS_EXPAND);
               module.p[ndx] = arg; // new String(arg);
            } else {
               puts(`evaluating ${arg}`);
               module.p[ndx] = math.evaluate(arg, this.locals);
            }
         });
      }
      // need to rethink globals - s.b. a singleton
      this.globals = new Map();
      this.globals._expand_ = (module) => {
         module.p.forEach((arg,ndx) => {
            if (arg[0] == "'" && arg[arg.length-1] == "'") {
               puts('returning quoted string arg', LSYS_EXPAND);
               module.p[ndx] = arg; // new String(arg);
            } else {
               puts(`evaluating ${arg}`);
               module.p[ndx] = math.evaluate(arg,this.globals);
            }
         });
      }

      this.functions = new Map();
      this.current = [];
      this.next = [];
      this.verbose = 0;
      this.stemsize = 0.1;
      this.step = 1;    // default forward step size
      this.delta = 90;  // default angle
      this.ignore=[];
      this.consider=[]; 
      this.restrict = null; // either ignore or consider
      this.needsEnvironment = false;
      this.subLsystems = null;  // only main lsystem, 1, should be a non-null Map
   }

   // i read it in a magazine, oh
   static myTypeOf (o) {
      return Object.prototype.toString.call(o).slice(8,-1).toLowerCase(); 
   }

   show(w='all') {
      if (w == 'all') {
         for (const prop in this) {
            puts(this.showOneProp(prop));
         }
      } else {
         puts(this.showOneProp(w));
      }
   }

   serialize() {
      let s = '';
      for (const prop in this) {
         if (prop != 'spec') {
            s = s + this.showOneProp(prop);
         }
      }
      return s;
   }

   showOneProp(prop) {
      let s = '';
      if (this.hasOwnProperty(prop)) {
         let t = Lsystem.myTypeOf(this[prop]);
         if (t == 'map') {
            if (this[prop] == '') {
               return `${prop} is empty\n`;
            } else {
               s = `${prop} contains:\n`;
               for (let e of this[prop].entries()) { 
                  s = s + `  ${e}\n`;}
            }
         } else 
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
                        } else if (Lsystem.myTypeOf(e) == 'map') {
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
            default:
               s = `${prop} = ${this[prop]}\n`;
               break;
            }
      }
      return s;
   }
   // ------------------------------------------------------------

   initParse(isMainLs = true) {
      this.axiom = [];
      this.rules = [];
      this.homorules = [];
      this.Dlength = 0;
      this.dDone = 0;
      this.stepStart = false;
      this.globals.clear();
      this.locals.clear();
      this.delta = 90;
      this.current=[];
      this.next=[];
      this.restrict = null;
      // if (isMainLs) {
      //    this.label='main';     // this is to support TABOP examples w/o lsystem: statement
      // } else {
      //    this.label = '';
      // }
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
      cppSpec=cppSpec.replaceAll(/\n\n+/g, '\n'); // remove blank lines

      let end = cppSpec.length;      
      let m;                            // common match variable
      let nestPos;                      // where we left line mode
      let nestIndex=0;
      let nesting = [];                 // keep track of define nesting;
      let ls0;
      if (lsystem) {
         ls0 = lsystem;
      } else {
         ls0 = new Lsystem(cppSpec, 'main'); // preemptively naming it 
      }
      Lsystem.lsystems.clear();
      Lsystem.lsystems.set('main', ls0);

      parseHelper(ls0);    // this is the toplevel l-system

      if (! ls0.Dlength) {
         if (ls0.locals.has('n')) {
            ls0.Dlength = ls0.locals.get('n');
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
         return eol_;
      }

      // this is a simple state machine, so all substates return to parent 
      // eliminating tricky transition discovery.
      // A sub L-system invokes a recursive call to this function.
      // states are functions, parseResult contains a code and a nextState
      // there is one state function call per line of input, but the inDefine state
      // keeps track of some char positions across lines.
      function parseHelper (ls, isSubLs = false) {
         let line='', eol = 0;
         if (!isSubLs && cppSpec == 'no specification') {
            puts('nothing to parse');
            return;
         } 

         ls.initParse(isSubLs);

         let parseState  = inItems; // initial parse state
         let parseResult;       // {status, nextState}
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
            puts(`${pos}-${eol} : ${line}`, LSYS_PARSE);
            pos = eol + 1; // advance file pointer

            let loop = true;
            do {
               parseResult = parseState(ls, line);
               switch (parseResult.status) {
               case P_ERROR:
                  errorState(ls, line, pos);
                  return;
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
            puts(`${pos} ${eol}`, LSYS_PARSE);
         } // not at end of spec
         return ls;
      }
      
      function ParseResult (s=P_ERROR, n=errorState) {
         return {status: s, nextState: n};
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
            nestIndex = 0;
            nesting = [1];
            puts(`calling parseDefine at nextPos=${nestPos}`, LSYS_IN_ITEMS);
            pr.status = P_HANDLED;
            pr.nextState = inItems;
         } else if (RE.var.test(line)) {
            //m = line.matchAll(RE.assignNum);
            m = line.matchAll(RE.assignAny);
            if (m) {
               try {
                  for (let parts of m) {
                     let parts2 = parts[2].replaceAll('&&',' and ').replaceAll('||', 'or'); //.replaceAll('!', ' not ');
                     math.evaluate(parts[1]+'='+ parts2, ls.locals);
                     //ls.locals.set(parts[1], parts[2]);
                  }
               } catch (error) {
                  puts(`Error setting variable: ${error}`);
               }
            }         
            ls.show('vars');
            ls.show('functions');
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
            } else {
               Lsystem.lsystems.delete(oldlabel);
               ls.label = m[1];
               Lsystem.lsystems.set(ls.label, ls);
               puts(`reset lsystem name to ${ls.label} from ${oldlabel}`, LSYS_IN_ITEMS);
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
         } else if (m = line.match(RE.axiom)) {
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
         } else if (m = line.match(RE.anyGlobal)) {
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
         puts(`inDecomposition looking at: ${line}`); // , LSYS_IN_DECOMP
         if (line.includes('homomorphism')) {
            // should pick up warnings/no warnings
            pr.status = P_TRANSITION;
            pr.nextState = inHomomorphism;
         } else if (line.includes('decomposition')) {
            // should pick up warnings/no warnings
            pr.status = P_ERROR;
            pr.nextState = errorState;
            puts("Can't follow a decomposition with decomposition");
         } else if (line.includes('endlsystem')) {
            pr.status = P_TRANSITION;
            pr.nextState = wantLsystem;
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
         puts(`inHomomorphism looking at: ${line}`);
         if (line.includes('homomorphism')) {
            // should pick up warnings/no warnings
            pr.status = P_ERROR;
            pr.nextState = errorState;
            puts("Can't have a homomorphism section in homomorphism");
         } else if (line.includes('decomposition')) {
            // should pick up warnings/no warnings
            pr.status = P_ERROR;
            pr.nextState = errorState;
            puts("Can't follow a homomorphism with decomposition");
         } else if (line.includes('endlsystem')) {
            pr.status = P_TRANSITION;
            pr.nextState = wantLsystem;
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
            // create a new lsystem and call parseHelper recursively
            let sls = new Lsystem('', lbl);
            parseHelper(sls, true);       // this is a subLs
            Lsystem.lsystems.set(lbl, sls); // update sublsystems map
         }

         return pr;
      }

      function errorState (ls, line, pos=0) {
         let pr = new ParseResult();
         puts(`error in lsystem ${ls.label} looking at pos: ${pos} in\n${line}`);
         return pr;
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
         
         let leftside, predecessor, condition, successor;
         let ix, cx, m, pre, strict, post, dummy ;
         let scope = null, needScope=false;
         //puts(`in rules: looking at ${line}`)

         m = RE.prodTop.exec(line);        // .replaceAll(' ',''));
         if (m == null) {
            puts(`Unrecognized production: ${line}`, LSYS_PARSE, LSYS_IN_PROD); 
            return null;
         }
         //puts(m);

         // turn successor into a list of modules
         // since we need to deal with nested parens, strtolist and simple REs don't work
         successor = parseSuccessor(m[2].replaceAll(RE.ws, ''));
         // puts(`successor after parsing: ${successor}`);
         if (successor.find(e=>'object' == typeof e)) {
            needScope = true;
         }
         // --

         leftside = RE.leftSide.exec(m[1]);
         predecessor = [
            parseModules(leftside[1]),
            parseModules(leftside[2], true), // only one module allowed for strict predecessor
            parseModules(leftside[3])
         ];

         condition = leftside[4];   // undefined or not
         puts(`parseProd: condition = ${condition}`, LSYS_PARSE, LSYS_PARSE_PROD);
         if (condition) {
            let pre = null;
            let post = null;
            let p0 = 0;
            let p1 = 0;
            let c;
            if ( RE.pre_condition.test(condition)) {
               while (condition[p0] != '{') { p0++; }
               [c,p1] = Lsystem.skipbrackets(condition, p0,1,1);
               pre = condition.slice(p0+1,p1-1);
            }
            
            condition = condition.replace(RE.asterisk,'');
            puts(`parseProd: condition = ${condition} after asterisk replacement`, LSYS_PARSE, LSYS_PARSE_PROD);
            
         }
         if (condition) {
            condition = condition.replaceAll('&&',' and ').replaceAll('||', 'or'); // .replaceAll('!', ' not ');
            needScope=true;
         } else {
            condition = true; // default of no condition
         }

         if (needScope) {
            scope = new Map();
            initScope(scope, ls.globals, ls.locals);
            //puts("scope before funcs: " + Object.entries(scope));

            scope._bind_ = function (v, exp) {
               puts(`bind(${v}=${exp})`, LSYS_PARSE_PROD);
               math.evaluate(v+'='+exp, scope);}
            //puts(`test func: _test_() = ${condition}`);
            scope._test_ = function () {return math.evaluate(`${condition}`, scope);}
            scope._expand_ = (module) => {
               module.p.forEach((arg,ndx) => {
                  if (arg[0] == "'" && arg[arg.length-1] == "'") {
                     //puts('returning arg');
                     module.p[ndx] = arg; // new String(arg);
                  } else {
                     //puts(`evaluating ${arg}`);
                     module.p[ndx] = math.evaluate(arg,scope);
                  }
               });
            }
         } else {
            scope={};
            scope._test_ = function(){return true;}
         }
         //puts("scope after funcs: " + Object.entries(scope));

         var rule = [predecessor, condition, successor, scope];
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
         puts("parseModules", LSYS_PARSE_SUCC);
         let l = new Array();
         let i = 0;
         let m;
         let re = RE.successorModule;
         while (m = re.exec(s)){
            puts(`matched: ${m} : lastIndex = ${re.lastIndex}`, LSYS_PARSE_SUCC);
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
                  puts(`parms: ${parms}`, LSYS_PARSE_SUCC);
               } else {
                  let ss = s.substring(m.indices[2][0], s.substring(m.indices[2][1]));
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

   /* parseDefine parses function and array declarations
      line-by-line parsing is too constrained for this.
      first, we'll get the to the end of the define section, then 
      chunk it into assign statements, and then we can use regular expressions to 
   */
   static  parseDefine (ls, start) {
      let pr = new ParseResult(P_HANDLED, inDefine);
      let n = 0;
      let nesting = [0];
      let nestIndex=0;

      puts(`parseDefine looking at: ${line}`);
      return pr;
      while (nesting[nestIndex] > 0 && n < line.length) {
         if (line[n] == '}') {
            nesting[nestIndex]--;
         } else if (line[n] == '{') {
            nesting[nestIndex]++;
         }
         n++;
      }
      if (nesting[nestIndex] == 0) {
         puts(`done with nestIndex ${nestIndex}`);
         if (nestIndex == 0) { // assume we're done with this line
            puts(`done with inDefine, nestPos=${nestPos} - ${pos+line.length}`);
            pr.status = P_TRANSITION;
            pr.nextState = inItems;
         }
      }
      
      return pr;
      
      // m = line.matchAll(RE.assignFun);
      //     puts(m);
      //     for (let parts of m) {
      //        let fname = parts[1];
      //        let parms = parts[2];
      //        let body = parts[3];
      //        puts(`${fname} = (${parms}) ${body}`);
      //        //ls.functions.set(fname, Function(parms, body));
      //        Lsystem.functions.set(fname, Function(parms, body));
      //     }
   }



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
            if ('object' == typeof e) {
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
   Rewrite (ls = this, it = 0, string=null ) {
      if (string===null) {
         ls.current = ls.axiom.slice();
      } else {
         ls.current = string;
      }
      ls.current = this.expand([null,null,ls.current, ls.locals]);
      let niter = (it <= 0) ? (ls.Dlength ? ls.Dlength : 1) : it;
      puts(`axiom: ${ls.current}`, LSYS_REWRITE);
      puts(`Number of iterations done: ${ls.dDone} to do: ${niter}`, LSYS_REWRITE);
      let mstring = ls.current;
      let lsnext;
      let lsLabel = ls.label;
      let rules = this.rules;
      let lsStack = [];
      let restrict = ls.restrict;
      // parallelize this later?
      let clength;
      for (let i=1; i <= niter; i++) {
         puts(`iteration ${i}\n${mstring}`, LSYS_REWRITE);
         clength = mstring.length;
         lsnext = mstring.slice();     // default production is to copy
         for (let n=0; n < clength; n++)   {
            let node = mstring[n];
            puts(`looking at node[${n}] = ${node}`, LSYS_REWRITE);
            // special handling of cut module, %
            if (node == '%') {
               let on = n;
               n = this.cut(lsnext, n);
               puts(`cut lsnext from ${on} to ${n}:\n${lsnext}`, LSYS_REWRITE);
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
               let scope = rule[3];
               let pred = rule[0]; // == [[lctxt] strictp [rctxt]]
               let strictp = pred[1];
               puts(`comparing  ${node} to strictp: ${strictp}`, LSYS_REWRITE_VERB);
 // todo: evaluate pre-condition expression before evaluating scope._test_()
               if (this.formalMatch(strictp, node, scope)) {
                  let lctxt = pred[0];
                  let rctxt = pred[2];
                  if (lctxt.length == 0 && rctxt.length == 0 && scope._test_()) {
                     if (bestrule === null) {
                        bestrule = rule;
                        bestruleContextLength = 0;
                        bestscope = scope;
                     }
                  } else {
                     if (lctxt.length && 
                         ! ls.findcontext(mstring, lctxt, n, -1, scope, restrict)) {
                           continue;
                     }
                     if (rctxt.length && 
                         ! this.findcontext(mstring, rctxt, n, 1, scope, restrict)) {
                        continue;
                     }
                     if (lctxt.length + rctxt.length > bestruleContextLength &&
                        scope._test_) {
                        bestrule = rule;
                        bestruleContextLength = lctxt.length + rctxt.length;
                        bestscope = scope;
                     }
                  }
               }
            }
            puts(`bestrule is ${bestrule}`, LSYS_REWRITE);
            if (bestrule) {
               this.formalMatch(bestrule, node, bestscope); // (re)bind formal arguments
 // todo: evaluate pre-condition expression ???
               if (bestscope._test_()) {
                  lsnext[n] = this.expand(bestrule);
                  doExpand=true;
                  puts(`this expanded ${mstring[n]} to ${lsnext[n]}`, LSYS_REWRITE, LSYS_EXPAND);
 // todo: evaluate post-condition expression ???
               }
            }
//            if (! doExpand) {
            // special case a few module types
            if (this.formalMatch(Lsystem.modLsystemStart, node, null)) {
               let sublslabel = node.p[0].toString();
               let subls = Lsystem.lsystems.get(sublslabel);
               if (subls) {
                  lsStack.push(ls);
                  ls = subls;
                  rules = ls.rules;
                  lsLabel= ls.label;
                  restrict = ls.restrict;
                  // what about lsystem global variables ???
                  puts(`switching to lsystem: ${lsLabel}`, LSYS_REWRITE);
                  //     continue;
               } else {
                  throw new Error(`lsystem: ${sublslabel} not found in ${node}`); 
               }
            } else if (this.formalMatch(Lsystem.modLsystemEnd, node, null)) {
               let subls = lsStack.pop()
               if (! subls) {
                  throw new Error(`lsystem: no lsystem found on stack!`); 
               } else {
                  ls = subls;
                  lsLabel = ls.label;
                  rules = ls.rules;
                  restrict = ls.restrict;
                  puts(`Returning to lsystem: ${lsLabel}`, LSYS_REWRITE);
                  //   continue;
               }
            }
         }
         mstring = flatten(lsnext);
         //puts(`iteration ${i + 1}\n${mstring}`, LSYS_REWRITE);
      }
      ls.current = mstring;
      if (string) {
         ls.dDone += niter;     // step case
      } else {
         ls.dDone = niter;
      }
      // this.next = null;
      puts(`Expanded tree has ${this.current.length} nodes after ${ls.dDone} interations`);
      return this.current;
   }

   expand(rule) {
      let successor;
      let scope=rule[3];
      if (scope.hasOwnProperty('_expand_')) {
         successor = rule[2].slice();
         puts(`nominal rule: ${rule[0]} : ${rule[1]} --> : ${successor}`, LSYS_EXPAND)
         successor.forEach((mod,ndx) => {if (typeof mod == 'object') {
            let nmod = mod.clone();
            scope._expand_(nmod);
            puts(`expanded module: ${nmod}`, LSYS_EXPAND);
            successor[ndx] = nmod;
         }});
         //puts(`successor: ${successor}`, LSYS_EXPAND);
         puts(`actual successor: ${rule[2]}`, LSYS_EXPAND);
      } else {
         successor = rule[2];
      }
      return successor;
   }
   moduleName(m) {
      if (typeof m == 'string') {
         return m;
      } else {                  // assume parameterized Module
         return m.m;
      }
   }
   // when rewriting/deriving an lsystem
   // nodeA must be a module in the rule with formal parameters
   // nodeB is a module in the expansion with an actual numeric value which
   // gets bound to the formal parameter from nodeA
   formalMatch(nodeA, nodeB, scope=null) {
      puts(`formalMatch ${nodeA} against ${nodeB}`, LSYS_MATCH);
      if (typeof nodeA == typeof nodeB) {
         if (typeof nodeA == 'string') {
            return nodeA == nodeB;
         } else if ((nodeA.m == nodeB.m) && (nodeA.p.length >= nodeB.p.length)) {
            // might want to yell if A.m == B.m, but number of arguments differ
            // go ahead and bind actual values to formal parameters
            if (nodeA.p.length != nodeB.p.length) {
               puts(`Warning: rule, ${nodeA.toString()}, expects ${nodeA.p.length} parameters, but module is: ${nodeB.toString()}`);
            }
            if (scope !== null && scope.hasOwnProperty('_bind_')) {
               for (let fp = 0; fp < nodeB.p.length; fp++) {
                  puts(`${scope._bind_}(${nodeA.p[fp]}, ${nodeB.p[fp]})`, LSYS_MATCH);
                  scope._bind_(nodeA.p[fp], nodeB.p[fp]);
               }
               if (LogTag.isSet(LSYS_MATCH)) {
                  puts("scope bind:");
                  scope.forEach((v,k) => {puts(`   ${k} == ${v}`);});
               }
            }
            return true;
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
         let mn = this.moduleName(mlist[n]);
         let cn = this.moduleName(ctxt[ci]);
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
      }
      return [c, n];
   }

   // null out all modules from start to first end-branch, ], module or to end
   // nxt is lsnext, which is initialized to be the current string
   // this depends on sequential left-right processing of L-system string
   cut (nxt, start) {
      let i = start;
      let atEnd=false;
      let nested = 0;
      do {
         nxt[i] = null;
         i++;
         if ( i >= nxt.length ){
            atEnd = true;
         } else {
            switch (nxt[i]) {
            case '[':
               nested++;
               break;
            case ']':
               atEnd = nested == 0;
               nested--;
               break;
            default:
               break;
            }
         }
      } while(! atEnd);
      return i;
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



var LSScope = function(map) {
   let s = {}
   if ( map) {
      map.forEach((v,k) => s[k] = v)
   }
   return s;
}

function initScope(o, ...maps) {
   // vmap.forEach((v,k) => o[k] = v); // map as object
   
   maps.forEach((vmap) => {
      vmap.forEach((v,k) => o.set(k,v)); // map as map
   });

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


