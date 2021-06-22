var testls = `n=30,delta=22.5
#ignore +-F
axiom: F1F1F1
p1: 0 < 0 > 0 -> 0
p2: 0 < 0 > 1 -> 1[+F1F1]
p3: 0 < 1 > 0 -> 1
p4: 0 < 1 > 1 -> 1
p4: 1 < 0 > 0 -> 0
p4: 1 < 0 > 1 -> 1F1
p4: 1 < 1 > 0 -> 0
p4: 1 < 1 > 1 -> 0
p5: + -> -
p5: - -> +
`

var numRe = '\\d+(?:\.\\d+)?';
var symbolRe = "[\\w\\d\\+-\\]['{}\&^\\\\/!\\.~]";
var varnameRe = '\\w[\\w\\d]*';
var startdRe='^#?define +\(';
var enddRe = '\) ([^ ].*)';
var defineRe = new RegExp(`${startdRe}${varnameRe}${enddRe}`);
var startiRe = '^#?ignore +\(';
var endiRe = '\+\)';
var ignoreRe =new RegExp(`${startiRe}${symbolRe}${endiRe}`);
var dlengthRe = new RegExp(`^derivation length: *\(\\d+)`);

var moduleRe = `${symbolRe}(?:\\(\[^)]+\\))?`;
var axiomRe = new RegExp(`(?:^axiom: *)?(${moduleRe})`,'g')
var param1Re=`${numRe}|${varnameRe}`;

var prod0Re=/(?:^[^:]+(:))?(?:[^:]+(:))?(?:.*(->) *)/d;

//var pfindReStr=`(${param1Re}),?`
// var pfindRe = newRegExp(pfindReStr, "g"); //use in loop to find parameters

//var formalparmsre=`(${varnameRe})(,\[^)]+)?`;
//var mre=`(${symbolRe})(?:\\((${param1Re})(?:,(\[^)]+))*\\))?`;
//var fmre=`(${symbolRe})(?:\\((${formalparmsre})\\))?`;

// the goal is to handle most Lsystems defined in TABOP, The Algorithmic Beauty of Plants,
// or by the Lsystems programs developed Przemyslaw Prusinkiewicz' group at the University
//  of Calgary, available here: http://algorithmicbotany.org
class Lsystem {
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
      this.vars = new Map(); // from variable parameters
      this.current = [];
      this.next = [];
      this.verbose = 0;
      this.stemsize = 1;
      this.step = 1;		// default forward step size
      this.delta = 90;	// default yaw angle
      this.ctable = [new BABYLON.Color3(0,1,0)]; // default color table
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
	    for (const e of this.rules) {
	       s = s + `\[${e[0]}\] \[${e[1]}\] \[${e[2]}\]\n`;
	    }
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
      const varRe = new RegExp(`^${varnameRe}=.+`);
      const assignRe = new RegExp(`(${varnameRe})=(${numRe}),?`,'g');
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
         puts(`${line}: ${pos} ${eol}`);
         pos = eol + 1; // advance file pointer
         if (! have_axiom) {
	    if (varRe.test(line)) {
	       assign = line.matchAll(assignRe);
	       for (let parts of assign) {
		  this.vars.set(parts[1], parts[2])
	       }
	       this.show(this, 'vars');
	    } else if (null != ( m = line.match(dlengthRe))) {
	       //puts(`matched "derivation length: digits" got: ${m}`);
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
	    } else if ('' != (m = Array.from(line.matchAll(axiomRe), x => x[1]))) {
               //puts "$line -> $m -> [lindex $m 1] -> [strtolist [lindex $m 1]]"
	       this.axiom = m;
               have_axiom = true;
	       this.show('axiom');
	    } else {
               puts(`unrecognized statement: ${line}`)
	    }
         } else {
	    // var prod0Re=/(?:^[^:]+(:))?(?:[^:]+(:))?(?:.*(->) *)/d;
	    // should be just rules/productions
	    // break into pieces: [prodname] : predecessor : [condition] : successor
	    // prodname and condition are optional. condition is only for parameterized
	    // lsystems. TABOP is fairly consistent for parameterized systems, but
	    // kinda all over the map in terms of syntax
	    let predecessor, successor, condition;
	    let ix, cx, m, pre, strict, post, dummy ;
	    puts(`in rules: looking at ${line}`)
	    if (line.includes('homomorphism')) {
	       have_homomorphism = true;
	       continue;
	    }
	    m = prod0Re.exec(line);
	    if (m == null) {
	       puts(`Unrecognized production: ${line}`); 
	       break;
	    }
	    puts(m);
	    ix = m['indices'][0][1];
	    successor=line.slice(ix); // string range $line [expr {$ix + 1}] end]
	    condition = '';
	    if (m['indices'][2]) {
	       cx = m['indices'][2][0];
               condition = line.slice(cx, ix - 3); // ix-2?
	    } else {
	       //puts(`m.indices[3] is ${m.indices[3][0]}, ${m.indices[3][1]}`)
               cx = m['indices'][3][0];
	    }
	    
	    if (m['indices'][1]) { // have a production name
	       //puts(`m.indices[1] is ${m.indices[1][0]}, ${m.indices[1][1]}`)
	       ix=m['indices'][1][1];		
               predecessor = line.slice(ix, cx);
	       //puts(`line.slice(${ix},${cx}) is ${predecessor}`)
	    } else {
               predecessor = line.slice(0, cx);
	       //puts(`predecessor is "${predecessor}"`);
	    }
	    if (predecessor != '') {
	       [dummy, pre, strict, post ] = preRe.exec(predecessor);
	       predecessor = [pre, strict, post];
	    } else {
	       predecessor = [];
	    }
	    // turn successor into a list of modules
	    successor = this.strtolist(successor.replaceAll(/ +/g,''));
	    puts(`rule: [${predecessor} ${condition} ${successor}]`)
	    if (! have_homomorphism) {
	       this.rules.push([predecessor, condition, successor]);
	    } else {
	       this.homorules.push([predecessor, condition, successor]);
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

   static flatten( list) {
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
      return s.split('');
   }

   listtostr(l) {
      return l.join('');
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
	    for (const rule of ls.rules) {
               let p = rule[0];
               let strictp = p[1];
               if (node == strictp) { 
		  //# not parameterized
		  let lside = p[0];
		  let rside = p[2];
		  if (! lside && ! rside) {
                     ls.next[n] = this.expand(rule);
                     break;
		  } else {
                     if (lside) {
			let lsidectxt = this.findcontext(ls, ls.current, n, -1);
			if (lside != lsidectxt) { 
                           continue;
			}
			//puts(`found left context ${lsidectxt} < ${lside}`);
                     }
                     if (rside) {
			// # [lindex $current [expr {$n + 1}]]
			let rsidectxt = this.findcontext(ls, ls.current, n, 1);
			if (rside != rsidectxt) { 
                           continue;
			}
			//puts(`found right condition ${rside} > ${rsidectxt}`);
                     }
                     ls.next[n] = this.expand(rule);
                     //puts(`this expanded ${n} to ${ls.next[n]}`);
                     break;
		  }
               }
	    }
         }
         ls.current = flatten(ls.next);
         //puts(`iteration ${i + 1}\n${ls.current}`);
      }
      ls.next = null;
      puts(`Expanded tree has ${ls.current.length} nodes`);
      lblNumNodes.textContent=ls.current.length;
      lblNumDrawn.textContent=0;

      return ls.current;
   }

   expand(rule) {return rule[2];}

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
   let r=[];
   for (let i=0;i<list.length;i++) {
      v=list[i];
      if (Array.isArray(v)) {
	 //puts('list[' + i + ']: ' + v + ' is an array');
	 for (let j=0, m; m=v[j]; j++) {r.push(m)}
      } else {
	 //puts('list[' + i + ']: ' + v + ' is NOT an array');
	 r.push(v);
      }
   }
   return r;
}

function strtolist(s) {
   return s.split('');
}

function listtostr(l) {
   return l.join('');
}

function lappend (larray, ...items) {
   larray.splice(larray.length,0, ...items);
}

function puts(o) {console.log(o);}


