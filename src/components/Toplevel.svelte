<script context="module">
  let settings = Settings.initialize();
</script>
<script>
  import {createReactiveContext} from '/src/lib/reactiveContext.js';
  import {getContext} from 'svelte';
  import {Pane, Splitpanes} from 'svelte-splitpanes';
  import LSExplorer from '/src/components/LSExplorer.svelte';
  import {engine, createScene, defaultTurtle} from '/src/lib/scene.js';
  import Examples from '/src/components/Examples.svelte';
  import TurtleInfo from '/src/components/TurtleInfo.svelte';
  import Topbar from '/src/components/Topbar.svelte'
  import {Settings} from '/src/lib/settings.js'

  createReactiveContext('engine', undefined);
  createReactiveContext('scene', undefined);

  createReactiveContext('showExamples', false);
  createReactiveContext('doSaveCode', false);
  createReactiveContext('lsSource', {fname: null, text: null});
  createReactiveContext('saveModelDisabled', true);

  createReactiveContext('loadDemoOnStartup', false);
  createReactiveContext('autoBuildOnLoad', false);
  createReactiveContext('useMultiTurtles', false);
  createReactiveContext('useInstances', false);
  createReactiveContext('interpSpeed', false);


  //Scene Ctrls
  // createReactiveContext('', false);
  // createReactiveContext('', false);
  // createReactiveContext('', false);

  let canvas = undefined;
  
  let lsource = getContext('lsSource');
  

  let scene = getContext('scene');
  let turtle = getContext('turtle');
  let showExamples = getContext('showExamples');

  let tinfo; // turtle info
  
  $: if (canvas && ! engine) {

    $scene = createScene(canvas);
    $turtle = defaultTurtle;
    initCanvas();
  }

  // initially, just reset the height for the engine
  function initCanvas() {
    // console.log(`before: canvas.w: ${canvas.clientWidth}, canvas.h: ${canvas.clientHeight}`);
    //canvas.clientWidth - 2;
    canvas.height = window.innerHeight  - 55;
    engine.resize();
    // console.log(`after: canvas.w: ${canvas.clientWidth}, canvas.h: ${canvas.clientHeight}`);
   
  }
  // used by the Splitpanes object to resize the canvas and the engine
  function resize(e) {
    //console.log('resized: ' + JSON.stringify(e.detail));
    // assumption is that there are now sidebars, etc.
    let wpct = e.detail[0].size/100;
    let ww = window.innerWidth * wpct - 10;
    let wh = window.innerHeight - 55;
    canvas.height = wh
    canvas.width = ww

    engine.resize();
  }
  let initialPaneSize=35; // percent

</script>

<svelte:window on:resize={initCanvas} />

<Topbar/>
<Splitpanes on:resized={resize} >
  <Pane size={initialPaneSize} >
    <canvas id="renderCanvas" touch-action="none" bind:this={canvas}> </canvas>
    <!-- <canvas id="renderCanvas" touch-action="pan-x pan-y pinch-zoom" bind:this={canvas}> </canvas> -->
    <TurtleInfo/>
  </Pane>
  <Pane>
    <LSExplorer/>
  </Pane>
  {#if $showExamples}
    <Pane size=10 maxSize=20>
      <Examples/>
    </Pane>
  {/if}
</Splitpanes>

<style>
  #renderCanvas {
    width: 100%;
    touch-action: none;
  }

</style>
