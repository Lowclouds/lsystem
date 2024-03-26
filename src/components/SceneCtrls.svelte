<script>
  import {getContext} from 'svelte';
  import * as SCtrl from '/src/lib/scene.js';

  let theScene = getContext('scene');
  let theTurtle = getContext('turtle');

  let axesShown = true;
  let groundShown = true;
  let skyShown = true;
  let isGridShown = {xy: false, xz: false, yz: false};

  function lookTurtle(evt) {
    evt?.target.blur();
    SCtrl.lookAtTurtle();
  }
  function lookHome(evt) {
    evt?.target.blur();
    SCtrl.lookAtOrigin();
  }
  function lookMesh(evt) {
    evt?.target.blur();
    SCtrl.resetView('lsystem', {targetMesh: true});
  }

  function showHideAxes(evt) {
    evt?.target.blur();
    axesShown = !axesShown;
    SCtrl.showHideAxes(axesShown);
  }

  function showHideGround(evt) {
    evt?.target.blur();
    SCtrl.ground.isVisible = !SCtrl.ground.isVisible;
  }
  
  function showHideGrid(evt) {
    evt?.target.blur();
    if (evt?.target?.id) {
      let plane = evt.target.id.toLowerCase();
      isGridShown[plane] = !isGridShown[plane];
      SCtrl.showHideGrid(plane, isGridShown[plane]);
    }
  }

  function showHideSky(evt) {
    evt?.target.blur();
    skyShown = !skyShown;
    SCtrl.sky.isVisible = skyShown;
  }

  let tip_btn_tlook_at = "Look at the turtle or home from current camera position";
  let tip_btn_scene_visibility = 'Toggle visibility of axes, ground, grids, or sky';
  let tip_btn_saxes = "Show or hide axes";
  let tip_btn_sground = "Show or hide ground";
  let tip_btn_ssky = "Show or hide sky";

</script>


<div class="btn-group bgroup-plus my-0 py-0"  >
  <div class="gbutton nbutton my-0 py-0" >Scene <i class="bi-tools"></i></div>
  <div class="row row-cols-auto gx-0">
    <div class="col">
      <div class="dropdown" data-bs-toggle="tooltip" data-bs-title={tip_btn_tlook_at}>
        <button id="btn-tlook-at" class="tbutton align-center" data-bs-toggle="dropdown">
          <i class="bi-binoculars"></i>
        </button>
        <ul class="dropdown-menu" aria-labelledby="btn-tlook-at">
          <li><button class="dropdown-item py-0" on:click={lookTurtle}> Turtle </button></li>
          <li><button class="dropdown-item py-0" on:click={lookHome}> Origin </button></li>
          <li><button class="dropdown-item py-0" on:click={lookMesh}>Mesh Center </button></li>
          
        </ul>
      </div>
    </div>
    <div class="col">
      <div class="dropdown" data-bs-toggle="tooltip" data-bs-title={tip_btn_scene_visibility}>
        <button id="btn-show-scene" class="tbutton" data-bs-toggle="dropdown"><i class="bi-card-image"></i></button>
        <ul class="dropdown-menu" aria-labelledby="btn-show-scene">
          <button class="dropdown-item" id="btn-saxes" on:click={showHideAxes}>Axes</button>
          <button class="dropdown-item" id="btn-sground" on:click={showHideGround}>Ground</button>
          <button class="dropdown-item" id="btn-ssky" on:click={showHideSky}>Sky</button>
          <li><button class="dropdown-item py-0" on:click={showHideGrid} id='xz'> XZ Grid </button></li>
          <li><button class="dropdown-item py-0" on:click={showHideGrid} id='xy'> XY Grid </button></li>
          <li><button class="dropdown-item py-0" on:click={showHideGrid} id='yz'> YZ Grid </button></li>
        </ul>
      </div>
    </div>
  </div>
</div>



<style>
</style>
