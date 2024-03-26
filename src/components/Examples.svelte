<script>
  import {getContext} from 'svelte'
  import {eg as examples} from '../lib/examples.js'
  
  let doShowExamples = getContext('showExamples');
  function hide (evt) {
    $doShowExamples = !$doShowExamples;
  }

  let lsSrc = getContext('lsSource');
  console.log('Examples: ', lsSrc);

  function loadfile(evt) {
    let i,j;
    [i, j] = event.target.id.split(' ')[1].split('.');

    $lsSrc.fname = examples[i].files[j].lsfile,
    $lsSrc.text = examples[i].files[j].src;

    console.log('event target is: ', Number(i),',', Number(j));
    //console.log('file text is: ', text);
  }
</script>

  <div class="d-flex flex-column" style="background-color: wheat;">
    <h5> L-System Examples </h5>
    <button class="gbutton tbutton " on:click={hide}> Hide </button>
    <hr/>
    <div class="d-flex flex-column scrollable" style="background-color: wheat; line-height: 1.1" >
      {#each examples as category, i}
        <div class="dropdown">
          <button type="button" class="gbutton tbutton dropdown-toggle"
                  data-bs-toggle="dropdown" aria-expanded="false">{category.dir}</button>
          <div class="dropdown-menu" >
            {#each category.files as finfo, j}
              <button id={`finfo ${i}.${j}`}  class="dropdown-item" on:click={loadfile}> {finfo.lsfile} </button>
            {/each}
          </div>
        </div>
      {/each}
      <div class="tall"> . </div>
      <div class="tall"> .  </div>
      <!-- <div class="tall"> . </div> -->
    </div>
  </div>


<style>
  .scrollable {
    overflow-y: scroll;
  }
  .tall {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-top: 100%;
  }
</style>
