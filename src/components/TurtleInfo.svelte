<script>
  import {getContext, onMount} from 'svelte';
  import {createReactiveContext} from '/src/lib/reactiveContext.js';
  import {camera} from '/src/lib/scene.js';

  // let turtle = getContext('turtle');
  let turtle ;
  let cam ;
  let tid, tPos, tH, tL, tU;
  let camPos=[], camTarget=[], posDir=[];

  let scene = getContext('scene');
  $: if ($scene) {
    turtle = Turtle3d.getFirstTurtle();
    cam = camera;
  }

  let isShown; // = 'none';
  let doShowTurtleInfo = getContext('doShowTurtleInfo');
  let doUpdateTurtleInfo = getContext('doUpdateTurtleInfo');

  $: if ( $doShowTurtleInfo ) { // || (tPos.x || tPos.y || tPos.z))
    updturtle();
    isShown = 'flex';
  } else {
    isShown = 'none';
  }

  $: if ($doShowTurtleInfo && $doUpdateTurtleInfo) {
     updturtle();
     $doUpdateTurtleInfo = false;
  } else {
     $doUpdateTurtleInfo = false;
  }

  function  updturtle(evt) {
    tid = turtle.getTurtle();
    tPos = vround(turtle.getPos(), 3);
    tH = vround(turtle.getH(), 3);
    tL = vround(turtle.getL(), 3);
    tU = vround(turtle.getU(), 3);

    camPos=[];
    camTarget=[];
    posDir=[];
    vround(camera.position.clone(), 3).toArray(camPos);
    vround(camera.target.clone(), 3).toArray(camTarget);
    vround(camera.position.subtract(camera.target).normalize(), 3).toArray(posDir);

  }
</script>

<div id="tinfo" style="display: {isShown}">
    <table class="tbl" id="turtleinfo">
      <tr><td><button on:click={updturtle}>Update</button></td><td id="t1">Turtle: {tid} </td></tr>
      <tr><td >Pos</td><td id="t1P">{tPos}</td></tr>
      <tr><td class="tH">H(eading)</td><td id="t1H" class="tH">{tH}</td></tr>
      <tr><td class="tL">L(left)</td><td id="t1L" class="tL">{tL}</td></tr>
      <tr><td class="tU">U(p)</td><td id="t1U" class="tU">{tU}</td></tr>
    </table>

    <table class="tbl" id="camerainfo">
      <tr><td></td><td id="c1">Camera </td></tr>
      <tr><td >Position</td><td id="c1P">{camPos}</td></tr>
      <tr><td >Target</td><td id="c1T">{camTarget}</td></tr>
      <tr><td >Direction</td><td id="c1D">{posDir}</td></tr>
    </table>
</div>

<style>
  button {
    background-color: aquamarine;
    border-radius: 4px;
    font-size: smaller;
  }
  table {
    font-size: smaller;
    border: 2px solid black;
  }
  td {
    padding: 0 1em 0 .25em;
    font-size: smaller;
  }
  #tinfo {
    position: fixed;
    bottom: 1em;
    z-index: 5;
    opacity: 0.55;
    background-color: white;
    justify-content: space-between;
  }
  .tH { color: red; }
  .tL { color: blue; }
  .tU { color: #00FF88; }
</style>
