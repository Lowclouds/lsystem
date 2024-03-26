<script>
  import {getContext, onMount} from 'svelte';
  import {createReactiveContext} from '/src/lib/reactiveContext.js';

  // let turtle = getContext('turtle');
  let turtle ;
  let tid, tPos, tH, tL, tU;

  let scene = getContext('scene');
  $: if ($scene) {
    turtle = Turtle3d.getFirstTurtle();
  }

  let isShown; // = 'none';
  let doShowTurtleInfo = getContext('doShowTurtleInfo');
  
  $: if ( $doShowTurtleInfo ) { // || (tPos.x || tPos.y || tPos.z))
    isShown = 'contents';
    updturtle();
  } else {
    isShown = 'none';
  }

  function updturtle(evt) {
    tid = turtle.getTurtle();
    tPos = vround(turtle.getPos(), 3);
    tH = vround(turtle.getH(), 3);
    tL = vround(turtle.getL(), 3);
    tU = vround(turtle.getU(), 3);
  }
</script>

<div id="turtleinfo" style="display: {isShown}">
  <table class="tbl" id="turtleinfo">
    <tr><td><button on:click={updturtle}>Update</button></td><td id="t1">{tid} </td></tr>
    <tr><td >Pos</td><td id="t1P">{tPos}</td></tr>
    <tr><td class="tH">H(eading)</td><td id="t1H" class="tH">{tH}</td></tr>
    <tr><td class="tL">L(left)</td><td id="t1L" class="tL">{tL}</td></tr>
    <tr><td class="tU">U(p)</td><td id="t1U" class="tU">{tU}</td></tr>
  </table>
</div>

<style>
  button {
    background-color: aquamarine;
    border-radius: 4px;
  }
  td {
    padding: 0 1em 0 .5em;
  }
  .tH { color: red; }
  .tL { color: blue; }
  .tU { color: #00FF00; }
</style>
