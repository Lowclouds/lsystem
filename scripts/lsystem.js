// dependencies
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

var testls =`delta = 2
derivation length: 2
axiom: ---/\FA(0)F+++
A(t) : t<10 -> A(t+1)FFF
A(t)>F : t==10 -> -FFFA(0)
`
var numReStr = '\\d+(?:\\.\\d+)?';
var symbolReStr = "[\\w\\d\\+-\\]['{}\&^\\\\/!\\.~\\|]";
var varnameReStr = '\\w[\\w\\d]*';
var startdReStr='^(?:#define|define:)[ \n]+\(';
var enddReStr = '\) ([^ ].*)';
var defineRe = new RegExp(`${startdReStr}${varnameReStr}${enddReStr}`);
var startiReStr = '^(?:#ignore|ignore:) +\(';
var endiReStr = '\+\)';
var ignoreRe =new RegExp(`${startiReStr}${symbolReStr}${endiReStr}`);
var dlengthRe = new RegExp(`^(?:[Dd]erivation length|[Dd]length): *\(\\d+)`);

var moduleReStr = `(${symbolReStr})(?:\\((\[^)]+)\\))?`;
var axiomRe = new RegExp(`(?:^axiom: *)?${moduleReStr}`,'g')
var param1ReStr=`${numReStr}|${varnameReStr}`;

var expReStr = '(.*(?=->))';
var prodNameStr = '(?:^[pP]\\d+:)';
var prodRe= new RegExp(`${prodNameStr}? *(?:${moduleReStr} *< *)?${moduleReStr}(?: *> *${moduleReStr})?(?: *: *${expReStr})? *-> *(.+)`)

var pfindReStr=`(${param1ReStr}),?`
var pfindRe = new RegExp(pfindReStr, "g"); //use in loop to find parameters

//var formalparmsReStr=`(${varnameReStr})(,\[^)]+)?`;
//var mRe=`(${symbolReStr})(?:\\((${param1ReStr})(?:,(\[^)]+))*\\))?`;
//var fmRe=`(${symbolReStr})(?:\\((${formalparmsre})\\))?`;

// the goal is to handle most Lsystems defined in TABOP, The Algorithmic Beauty of Plants,
// or by the Lsystems programs developed Przemyslaw Prusinkiewicz' group at the University
//  of Calgary, available here: http://algorithmicbotany.org
class Lsystem {
   about() {
      puts('the goal is to handle most Lsystems defined in TABOP, The Algorithmic Beauty of Plants,');
      puts("or by the Lsystems programs developed Przemyslaw Prusinkiewicz' group at the University");
      puts("of Calgary, available here: http://algorithmicbotany.org");
   }
   
   constructor(spec) {
      this.spec = null;	// should be a text file/string
      if (spec == null) {
	 this.spec = 'no specification';
      } else {
	 this.spec = spec;	// should be a text file/string
      }
      this.axiom = [];
      this.rules = [];
      this.Dlength = 0;	// number of iterations
      this.defs = new Map(); // from define statements
      this.vars = new Map(); // from variable assignment statements
      this.current = [];
      this.next = [];
      this.verbose = 0;
      this.stemsize = 1;
      this.step = 1;    // default forward step size
      this.delta = 90;	// default angle
      //this.ctable = [new BABYLON.Color3(0,1,0)]; // default color table
      this.ignore=[];
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
	 s = s + this.showOneProp(prop);
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
	 } else if (prop == 'rules') {
	    s = `rules:= [pre, strict, post] [cond] [succ]\n`
	    this.rules.forEach((r) => {
               console.log(`Showing: ${r}`);
               r.forEach((e,i) => {
	          s += '\[';
                  switch(i) {
                  case 0: 
                     e.forEach((p,j) => {
                        //console.log(`looking at ${p}`);
                        if (p) {s += this.listtostr([p]);}
                        if (j<2) {s += ',';}
                        return;
                     });
                     break;
                  case 1:
                     s += e;
                     break;
                  case 2:
                     s += this.listtostr(e);
                     break;
                  }
                  if (i<2) {
                     s += '\] ';
                  } else {
                     s += '\]';
                  }
                  return;
               });
               s += '\n';
               return;
            });
	 } else if (prop == 'axiom') {
            s = `${prop} = ` + this.listtostr(this.axiom) + '\n';
         } else {
	    s = `${prop} = ${this[prop]}\n`
	 }
      }
      return s;
   }
   // ------------------------------------------------------------

   initParse() {
      this.axiom = [];
      this.rules = [];
      this.homorules = [];
      this.Dlength = 0;
      this.defs.clear();
      this.vars.clear();
      this.stemsize = 1;
      this.delta = 90;
      this.current=[];
      this.next=[];
   }

   Parse (s = this.spec) {
      this.initParse();
      let pos=0;
      let end=s.length;
      let eol = 0;
      let line='';
      let assign;
      let parts;
      let m;			// this is the Re match
      const varRe = new RegExp(`^${varnameReStr} *=.+`);
      const assignRe = new RegExp(`(${varnameReStr}) *= *(${numReStr}),?`,'g');
      let preRe = /(?:([^< ]+) *< *)?([^> ]+)(?: *> *([^ ]+))?/;

      let have_axiom=false;
      let have_homomorphism=false;
      while (pos < end) {
         eol = s.indexOf('\n', pos);
         if (eol == -1) {break}	// file must end with newline or crnl
         if ((eol - pos) < 3) {
	    puts("skipping short line: " + s.slice(pos,eol));
	    pos = eol + 1; // advance file pointer
	    continue;
         }
         // remove spaces
         //line = [regsub -all " +" [string range $s $pos [expr {$eol - 1}]] " "]

	 line = s.slice(pos,eol).replaceAll(/ +/g,' ').replaceAll(/\r/g,'');
         puts(`${pos}-${eol} : ${line}`);
         pos = eol + 1; // advance file pointer
         if (! have_axiom) {
	    if (varRe.test(line)) {
	       assign = line.matchAll(assignRe);
	       for (let parts of assign) {
		  this.vars.set(parts[1], parts[2])
	       }
	       this.show(this, 'vars');
	    } else if (null != ( m = line.match(dlengthRe))) {
	       puts(`matched "derivation length: " got: ${m[1]}`);
               this.Dlength = m[1];
	       this.show('Dlength');
	    } else if (null != (m = line.match(defineRe))) {
               this.defs.set(m[1], m[2]);
	       this.show('defs');
	    } else if (null != (m = line.match(ignoreRe))) {
               this.ignore = this.strtolist(m[1]) 
	       this.show('ignore');
	       // } else if (null != (m = line.match(includere))) {
	       //     puts("include of m[1] not supported");
	    } else if (m = line.match(/^axiom:(.*)/)) {
               //puts "$line -> $m -> [lindex $m 1] -> [strtolist [lindex $m 1]]"
               have_axiom = true;
               this.axiom = this.strtolist(m[1]);
	       this.show('axiom');
	    } else {
               puts(`unrecognized statement: ${line}`);
	    }
         } else {
	    // should be just rules/productions
	    // break into pieces: [prodname] : predecessor : [condition] -> successor
	    // prodname and condition are optional. condition is only for parameterized
	    // lsystems. TABOP is fairly consistent for parameterized systems, but
	    // kinda all over the map in terms of syntax
	    let predecessor, condition, successor;
	    let ix, cx, m, pre, strict, post, dummy ;
            let scope = {}, needScope=false;
	    //puts(`in rules: looking at ${line}`)
	    if (line.includes('homomorphism')) {
	       have_homomorphism = true;
	       continue;
	    }
	    m = prodRe.exec(line);
	    if (m == null) {
	       puts(`Unrecognized production: ${line}`); 
	       break;
            }
	    //puts(m);
            predecessor = [null, null, null];
	    condition = '';
            for (let p = 0; p < 3; p++) {
               let i = 2*p +1;
               let j = i + 1;
	       if ( !(m[i] === undefined)) {
                  if (m[j] === undefined) {
                     predecessor[p] = m[i];
                  } else {
                     predecessor[p] = new ParameterizedModule(m[i],m[j]);
                     needScope=true;
                  }
               } else {}
            }
            condition = m[7];   // undefined or not
            if (condition) {
               needScope=true;
            } else {
               condition = true; // default of no condition
            }
            // turn successor into a list of modules
            // since we need to deal with nested parens, strtolist doesn't work
	    successor = this.parseSuccessor(m[8]);
            if (successor.find(e=>'object' == typeof e)) {
               needScope = true;
            }
            if (needScope) {
               //scope = new LSScope(this.vars); // copy global variables
               scope = {};
               initScope(scope, this.vars);
               //puts("scope before funcs: " + Object.entries(scope));

               scope._bind_ = function (v, exp) {math.evaluate(v+'='+exp, this);}
               //puts(`test func: _test_() = ${condition}`);
               math.evaluate(`_test_() = ${condition}`, scope)
               scope._expand_ = function(module) {
                  for (let a= 0; a< module.p.length; a++) {
                     module.p[a] = math.evaluate(module.p[a],this);
                  }
               }
            } else {
               scope._test_ = function(){return true;}
            }
            //puts("scope after funcs: " + Object.entries(scope));

            var rule = [predecessor, condition, successor, scope];
	    // puts(`rule: ${rule}`);
	    
	    if (! have_homomorphism) {
	       this.rules.push(rule);
	    } else {
	       this.homorules.push(rule);
	    }
         }
         //puts(`${pos} ${eol}`);
      }
      if (! this.Dlength) {
	 if (this.vars.has('n')) {
	    this.Dlength = this.vars.get('n');
	 } else {
	    this.Dlength = 1;
	 }
      }
      this.verbose=0;
      this.show();
   }

   flatten( list) {
      let r=[];
      for (let i=0;i<list.length;i++) {
	 v=list[i];
	 if (Array.isArray(v)) {
	    //put('list[' + i + ']: ' + v + ' is an array');
	    for (let j=0, m; m=v[j]; j++) {r.push(m)}
	 } else {
	    //put('list[' + i + ']: ' + v + ' is NOT an array');
	    r.push(v);
	 }
      }
      return r;
   }
   
   strtolist(s) {
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

   listtostr(l) {
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
         return;
      });
      return r;
   }

   parseSuccessor(s) {
      //puts("parseSuccessor");
      let l = new Array();
      let i = 0;
      let m;
      let re =  new RegExp(`(${symbolReStr})(\\(.*)?`, 'gd');
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
               puts(`Error: end of input while parsing: ${ss}`);
               break;
            }
         }
         //puts(`module ${i} = ${l[i]}`);
         i++;
      }
      return l;
   }
   // nodeA must be a predecessor node in the rule with formal parameters
   // nodeB is a node in the expansion with an actual numeric value which
   // gets bound to the formal parameter from nodeA
   formalMatch(nodeA, nodeB, scope) {
      if (typeof nodeA == typeof nodeB) {
         if (typeof nodeA == 'string') {
            return nodeA == nodeB;
         } else if ((nodeA.m == nodeB.m) && (nodeA.p.length == nodeB.p.length)) {
            // might want to yell if A.m == B.m, but number of arguments differ
            // go ahead and bind formal parameters
            // puts('binding formal parameters');
            for (let fp = 0; fp < nodeA.p.length; fp++) {
               //puts(`${scope._bind_}(${nodeA.p[fp]}, ${nodeB.p[fp]}`);
               scope._bind_(nodeA.p[fp], nodeB.p[fp]);
               //puts("scope bind: " + Object.entries(scope));
            }
            return true;
         }
      } else {
         return false;
      }
   }

   Rewrite (ls = this) {
      ls.current = ls.axiom.slice();
      puts(`axiom: ${ls.current}`);
      let niter = (ls.Dlength ? ls.Dlength : 1);
      puts(`Number of iterations is ${niter}`);
      // parallelize this later
      let clength;
      for (let i=0; i < niter; i++) {
         clength = ls.current.length;
	 ls.next = ls.current.slice();     // default production is to copy
         for (let n=0; n < clength; n++) {
	    let node = ls.current[n];
            //puts(`looking at node[${n}] = ${node}`);
	    for (const rule of ls.rules) {
               let pred = rule[0];
               let scope = rule[3];
               let strictp = pred[1];
               if (this.formalMatch(strictp, node, scope)) {
                  // puts(`strictp: ${strictp} matches ${node}`);
		  let lside = pred[0];
		  let rside = pred[2];
		  if (! lside && ! rside && scope._test_()) {
                     ls.next[n] = this.expand(rule);
                     //puts(`unconditional expansion to: ${ls.next[n]}`);

                     break;
		  } else {
                     if (lside) {
			let lsidectxt = this.findcontext(ls, ls.current, n, -1);
			if (! this.formalMatch(lside, lsidectxt, scope)) { 
                           continue;
			}
			// puts(`found left context ${lsidectxt} < ${lside}`);
                     }
                     if (rside) {
			let rsidectxt = this.findcontext(ls, ls.current, n, 1);
			if (! this.formalMatch(rside, rsidectxt, scope)) { 
                           continue;
			}
			// puts(`found right condition ${rside} > ${rsidectxt}`);
                     }
                     if (scope._test_()) {
                        ls.next[n] = this.expand(rule);
                        //puts(`this expanded ${n} to ${ls.next[n]}`);
                        break;  // stop looking through rules
                     }
		  }
               }
	    }
         }
         ls.current = flatten(ls.next);
         // puts(`iteration ${i + 1}\n${ls.current}`);
      }
      ls.next = null;
      puts(`Expanded tree has ${ls.current.length} nodes`);
      lblNumNodes.textContent=ls.current.length;
      lblNumDrawn.textContent=0;

      return ls.current;
   }

   expand(rule) {
      let successor;
      let scope=rule[3];
      if (scope) {
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

   // ls is the lsystem we are parsing
   // slist is ls.current, i.e. the current expansion
   // snode is the start node
   // dir is the direction/context in the string: -1 for left, 1 for right
   // return the next module, skipping any branches or nothing
   findcontext (ls = this, slist, snode, dir) {
      let cignore = ls.ignore.slice(); // copy
      lappend(cignore, '[', ']', '{', '}'); // maybe need to change this
      let nmax = slist.length;
      let n = snode + dir;	// the node we are looking at
      let m;
      while (n >= 0 && n < nmax) {
         m = slist[n];		// the module
         if (dir < 0) {         //# left context:lside:acropetal
	    while (m == ']') {
               [m, n] = this.skipbrackets(slist, n, dir);
	    } 
	    //puts(`findcontext of ${snode} (maybe) at ${n}: ${m} < ${slist[snode]}`);
         } else {		//# dir == 1 right context: basipetal
	    if (m == ']') { return ''}; //# at end of branch
	    while (m == '[') {		// this fails for A > B[C] or A > [C]D or A > [C]
               [m, n] = this.skipbrackets(slist, n, dir);
	    }
	    //puts(`findcontextof ${snode} (maybe) at ${n}: ${slist[snode]} > ${m}`);
         }                
         if (! cignore.includes(m)) {
	    return m;
         }
         n += dir;
      }
      return '';
   }

   //# basically skip (\[[^]+\])* from either the left or right
   //# dir is +/- 1
   // returns a list of first char beyond bracketed group and its position
   // if group is at either end, returns empty char and -1 or list length
   skipbrackets (larray, start, dir) {
      let l = larray;
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
	    return [];
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
}

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
	 r.push(v);
      }
   }
   return r;
}

function strtolist(s) {
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

var ParameterizedModule = function(name, parms) {
   this.m = name;
   //this.p = parms.split(','); doesn't work for expressions line (x,atan(y,x))
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

var LSScope = function(map) {
   if (map) {
      map.forEach((v,k) => this[k] = v)
   }
}
function initScope(o, map) {
   map.forEach((v,k) => o[k] = v);
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
