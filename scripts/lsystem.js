/// dependencies
// cpp.js to remove comments and expand #defines.
//    this version modified to ignore // comments, since they 
//    can occur in production strings
// math.js for math.evaluate
// babylon.js for color, and probably more, like meshes
// turtle3d.js for actually drawing a tree.

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

var testls =`
#define P sin(PI)
delta = 2
derivation length: 2
axiom: ---/\FA(0)F+++
A(t) : t<10 -> A(t+1)FFF
A(t)>F : t==10 -> -FFFA(0)
`

/* test for module RE string
   'AB F(n)fGg@M(1,2,3)+-&^\\(1)/(3)|$% @v@c(x,y,z)?P(x,y,z)~S~S12'.matchAll(RE.module)
*/


const RE = {};
var numReStr = '\\d+(?:\\.\\d+)?';
//var symbolReStr = "[\\w\\d\\+\\-\\]['{}\&^\\\\/!\\.~\\|]";
var symbolReStr = "[\\w\\d\\+\\-\\][,;'{}\&^\\\\/#!\\.\\|\\$%]|@D[eimos]|@b[od]|@[#!bcoOsvMmRTD]|@G[scetr]|@D[idce]|\\?[PHLU]?|~\\w\\d*";
var varnameReStr = '\\w[\\w\\d]*';
var startdReStr='^(?:#define)[ \\t]+\(';
var enddReStr = '\)[ \\t]+([^ \\t].*)';
RE.define = new RegExp(`${startdReStr}[^ \\t]+${enddReStr}`);
var startiReStr = '^(?:#?[iI]gnore:) *\(';
var endiReStr = '\+\)';
var startcReStr = '^(?:#?[cC]onsider:?) +\(';
RE.ignore = new RegExp(`${startiReStr}(${symbolReStr})${endiReStr}`); // do I need moduleReStr???
RE.consider = new RegExp(`${startcReStr}(${symbolReStr})${endiReStr}`); // do I need moduleReStr???
RE.dlength = new RegExp(`^(?:[Dd](?:erivation )?length): *\(\\d+)`);
RE.axiom = /^[aA]xiom:\s*(\S.*)/;       // new RegExp(`(?:^axiom: *)?${moduleReStr}`,'g')
RE.lsystem = /^[lL][sS]ystem: *([^ \\t]+)/;
var moduleReStr = `(${symbolReStr})(?:\\((\[^)]+)\\))?`; // A(m,n), or &, or $(3), or ?P(x,y)
RE.modules = new RegExp(`${moduleReStr} *`,'g');
RE.successorModule = new RegExp(`(${symbolReStr})(\\(.*)?`, 'gd');
RE.ws = /\s+/g;

var param1ReStr=`${numReStr}|${varnameReStr}`;

var expReStr = '(.*(?=->))';
var prodNameStr = '(?:^[pP]\\d+:)';
//RE.prod = new RegExp(`${prodNameStr}? *(?:(?:${moduleReStr})+<)?${moduleReStr}(?:>(?:${moduleReStr})+)?(?::${expReStr})?--?>(.+)`);

RE.prodTop = new RegExp(`${prodNameStr}? *(.*?)--?>(.*)`)
RE.leftSide = /(?:([^<>:]+)<)?([^>:]+)(?:>([^:]+))?(?::(.+))?/;

RE.var = new RegExp(`^${varnameReStr} *=.+`);
RE.assign = new RegExp(`(${varnameReStr}) *= *(${numReStr}),?`,'g');
//RE.preRe = /(?:([^< ]+) *< *)?([^> ]+)(?: *> *([^ ]+))?/;


var pfindReStr=`(${param1ReStr}),?`
var pfindRe = new RegExp(pfindReStr, "g"); //use in loop to find parameters
var ParameterizedModule = function(name, parms) {
   this.m = name;
   //this.p = parms.split(','); doesn't work for expressions like (x,atan(y,x))
   // need to recognize nested commas
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
   this.p = parseParens(parms);
   this.toString = function() {return this.m + '(' + this.p.toString() + ')';}
   this.clone = function() {
      return new ParameterizedModule(this.m, this.p.toString());
   }
}
//var formalparmsReStr=`(${varnameReStr})(,\[^)]+)?`;
//var mRe=`(${symbolReStr})(?:\\((${param1ReStr})(?:,(\[^)]+))*\\))?`;
//var fmRe=`(${symbolReStr})(?:\\((${formalparmsre})\\))?`;

// the goal is to handle most Lsystems defined in TABOP, The Algorithmic Beauty of Plants,
// or by the Lsystems programs developed Przemyslaw Prusinkiewicz' group at the University
//  of Calgary, available here: http://algorithmicbotany.org
class Lsystem {
   about() {
      puts('the goal is to handle most Lsystems defined in TABOP, The Algorithmic Beauty of Plants,');
      puts("or by the Lsystems programs developed by Przemyslaw Prusinkiewicz' group at the University");
      puts("of Calgary, available here: http://algorithmicbotany.org");
   }
   
   constructor(spec,lbl = '1') {
      this.spec = null;	// should be a text file/string or empty for sub-lsystems
      if (spec == null) {
	 this.spec = 'no specification';
      } else {
	 this.spec = spec;	// should be a text file/string
      }
      this.label = lbl;
      this.axiom = [];
      this.rules = [];
      this.decomprules = [];      // unimplemented
      this.homorules = [];      // unimplemented
      this.Dlength = 0;	// number of iterations
      this.globals = new Map(); // from define statements
      this.locals = new Map(); // from variable assignment statements
      this.current = [];
      this.next = [];
      this.verbose = 0;
      this.stemsize = 0.1;
      this.step = 1;    // default forward step size
      this.delta = 90;	// default angle
      this.ignore=[];
      this.consider=[]; 
      this.restrict = null; // either ignore or consider
      this.needsEnvironment = false;
      this.subLsystems = null;  // only main lsystem, 1, should be a non-null Map
   }

   // single map for all lsystems in a spec
   // we want the first entry to be the main lsystem
   static lsystems = new Map();
   static modLsystemStart = new  ParameterizedModule('?', 'i,s');
   static modLsystemEnd = '$';
   

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
	          s = `${prop}:= [pre, strict, post] [cond] [succ] [scope]\n`;
	          this[prop].forEach((r) => {
                     //console.log(`Showing: ${r}`);
                     r.forEach((e,i) => {
	                s += '\[';
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
                        s += '\]';
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
      this.globals.clear();
      this.locals.clear();
      //this.stemsize = 0.1;
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


   static Parse (spec) {
      const  P_ERROR=0, P_UNHANDLED = 1, P_HANDLED = 2, P_TRANSITION=3;
      // preprocess the spec with standard Cpp-like preprocessor
      let pp = new cpp_js();
      // define these here so recursive invocations of parseHelper
      // all use the same spec and indices into it.
      let s = pp.run(spec), pos = 0;
      s=s.replaceAll(/\n\n+/g, '\n'); // remove blank lines

      let end = s.length;      
      let m;                            // common match variable
      let ls0 = new Lsystem(s, 'main'); // preemptively naming it 
      Lsystem.lsystems.clear();
      Lsystem.lsystems.set('main', ls0);

      parseHelper(ls0);    // this is the toplevel lsystem

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
         let eol_ = s.indexOf('\n', p);
            if (eol_ == -1) {
               eol_ = s.length;
               //puts('Warning EOL not found!'); 
            }
         return eol_;
      }

      function parseHelper (ls, isSubLs = false) {
         let line='', eol = 0;
         if (!isSubLs && s == 'no specification') {
            puts('nothing to parse');
            return;
         } 

         ls.initParse(isSubLs);

         let parseState  = inItems; // initial parse state
         let parseResult;       // {status, nextState}
         let have_axiom=false;
         let have_homomorphism=false;
         while (pos < end) {
            eol = findEOL(s,pos);
            if ((eol - pos) < 3) {
	       puts("skipping short line: " + s.slice(pos,eol));
	       pos = eol + 1; // advance file pointer
	       continue;
            }
            // remove extra spaces and carriage returns
	    line = s.slice(pos,eol).replaceAll(/  +/g,' ').replaceAll(/\r/g,'');
            puts(`${pos}-${eol} : ${line}`);
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
            // puts(`${pos} ${eol}`);
         } // not at end of spec
         return ls;
      }
      
      function ParseResult (s=P_ERROR, n=errorState) {
         return {status: s, nextState: n};
      }

      function inItems (ls, line) {
         let pr = new ParseResult(P_HANDLED, inItems);
         if (RE.var.test(line)) {
            let assign = line.matchAll(RE.assign);
            for (let parts of assign) {
               ls.locals.set(parts[1], parts[2])
            }
            ls.show('vars');
         } else if (null != ( m = line.match(RE.lsystem))) {
            // this should happen only on the initial lsystem and covers the case
            // of strictly valid lsystems with an 'lsystem: chars' statement
            // otherwise, we should pick up the lsystem statement in wantLsystem
            puts(`matched "lsystem: xxx" got: ${m[1]}`);
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
               puts(`reset lsystem name to ${ls.label} from ${oldlabel}`);
               ls.show('label');
            }
         } else if (null != ( m = line.match(RE.dlength))) {
            puts(`matched "derivation length: " got: ${m[1]}`);
            ls.Dlength = m[1];
            ls.locals.set('DLength', m[1])
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
         } else {
            pr.status = P_UNHANDLED;
            puts(`unrecognized statement: ${line}`);
         }
         return pr;
      }

      function inProductions (ls, line) {
         let pr = new ParseResult(P_HANDLED, inProductions);
         puts(`inProductions looking at: ${line}`);
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
         puts(`inDecomposition looking at: ${line}`);
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
         } // else if (line.includes('#define')) { // swallow everything else
         //    pr.status = P_UNHANDLED;
         // } 

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
            puts(`Unrecognized production: ${line}`); 
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
         if (condition) {
            needScope=true;
         } else {
            condition = true; // default of no condition
         }

         if (needScope) {
            scope = new Map();
            initScope(scope, ls.globals, ls.locals);
            //puts("scope before funcs: " + Object.entries(scope));

            scope._bind_ = function (v, exp) {math.evaluate(v+'='+exp, scope);}
            //puts(`test func: _test_() = ${condition}`);
            scope._test_ = function () {return math.evaluate(`${condition}`, scope);}
            scope._expand_ = function(module) {
               for (let a= 0; a< module.p.length; a++) {
                  module.p[a] = math.evaluate(module.p[a], scope);
               }
            }
         } else {
            scope={};
            scope._test_ = function(){return true;}
         }
         //puts("scope after funcs: " + Object.entries(scope));

         var rule = [predecessor, condition, successor, scope];
         puts(`rule: ${rule}`);
         return rule;
      }

      // predecessors can't have nested function calls, they are either
      // bare variables or numbers
      function parseModules(s, isStrict = false) {
         let mods = [];
         // puts('parseModules looking at: ' + s);
         if (s) {
            let it = s.matchAll(RE.modules);
            for (m of it) {
               //puts('parseModules matching: ' + m);
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
         //puts("parseModules");
         let l = new Array();
         let i = 0;
         let m;
         let re = RE.successorModule;
         while (m = re.exec(s)){
            // puts(`matched: ${m} : lastIndex = ${re.lastIndex}`);
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
                  //puts(`starting from: ${s.substring}`)
               } else {
                  let ss = s.substring(m.indices[2][0], s.substring(m.indices[2][1]));
                  throw new Error(`Error: end of input while parsing: ${ss}`);
                  break;
               }
            }
            //puts(`module ${i} = ${l[i]}`);
            i++;
         }
         return l;
      }
   }; // end of Parse

   static flatten( list) {
      let r=[];
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
   Rewrite (ls = this, axiom = null) {
      if (axiom === null) {
         ls.current = ls.axiom.slice();
      } else {
         ls.current = axiom;
      }
      puts(`axiom: ${ls.current}`);
      let mstring = ls.current;
      let lsnext;
      let lsLabel = ls.label;
      let rules = this.rules;
      let lsStack = [];
      let restrict = ls.restrict;
      let niter = (ls.Dlength ? ls.Dlength : 1);
      puts(`Number of iterations is ${niter}`);
      // parallelize this later
      let clength;
      for (let i=0; i < niter; i++) {
         clength = mstring.length;
	 lsnext = mstring.slice();     // default production is to copy
         for (let n=0; n < clength; n++) {
	    let node = mstring[n];
            puts(`looking at node[${n}] = ${node}`);
            // special handling of cut module, %
            if (node == '%') {
               let on = n;
               n = this.cut(lsnext, n);
               //puts(`cut lsnext from ${on} to ${n}:\n${lsnext}`);
               continue;
            }
            // 
            let doExpand = false;
	    for (const rule of rules) {
               //puts(`matching against rule: ${rule}`);
               let pred = rule[0]; // == [[lctxt] strictp [rctxt]]
               let scope = rule[3];
               let strictp = pred[1];
               //puts(`comparing  ${node} to strictp: ${strictp}`);
               if (this.formalMatch(strictp, node, scope)) {
		  let lctxt = pred[0];
		  let rctxt = pred[2];
         	  if (! lctxt.length && ! rctxt.length && scope._test_()) {
                     lsnext[n] = this.expand(rule);
                     doExpand=true;
                     //puts(`unconditional expansion to: ${lsnext[n]}`);
                     break;
		  } else {
                     puts(`context sensitive rule: lctxt: ${lctxt} or rctxt: ${rctxt}`);
                     if (lctxt.length && 
                         ! ls.findcontext(mstring, lctxt, n, -1, scope, restrict)) {
                           continue;
		     }
		     if (rctxt.length && 
                         ! this.findcontext(mstring, rctxt, n, 1, scope, restrict)) {
                        continue;
		     }
 // todo: evaluate pre-condition expression
                     doExpand = scope._test_();
                     if (doExpand) {
 // todo: evaluate post-condition expression 
                        lsnext[n] = this.expand(rule);
                        puts(`this expanded ${mstring[n]} to ${lsnext[n]}`);
                        break;  // stop looking through rules
                     }
		  }
               }
	    }
            if (! doExpand) {
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
                     puts(`switching to lsystem: ${lsLabel}`);
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
                     puts(`Returning to lsystem: ${lsLabel}`);
                     //   continue;
                  }
               }
            }
         }
         mstring = flatten(lsnext);
         //puts(`iteration ${i + 1}\n${mstring}`);
      }
      ls.current = mstring;
      // this.next = null;
      puts(`Expanded tree has ${this.current.length} nodes`);
      lblNumNodes.textContent=this.current.length;
      lblNumDrawn.textContent=0;

      return this.current;
   }

   expand(rule) {
      let successor;
      let scope=rule[3];
      if (scope.hasOwnProperty('_expand_')) {
         successor = rule[2].slice();
         //puts(`successor after slice: ${successor}`)
         successor.forEach((mod,ndx) => {if (typeof mod == 'object') {
            let nmod = mod.clone();
            scope._expand_(nmod);
            //puts(`expanded module: ${nmod}`);
            successor[ndx] = nmod;
         }});
         //puts(`successor expanded: ${successor}`);
         //puts(`rule successor: ${rule[2]}`);
      } else {
         successor = rule[2];
      }
      return successor;
   }

   // when rewriting/deriving an lsystem
   // nodeA must be a module in the rule with formal parameters
   // nodeB is a module in the expansion with an actual numeric value which
   // gets bound to the formal parameter from nodeA
   formalMatch(nodeA, nodeB, scope=null) {
      puts(`formalMatch ${nodeA} against ${nodeB}`);
      if (typeof nodeA == typeof nodeB) {
         if (typeof nodeA == 'string') {
            return nodeA == nodeB;
         } else if ((nodeA.m == nodeB.m) && (nodeA.p.length >= nodeB.p.length)) {
            // might want to yell if A.m == B.m, but number of arguments differ
            // go ahead and bind actual values to formal parameters
            if (nodeA.p.length != nodeB.p.length) {
               puts(`Warning: rule expects ${nodeA.p.length} parameters, but module has ${nodeB.p.length}`);
            }
            if (scope !== null && scope.hasOwnProperty('_bind_')) {
               for (let fp = 0; fp < nodeB.p.length; fp++) {
                  //puts(`${scope._bind_}(${nodeA.p[fp]}, ${nodeB.p[fp]}`);
                  scope._bind_(nodeA.p[fp], nodeB.p[fp]);
                  //puts("scope bind:");
                  //scope.forEach((v,k) => {puts(`   ${k} == ${v}`);});
               }
            }
            return true;
         }
      } else {
         //puts(`node types mismatch: A == ${typeof nodeA}, B=${typeof nodeB}`);
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
      let n = snode + dir;	// index of the module to look at
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
      puts(`ctxt: ${ctxt}, snode: ${snode}, dir: ${dir}`);
      puts(`restrict: ${restrict}, ignore: ${ignore}, consider: ${consider}`);

      while (n >= 0 && n < nmax) {
         m = mlist[n];
         c = ctxt[ci];
         if ((ignore && ignore.includes(m)) || (consider && !consider.includes(m))) {
            n += dir;           // next module, same context
            puts(`skipping module ${m}`);
         } else {
            if (dir < 0) {         //# left context:upwards:acropetal
               switch (m) {
               case ']':
                  [m, n] = this.skipbrackets(mlist, n, dir);
                  break;
               case '[': 
                  n--;             // skip over bracket
                  puts('skipping over [ to left');
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
            } else {		//# dir == 1 right context:downwards:basipetal
	       if (m == '[' && c != '[') { 
                  [m, n] = this.skipbrackets(mlist, n, dir);
               } else if (c == ']') {
                  while (m != ']') {
                     n++;
                     if (n < nmax) {
                        m = mlist[n];
                     } else {
                        //puts('fell off right end of string looking for "]"');
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
   //# dir is +/- 1
   // returns a list of first char beyond bracketed group and its position
   // if group is at either end, returns empty char and -1 or list length
   skipbrackets (marray, start, dir) {
      let l = marray;
      let nmax = l.length;
      let startbracket = l[start];
      let openBracket, closeBracket;
      if (dir == 1) {
         if (startbracket == '\[') {
	    openBracket = '\[';
	    closeBracket = ']';
         } else {
	    //puts(`starting with ${startbracket} must proceed to right`);
	    return ["", start];
         }
      } else {
         if (startbracket == ']') {
	    openBracket = ']' ;
	    closeBracket = '\[' ;
         } else {
	    //puts(`starting with ${startbracket} must proceed to left`);
	    return ["", start];
         }
      }  
      let n = start;
      let nested = 1;
      let c;
      // puts(`at start: l[${n}] = ${l[n]}`);
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

Lsystem.prototype.lsystems = new Map(); // Bag of all lsystems 'main' = initial one


// flatten a list by one level
function flatten( list) {
   // puts('flattening');
   let r=[];
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

function puts(o) {console.log(o);}


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
