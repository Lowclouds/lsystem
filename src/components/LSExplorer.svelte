<script>
  import {getContext, onMount} from 'svelte';
  import {createReactiveContext} from '/src/lib/reactiveContext.js'

  import Topbar from '/src/components/Topbar.svelte'
  import LsystemCtrls from '/src/components/LsystemCtrls.svelte'
  import TurtleCtrls from '/src/components/TurtleCtrls.svelte'
  import SceneCtrls from '/src/components/SceneCtrls.svelte'
  import InterpResults from '/src/components/InterpResults.svelte'

//  export let width;

  // Lsystem Ctrls
  createReactiveContext('lsystem', undefined);

  createReactiveContext('saveDisabled', true);
  createReactiveContext('doGenCode',false);
  createReactiveContext('codegen', 'Code is generated when interpreting the model');

  createReactiveContext('numIterations',0);
  createReactiveContext('numNodes', 0);
  createReactiveContext('numDrawn', 0);

  createReactiveContext('lsExpansionStatus','empty L-System');
  createReactiveContext('lsExpansion','');

  //Turtle Ctrls
  createReactiveContext('ShowHideTurtle', false);
  createReactiveContext('ShowTurtleStatus', false);
  createReactiveContext('ShowColorTable', false);

  let lsource = getContext('lsSource');

</script>

<div id="lsexplorer" >  <!-- style="width: {width}" -->
  <!-- <Topbar/> -->
  <LsystemCtrls>
    <TurtleCtrls slot="turtlectrls"/>
    <SceneCtrls slot="scenectrls"/>
    <InterpResults slot="interpresults"/>
  </LsystemCtrls>
</div>

<style>
  #lsexplorer {
    margin: 0;
    height: 100%;
    z-index: 2;
  }
</style>
