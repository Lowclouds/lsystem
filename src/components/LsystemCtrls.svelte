<script>
  import {getContext, afterUpdate, onMount} from 'svelte';

  import {defaultTurtle, resetView, clearLsystem, homeTurtle, resetScene, showColorTable
         } from '/src/lib/scene.js';
  
  import {Settings} from '/src/lib/settings.js'
  import saveAs from 'file-saver';
  import SaveMesh from '/src/components/SaveMesh.svelte';
  import Modal from '/src/components/Modal.svelte';
  import SymbolMenu from '/src/components/SymbolMenu.svelte';

  let settings = Settings.getSettings();
  let lsys = getContext('lsystem');
  let lsSrc = getContext('lsSource');
  let lsExpansionStatus = getContext('lsExpansionStatus');
  let lsExpansion = getContext('lsExpansion');
  $lsExpansion = "Parse result goes here";

  let loadDemoOnStartup = getContext('loadDemoOnStartup');
  let autoBuildOnLoad = getContext('autoBuildOnLoad');
  let useMultiTurtles = getContext('useMultiTurtles');
  let isStartUp = true;
  let buildOnLoad = false;
  let autoExpansionMaxLines = 25;
  let numIterations=getContext('numIterations');
  let numNodes = getContext('numNodes');
  let numDrawn = getContext('numDrawn');
  let elNumDrawn;
  let drawSpeed = getContext('interpSpeed'); // 250;
  let speedtip = 'Min:1, Max:500, default: 250. Depends on your platform and if you want to see drawing as it happens';

  let doSaveCode = getContext('doSaveCode');

  let animationState = {stepStart: false};
  // button controls
  let saveDisabled = getContext('saveDisabled');           // default true
  let saveModelDisabled = getContext('saveModelDisabled'); // default true
  let parseDisabled=true;
  let isInvalid = true;
  let drawDisabled = true;
  let RPRDdisabled = true;

  let modsPerFrame = 250;
  
  // L-System source file
  let lsSrcEl;
  let ls_text = "";
  let fname = null;
  let cpos=0;

    // the default turtle
  let turtle = getContext('turtle');

  // svelte reactive actions

  // did we request to load a file?

  onMount (() => {
    if (!(window.location.protocol==='file:') && $loadDemoOnStartup) {
      fetch('./assets/examples/tabop/3d-b.ls')
        .then( response => {
          if (! response.ok) {
            throw new Error(`${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          $lsSrc = {fname: '3d-b.ls', text: text};
        })
    } else {
      //console.log(`protocol + setting: ${!(window.location.protocol==='file:') && $loadDemoOnStartup}`);
    }
  });

  $: buildOnLoad = $autoBuildOnLoad || (isStartUp && $loadDemoOnStartup)

  $: if ($lsSrc?.text != null ) {
    puts('hit $lsSrc update');
    fname = $lsSrc.fname;
    setLStextFromSrc($lsSrc.text);
    parseDisabled=false;
    $saveDisabled=false;
    if ($lsSrc.text ) {
      if (buildOnLoad) {
        uiRPRD();
      } else {
        uiDoParse();
      }
      startupDone();
    }
  }

  $: console.log("cpos: ", cpos);

  afterUpdate(() => {
    //puts(`hit ls_text update: ${ls_text}`);
    if(ls_text == "") {
      // puts(`if ls_text: ${ls_text}`);
      lsSrcEl.rows =  3;
      parseDisabled = true;
      $saveDisabled = true;
      isInvalid = true;
      animationState.stepStart = false;
      $lsExpansionStatus = 'empty L-System';
      $lsExpansion = '';
    } else {
      let tmatch = ls_text.match(/\n/g);
      let tlen = tmatch ? tmatch.length : 3
      //puts(`tlength: ${tlen}`);
      lsSrcEl.rows = Math.min(25,tlen+1);
      parseDisabled = false;
      $saveDisabled = false;
    }
  });
  // stupid input min/max doesn't work for typed in values !
  $: {
    $drawSpeed = $drawSpeed > 500 ? 500 : $drawSpeed < 1 ? 1 : $drawSpeed;
  }
      

  // ----------------
  function startupDone() {isStartUp=false;}

  function setLStextFromSrc(s) {ls_text=s.slice();}

  export function uiDoParse (evt) {
    evt?.target.blur();
    drawDisabled = true;
    $saveModelDisabled = true;
    return new Promise((resolve, reject) => {
      let spec = ls_text;
      $numIterations = 0;
      $numNodes = 0;
      $numDrawn = 0;
      elNumDrawn.style.backgroundColor = 'lightgray';
      try {
        $lsys = Lsystem.Parse(spec);
        $numIterations = $lsys.dDone;
        isInvalid = $lsys.axiom.length == 0;
        animationState.stepStart = false;
        if (! isInvalid) {
          $lsExpansionStatus = 'Parse Result';
          $lsExpansion = $lsys.serialize();
          animationState.stepStart = true;
          RPRDdisabled = false;
          resolve(true);
        } else {
          $lsExpansionStatus = 'Parse failed';
          $lsExpansion = 'No axiom found';
          isInvalid = true;
          animationState.stepStart = false;
          resolve(false);
          //reject('No axiom found');
        }
      } catch(error) {
        $lsExpansionStatus = 'Parse failed';
        $lsExpansion = `Error: ${error}\n\n` + $lsExpansion;
        isInvalid = true;
        //reject(error);
      }
    });
  }

  function uiDoRewrite(evt) {
    evt?.target.blur();

    return new Promise((resolve,reject) => {
      //if ($lsys && !isInvalid) {
      if ($lsys && !isInvalid) {
        try {
          drawDisabled = true;
          RPRDdisabled = true;
          animationState.stepStart = false;
          $lsExpansion = listtostr($lsys.Rewrite()); //.toString();
          $numIterations = $lsys.dDone;
          $numNodes = $lsys.current.length;
          $lsExpansionStatus = 'Rewrite Done';
          drawDisabled = false;
          RPRDdisabled = false;
          animationState.stepStart = true;
          resolve(true);
        } catch (error) {
          $lsExpansionStatus = 'Rewrite failed';
          $lsExpansion = `Error: ${error}\n\n` + $lsExpansion;
          drawDisabled = true;
          RPRDdisabled = false;
          reject(`Rewrite failed: ${error}`);
        }
      } else {
        resolve(true);
      }
      $numDrawn = 0;
      animationState.stepStart = true;
    });
  }

  function uiDoSingleStep(evt) {
    evt?.target.blur();

    return new Promise((resolve, reject) => {
      if ($lsys && !isInvalid) {
        if ($lsys.current.length == 0 && $lsys.dDone == 0) {
          $lsys.current = $lsys.axiom.slice();
          $lsExpansion = listtostr($lsys.current); // lsys.axiom startString
        } else {
          $lsExpansion = listtostr($lsys.Rewrite($lsys, 1, $lsys.current)); //.toString();         
        }
        $lsExpansionStatus = `Step: ${$lsys.dDone}${($lsys.dDone==0)?" => axiom":""}`;
        $numIterations = $lsys.dDone;
        $numNodes = $lsys.current.length;
        $numDrawn = 0;
        Turtle3d.clearTracksByTag('lsystem');
        defaultTurtle.reset(true);
        uiDoDraw()
          .then ((result) => resolve(true))
          .catch ((error) => {
            $lsExpansionStatus =  `Rewrite failed`;
            $lsExpansion =  `Error: ${error}\n\n` + $lsExpansion;
          });
      } else {
        if (!$lsys) {
          $lsExpansionStatus = 'Parse failed';
          $lsExpansion = 'Lsystem undefined: load or enter one and click parse';
        } else {
          $lsExpansionStatus = 'Parse failed';
          $lsExpansion = 'Lsystem axiom is empty: nothing to do';
        }
        reject('no Lsystem');
      }
    });
  }

  $: if ($doSaveCode) {
    $doSaveCode=false;
    uiSaveAsLSfile();
  }

  function uiSaveAsLSfile(evt) {
    evt?.target.blur();

    let file = (fname === null) ? 'lsystem.ls' : fname; 

    if (ls_text != '') {
      puts(`Saving to file: ${file}`);
      var blob = new Blob( [ls_text], {type: "text/plain;charset=utf-8"});
      saveAs.saveAs(blob, file);
    } else {
      puts(`failed saving: ${ls_text} to ${file}`);
    }
  }

  // genCode toggle
  let gcodestr = 'bi-square';
  let doGenCode = getContext('doGenCode');
  let codegen = getContext('codegen');

  function genCodeToggle(evt) {
    evt?.target.blur();

    if ($doGenCode) {
      gcodestr  = 'bi-square';
    } else {
      gcodestr = 'bi-check-square';
    }
    $doGenCode=!$doGenCode;
  }
  
  function updateTurtleInfo(t,idx) {

  }

  let interpOpts;
  $: {
    interpOpts = {gencode: $doGenCode, miCount: $drawSpeed, useMT: $useMultiTurtles};
  }

  function updateLsysInfo(linfo) {
    if (linfo.ndrawn) {
      $numDrawn = linfo.ndrawn;
    }
    if (linfo.bgcolor) {
      elNumDrawn.style.backgroundColor = linfo.bgcolor;
    }
    if ($doGenCode && linfo.code) {
      //lsCode.value = linfo.code;
      $codegen = linfo.code;
    } 
  }

  const interpIfcUpdate = {
    updateTurtleInfo: updateTurtleInfo, 
    updateLsysInfo: updateLsysInfo,
    updateView: resetView,
    wantStop: wantStop,
  };
  
  let showAbortPopup=false;
  function maybeShowAbort(ms=5000) {
    uiWantStop = false;
    return setTimeout(() => {showAbortPopup = true;}, ms);
  }
  let uiWantStop=false;
  function uiAbortDrawing() {
    uiWantStop = true;
  }
  function wantStop() {
    return uiWantStop;
  }
  function uiAbortAbort(timerId) {
    clearTimeout(timerId);
    showAbortPopup = false;
  }

  function uiDoDraw (evt) {
    evt?.target.blur();

    $saveDisabled = true;
    $saveModelDisabled = true;
    drawDisabled = true;
    RPRDdisabled = true;
    isInvalid = true; // disable rewrite
    animationState.stepStart = false;
    let timerId = maybeShowAbort();
    return new Promise((resolve,reject) => {
      interpOpts.miCount = $drawSpeed;
      turtleInterp($turtle, $lsys, interpOpts, interpIfcUpdate) 
        .then(value => {
          uiAbortAbort(timerId);
          if (Turtle3d.getTracksByTag('lsystem').length == 0) {
            $saveModelDisabled = true;
          } else {
            $saveModelDisabled = false;
          }
          drawDisabled = false;
          RPRDdisabled = false;
          isInvalid = false; 
          animationState.stepStart = true;
          $turtle.show();
          resolve(true);
        })
        .catch(error => {
          uiAbortAbort(timerId);
          puts('uiDoDraw: ' + error);
          $lsExpansionStatus = `Rewrite failed: ${error}`;
          // $lsExpansion = `Error:\n\n + $lsExpansion`;
          $saveDisabled = false;
          $saveModelDisabled = true;
          drawDisabled = true;
          RPRDdisabled = false;
          isInvalid = true;
          animationState.stepStart = false;
          $turtle.show();
          //reject(error);
        })
    });
    return ipromise;
  }
  // Parse, Reset, ReDraw
  function uiRPRD (evt)  {
    evt?.target.blur();
    /* --------- reparse ---------*/
    uiDoParse()
      .then(value => {
        /* --------- rewrite ---------*/
        if (value) {
          uiDoRewrite()
            .catch((error) => {
              $lsExpansionStatus = 'Rewrite failed';
              $lsExpansion = `Error: ${error}\n\n` + $lsExpansion;
              isInvalid = true;
            });
        } else {
          throw new Error('Source is invalid');
        }
      })
      .then (value => {
        /* --------- reset ---------*/
        resetScene();
        /* --------- draw ---------*/
        uiDoDraw()
          .catch((error) => {
            puts('Muffling uiDoDraw error in btnRPRD');
          });
      })
      .catch (error => {
        $lsExpansionStatus = 'Reset|Parse|Rewrite|Draw failed';
        $lsExpansion = `Error: ${error}\n\n` + $lsExpansion;
        isInvalid = true;
        puts('btnRPRD: ' + error);
      })
  }


  let ourposition = 'relative';

  // tooltips
  let tip_btn_build = 'Reset, parse, rewrite, draw';
  let tip_btn_step = `After Build or Step, reset, rewrite one additional step, and draw.
   After Parse, just interpret axiom. Must Parse after changes to L-system`;
  let tip_btn_parse = "Parse L-system, showing parse in expansion area";
  let tip_btn_rewrite = "Rewrite L-system derivation length times from start. Result is in expansion area";
  let tip_btn_draw = "Draw/interpret result of last rewrite. Does not reset turtle or scene";
  let tip_btn_gencode = "Turn on/off code generation";
  
  let tip_btn_lssave = "Save L-system text to file";
  // let tip_btn_msave = "Save generated model to 3D object file";

  let tip_el_numIterations = "Completed derivation length of L-System";
  let tip_el_numNodes = "Number of Modules in L-System expansion";
  let tip_el_numDrawn = "Number of Modules 'drawn' or interpreted";
  let tip_el_drawspeed = `Number of Modules interpreted per Frame. ${speedtip}`;

</script>

<div class="btn-group bgroup my-0 py-0">
   <div class="gbutton nbutton my-0 py-0" >L-System <i class="bi-tools"></i></div>
   <button class="gbutton tbutton" id="btn-build" disabled={parseDisabled}
          data-bs-toggle="tooltip" data-bs-title={tip_btn_build}
          on:click={uiRPRD}><i class="bi-gear-wide-connected"></i></button>

  <button class="gbutton tbutton" id="btn-step" disabled={!animationState.stepStart} 
          data-bs-toggle="tooltip" data-bs-title={tip_btn_step}
          on:click={uiDoSingleStep}><i class="bi-1-square"></i></button>

  <button class="gbutton tbutton" id="btn-parse" disabled={parseDisabled} 
          data-bs-toggle="tooltip" data-bs-title={tip_btn_parse}
          on:click={uiDoParse}><i class="bi-code"></i></button>
  
  <button class="gbutton tbutton" id="btn-rewrite" disabled={isInvalid}
          data-bs-toggle="tooltip" data-bs-title={tip_btn_rewrite}
          on:click={uiDoRewrite}><i class="bi-pencil-square"></i></button>
  
  <button class="gbutton tbutton" id="btn-draw" disabled={drawDisabled}
           data-bs-toggle="tooltip" data-bs-title={tip_btn_draw}
          on:click={uiDoDraw}><i class="bi-paint-bucket"></i></button>

  <SymbolMenu insertTarget={lsSrcEl}/>

  <div class="btn-group" style="display: flex; justify-content: flex-end; margin-left: auto; background-color: wheat; padding: 0">
      <button class="gbutton tbutton" id="btn-gencode" 
              data-bs-toggle="tooltip" data-bs-title={tip_btn_gencode}
              on:click={genCodeToggle} >
        <i class="bi-code"></i> <i class="{gcodestr}"></i></button>
      <SaveMesh label="Model " smdisabled={$saveModelDisabled} smfile={fname}></SaveMesh>
    </div>
</div>

<slot name="turtlectrls"/>
<slot name="scenectrls"/>

<!-- <slot/> -->
<Modal bind:showNonModal={showAbortPopup} bind:position={ourposition}>
  <button on:click={uiAbortDrawing}>Click to stop interpretation</button>
</Modal>

<textarea type="text" id="lsSrc" bind:this={lsSrcEl} bind:value={ls_text} placeholder="Load LS file or start typing"></textarea>

<div class="btn-group bgroup-plus my-0 py-0">
  <div class="gbutton nbutton my-0 py-0" >LS status</div>
  <div class="box" id="el-numIterations" data-bs-toggle="tooltip" data-bs-title={tip_el_numIterations}>{$numIterations}</div>
  <div class="box" id="el-numNodes" data-bs-toggle="tooltip" data-bs-title={tip_el_numNodes}>{$numNodes}</div>
  <div class="box" id="el-numDrawn" bind:this={elNumDrawn} data-bs-toggle="tooltip" data-bs-title={tip_el_numDrawn}>{$numDrawn}</div>
  <div style="display: flex">
    <label class="lbla" for="drawSpeedSlider" data-bs-toggle="tooltip" data-bs-title={tip_el_drawspeed}>Speed: </label>
    <!-- <div class="box" style="background-color: aquamarine" id="el-drawspeed" >{$drawSpeed}</div> -->
    <input border type="number" id="drawSpeedSlider" min={1} max={500} bind:value={$drawSpeed} style="background-color: aquamarine"/>

    <!-- <Tooltip target="drawSpeedSlider" class="text-start">Number of Modules interpreted per Frame.<br/> -->
    <!--   {speedtip} -->
    <!-- </Tooltip> -->
    
  </div>
</div>

<slot name="interpresults"/>

<!--  -->
<style>
  #lsSrc {
    width: 100%;
    font-family: monospace;
    font-size: 12px;
    margin-top: 0.5em;
  }
  /* .right-aligned-flex { */
  /*   display: flex; */
  /*   flex-direction: row-reverse;  */
  /*   width: 100%; */
  /* } */
  .box {
    border: 1px black solid;
    text-align: end;
    align-content: center;
    min-width: 3em;
    margin: 0;
    padding-right: 0.5em;
    background-color: white;
  }
  .lbla {
    white-space: nowrap;
    min-width: 5 em;
    padding-left: 0.5em;
    padding-right: 0.25em;
    align-content: left;
  }
  /* .lsstatusbar { */
  /*   background-color: wheat; */
  /*   font-size: 12px; */
  /*   border: 1px solid black; */
  /* } */

  /* .bgroup { */
  /*   display: flex; */
  /*   height: 2em; */
  /*   width: 100%; */
  /*   font-size: 12px; */
  /*   /\* border: 1px solid black; *\/ */
  /* } */
  /* .gbutton { */
  /*   border: 1px solid black; */
  /*   margin: 0; */
  /*   padding: 2px; */
  /* } */
  /* .tbutton { */
  /*   background-color: aquamarine; */
  /*   padding-top: 0.1em; */
  /*   border-radius: 3px; */
  /* } */
  /* .sbutton { */
  /*   disabled: true; */
  /*   background-color: gray; */
  /* } */
  /* .nbutton { */
  /*   background-color: wheat; */
  /* } */

</style>
