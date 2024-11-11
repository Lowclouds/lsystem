<script>
  import {getContext, onMount} from 'svelte';
  import {Settings} from '/src/lib/settings.js'
  // import {initKbd} from '/src/lib/kbdhandler.js';
  import SaveMesh from '/src/components/SaveMesh.svelte';
                  

  let settings=Settings.getSettings();
                  
  let loadDemo = getContext('loadDemoOnStartup');
  let autoBuildOnLoad = getContext('autoBuildOnLoad');
  let useMultiTurtles = getContext('useMultiTurtles');
  let useInstances = getContext('useInstances');
  let gDrawSpeed = getContext('interpSpeed');
                  
  let lsSrc = getContext('lsSource');
  let lsFiles=undefined;
  let displayFname = "";

  let doSaveCode = getContext('doSaveCode');
  let genCode = getContext('genCode');
  let saveDisabled = getContext('saveDisabled');
  let saveModelDisabled = getContext('saveModelDisabled'); // default true

  let genCodeIcon = 'square';

  let doShowExamples = getContext('showExamples');

  // onMount(() => {
  //   initKbd();
  // });

  function updateReactiveSettings(key){
    $loadDemo = settings.loadDemoOnStartup;
    $autoBuildOnLoad = settings.autoBuildOnLoad;
    $useMultiTurtles = settings.useMultiTurtles;
    $useInstances = settings.useInstances;
    $gDrawSpeed = settings.interpSpeed;
  }

  updateReactiveSettings();
                  
  function showhideExamples(evt) {
    $doShowExamples = !$doShowExamples
  }
  // $: console.log('doShowExamples: ', $doShowExamples);

  function newFile(evt) {
    $lsSrc.fname="lsystem.ls";
    $lsSrc.text="";
  }
  
  let fname = '';
  $: if (lsFiles) {
    for (const file of lsFiles) {
      $lsSrc.fname = file.name;
      let reader = new FileReader();
      reader.onload = function() {
        // this will be processed in LsystemCtrls
        $lsSrc.text = reader.result;
      }
      reader.readAsText(file);
      // just read first file
      break;
    }
  }
                  
  $: displayFname = `: ${$lsSrc.fname == null ? '-no LS file-' : $lsSrc.fname}`
                  
  // stolen from Easy-file-picker
  async function getFile() {
    const fileInput = document.createElement("input");
    fileInput.hidden = true;
    fileInput.type = "file";
    fileInput.multiple = false;
    fileInput.accept = ".ls,.txt,text/plain";

    const files = new Promise((resolve) => {
      fileInput.onchange = (event) => {
        lsFiles = (event.target)?.files;;
        resolve();
      };
      fileInput.click();
    });

    return files.finally(() => fileInput.remove());
  }

  function genCodeToggle(event){
    if ($genCode ) {
      genCodeIcon = 'square';
    } else {
      genCodeIcon = 'check-square';
    }
    $genCode = !$genCode;
  }

  let isChecked = {
    loadDemoOnStartup: settings['loadDemoOnStartup'] ? 'bi-check-square' : 'bi-square',
    autoBuildOnLoad: settings['autoBuildOnLoad'] ? 'bi-check-square' : 'bi-square',
    useMultiTurtles: settings['useMultiTurtles'] ? 'bi-check-square' : 'bi-square',
    useInstances: settings['useInstances'] ? 'bi-check-square' : 'bi-square',
  };
  // puts(`type of settings['useMultiTurtles'] is ${typeof settings['useMultiTurtles']}`);
  // puts(JSON.stringify(isChecked));
                  
  function toggleSetting(evt) {
    let key = null;
    let val = null;
    switch (evt.target.id) {
    case 'toggleDemo':
      key = 'loadDemoOnStartup'
      break;
    case 'toggleAutoBuild':
      key = 'autoBuildOnLoad';
      break;
    case 'toggleMultiTurtles':
      key = 'useMultiTurtles';
      break;
    case 'toggleUseInstances':
      key = 'useInstances';
      break;
    default:
      alert("Seems like you clicked on the checkbox, which doesn't work!")
      return;
    }
    if (key) {
      val = settings[key];
      if ('boolean' === typeof val) {
        settings[key] = !val;
        isChecked[key] = !val ? 'bi-check-square' : 'bi-square';
      }
      console.log(`set ${key} to ${settings[key]} which is ${typeof settings[key]}`);
    } else {
      console.log('toggleSetting key is null: evt: '+ JSON.stringify(evt));
    }
    updateReactiveSettings()
  }

  function saveSettings(evt) {
    settings.interpSpeed = $gDrawSpeed;
    Settings.save(settings);
  }
  function restoreSettings(evt) {
    settings=Settings.getSettings() 
    updateReactiveSettings()
  }
  function resetSettings(evt) {
    settings = Settings.reset()
    updateReactiveSettings()
  }

  let settingsKeys = Settings.getSettingsKeys();
  
  function triggerSave(evt) {
    $doSaveCode = true;
  }

  function doSaveModel(evt) {
    let el = document.getElementById('saveModelModal');
    if (el) {
      puts('triggering '+ el.id);
      el.showModal();
    }
  }

  let tip_btn_qref = 'Cheat sheet of built-in module definitions and L-System file syntax.'
  let tip_btn_aborg = 'Canonical L-system site with many resources'
</script>

<nav id='topnavbar' class="navbar navbar-expand-sm bg-body-tertiary" style="background-color: light-gray">
  <div class="container-fluid">
    <span class="navbar-brand  fname">L-System {displayFname}</span>
    <!-- <a  href="#top" class="navbar-brand">{$lsSrc.fname == null ? 'L-System' : $lsSrc.fname}</a> -->
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse flex-row-reverse" id="navbarSupportedContent">
      <div class="navbar-nav ">
        <div class="nav-item dropdown-center" >
          <button class="nav-link dropdown-toggle"  data-bs-toggle="dropdown" aria-expanded="false">
            File
          </button>
          <ul class="dropdown-menu " >
            <li><button class="dropdown-item" on:click={newFile}>New LS file</button></li>
            <li><button class="dropdown-item" on:click={getFile}>Open LS file</button></li>
            <li><button class="dropdown-item" on:click={triggerSave} disabled={$saveDisabled} >Save LS file</button></li>
            <hr/>
            <li><button class="dropdown-item" on:click={doSaveModel} disabled={$saveModelDisabled}>
                Save Model Mesh(es)
            </button></li>

          </ul>
        </div>
        <button class="nav-item btn" on:click={showhideExamples}>
          Examples
        </button>
        <div class="nav-item dropstart">
          <button class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"> Settings </button>
          <ul class="dropdown-menu" style="min-width: 14em">
              <li><button class="dropdown-item" on:click={saveSettings} > Save </button></li>
              <li><button class="dropdown-item" on:click={restoreSettings} > Restore </button></li>
              <li><button class="dropdown-item" on:click={resetSettings} > Reset </button></li>
              <hr/>
              <li><button class="dropdown-item tbutton" on:click={toggleSetting} id="toggleDemo"> 
                   Load Demo on Startup <i class="{isChecked['loadDemoOnStartup']} wb"></i></button></li>
              <li><button class="dropdown-item tbutton" on:click={toggleSetting} id='toggleAutoBuild'> 
                  Auto Build on Load <i class="{isChecked['autoBuildOnLoad']} wb"></i></button></li>

              <li><button class="dropdown-item tbutton" on:click={toggleSetting} id=toggleMultiTurtles> 
                 Use Multi-Turtles <i class="{isChecked['useMultiTurtles']} wb"></i></button></li>
              <li><button class="dropdown-item tbutton" on:click={toggleSetting} id='toggleUseInstances'> 
                 Use Instances <i class="{isChecked['useInstances']} wb"></i></button></li>
          </ul>
        </div>
        <div class="nav-item dropstart">
          <button class="nav-link dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"> Help </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="./quick-ref.pdf" target="_blank"
                   data-bs-toggle="tooltip" data-bs-title={tip_btn_qref}
                   > Quick Reference </a></li>
            <li><span class="dropdown-item-text" style="color: gray">--External links--</span></li>
            <li><a class="dropdown-item" href="http://algorithmicbotany.org/" target="_blank"
                   data-bs-toggle="tooltip" data-bs-title={tip_btn_aborg}
                   > Algorithmic Botany </a></li>
            <li><a class="dropdown-item" href="http://www.algorithmicbotany.org/virtual_laboratory/docs/CPFGmanual.pdf" target="_blank"
                   data-bs-toggle="tooltip" data-bs-title={tip_btn_aborg}
                   > CPFG manual (for vlab)</a></li>
            <li><span class="dropdown-item-text" style="color: gray">----</span></li>
            <li><a class="dropdown-item" href="https://mathjs.org/docs/index.html" target="_blank"
                   data-bs-toggle="tooltip" data-bs-title={tip_btn_aborg}
                   > Math.js Docs</a></li>
            <li><a class="dropdown-item" href="https://mathjs.org/docs/expressions/syntax.html" target="_blank"
                   data-bs-toggle="tooltip" data-bs-title={tip_btn_aborg}
                   > Math.js Expression Syntax</a></li>
            <li><a class="dropdown-item" href="https://mathjs.org/docs/reference/functions.html" target="_blank"
                   data-bs-toggle="tooltip" data-bs-title={tip_btn_aborg}
                   > Math.js Function Reference </a></li>
          </ul>
        </div>
      </div>
    </div>
</nav>

<style>
  .fname {
    color: blue;
  }
  .wb {
    background: white;
  }
</style>
