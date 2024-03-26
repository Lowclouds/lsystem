<script>
  import {getContext, onMount} from 'svelte';
  import {createReactiveContext} from '/src/lib/reactiveContext.js'

  let lsExpansionStatus = getContext('lsExpansionStatus');

  let lsExpansionRows = 2;
  let lsExpansion = getContext('lsExpansion');
  let doGenCode = getContext('doGenCode');
  let codegen = getContext('codegen');

  $: {
      let m = $lsExpansion.match(/\n/g);
      let len = m ? m.length : 2;
      lsExpansionRows = Math.max(2, Math.min(30,len));
  }

  // onMount(() => {
  //   $lsExpansion = '---Result (empty) of parse---';
  // });

</script>


<div class="bgroup nbutton" style="position: relative; z-index: 1" id="lsexpstatus"> L-System Expansion --- {$lsExpansionStatus} ---</div>
<textarea name="lsexpansion" rows={lsExpansionRows} readonly="true" bind:value={$lsExpansion}/>

{#if $doGenCode}
  <div class="bgroup">Generated code for model<br/></div>
  <textarea name="lscode" bind:value={$codegen} readonly="true"/>
{/if}

<style>
  textarea {
    font-family: monospace;
    font-size: 12px;
    width: 100%;
    position: relative;
    z-index: 1;
  }
</style>
