<script>
  import {getContext} from 'svelte';
  import * as SCtrl from '/src/lib/scene.js';

  // clearLsystem, homeTurtle, defaultTurtle , resetScene, resetView, lookAtTurtle, 
  //            lookAtOrigin, showColorTable } 
  
  // let theScene = getContext('scene');
  // let theTurtle = getContext('turtle');
  let useInstances = getContext('useInstances');  

  $: SCtrl.useInstances($useInstances);

  let doShowTurtleInfo = getContext('doShowTurtleInfo');  
  let isShown = true;
  //let ttoggle = 'Hide';
  let ttoggle = 'bi-eye';

  function showHide (evt) {
    evt?.target.blur();

    if (SCtrl.defaultTurtle.isShown() != isShown) {
      // we're disconnected somehow, assume user sees turtle
      isShown = SCtrl.defaultTurtle.isShown();
    }
    if (isShown) {
      SCtrl.defaultTurtle.hide();
      ttoggle = 'bi-eye-slash';
    } else {
      SCtrl.defaultTurtle.show();
      ttoggle = 'bi-eye';
    }
    isShown = !isShown;
  }

  let colorTableOnOff = 'bi-square';
  let colorTableNeverShown = true;
  let ctPromise;
  let waitMsg;

  async function hsColorTable() {
    // there is some heuristically necessary amount of time needed to ensure
    // the dialog renders before building the colortable
    await new Promise((resolve) => setTimeout(() => resolve(true), 20));

    let toggle = SCtrl.showColorTable();
    if (toggle) {
      colorTableOnOff = 'bi-check-square';
    } else {
      colorTableOnOff = 'bi-square';  
    }
    colorTableNeverShown = false;
    waitMsg.close();
    return toggle;
  }

  function toggleColorTable(evt) {
    evt?.target.blur();
    if (colorTableNeverShown) {
      waitMsg.show();
    }
    ctPromise = hsColorTable();
  }

  let TurtleInfo = {OnOff: 'bi-square'};
  function showTurtleInfo(evt) {
    evt?.target.blur();
    if ($doShowTurtleInfo === false) {
      $doShowTurtleInfo = true;
      TurtleInfo.OnOff = 'bi-check-square';
    } else {
      TurtleInfo.OnOff = 'bi-square';
      $doShowTurtleInfo = false;
    }
    //console.log(TurtleInfoOnOff, $doShowTurtleInfo);
  }

  // tooltips
  let tip_btn_tshow = 'Show or hide the turtle'
  let tip_btn_thome = "Set turtle to home position";
  let tip_btn_sethomepos = "Move turtle home position";
  let tip_btn_treset = "Home the turtle, set the default viewpoint, and clear all geometry";
  let tip_btn_tclear = "Clear all generated geometry. Leaves turtle unchanged."
  let tip_btn_tcolor_table = "Show or hide the colortable";
  let tip_btn_tsave = "Save current geometry as a 3D model";

  let tip_btn_turtle_info = 'Show or hide position, heading, orientation, and home position of turtle';

</script>

<dialog bind:this={waitMsg}> 
   <div> Hold on for a bit!<br/>
     <b>Only</b> the first time building the color table takes a while.</div>
</dialog>

<div class="btn-group bgroup-plus my-0 py-0" style="background-color: wheat; width: 100%">
   <div class="gbutton nbutton my-0 py-0" >Turtle <i class="bi-tools"></i></div>
   <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_tshow}
           on:click={showHide}><i class="{ttoggle} gb"></i></button>
   <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_thome}
           on:click={SCtrl.homeTurtle}><i class="bi-house gb"></i></button>
   <!-- <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_sethomepos} -->
   <!--         id="btn-sethomepos"  on:click={SCtrl.homeTurtle}>Set Home</button> -->
   <!-- <button class="gbutton sbutton" ></button> -->
   <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_treset}
           id="btn-treset" on:click={SCtrl.resetScene}><i class="bi-house-add gb"></i></button>
   <!-- <button class="gbutton sbutton" ></button> -->
   <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_tclear}
           id="btn-tclear" on:click={SCtrl.clearLsystem}><i class="bi-house-slash gb"></i></button>
   <!-- <button class="gbutton sbutton" ></button> -->
   <div style="display: flex; justify-content: flex-end; margin-left: auto; background-color: wheat; padding: 0">
     <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_tcolor_table}
             id="btn-tcolor-table" on:click={toggleColorTable}><i class="bi-palette gb"></i> <i class="{colorTableOnOff}"></i></button>
     <button class="gbutton tbutton" data-bs-toggle="tooltip" data-bs-title={tip_btn_turtle_info}
             on:click={showTurtleInfo}><i class="bi-table gb"></i> <i class="{TurtleInfo['OnOff']}"></i></button>

     </div>
</div>


<style >
  dialog {
    z-index: 100;
  }
  .wb {
    background: aquamarine;
  }
</style>
