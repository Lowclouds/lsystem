<script>
   // import {defaultTurtle } from '/src/lib/scene.js';
   // import {Turtle3d} from 'src/lib/turtle3d.js'
   
   import {getContext} from 'svelte';
   import saveAs from 'file-saver';

   export let label='Save Mesh';
   export let smdisabled = true;
   export let smfile = 'lsmesh';

   let scene = getContext('scene');

   let dialog; // HTMLDialogElement
   let showModal = false;
   let ftype = 1; // save as .babylon
   let gltfinclude = ['materials'];
   let sceneElements = ['materials', 'ground', 'sky', 'axes', 'turtle'];

   $: if (dialog && showModal) dialog.showModal(); 

   function uiDoSave() {
     let meshes =Turtle3d.getTracksByTag('lsystem && (track || mesh)');
      let fname = smfile.split('.')[0];
      if (meshes.length) {
         switch (ftype) {
         case 1:
            puts("save model in babylon format");
            saveMeshBabylon(fname,meshes);
            break;
         case 2: 
            console.log(`save model in GLTF2, opts: ${gltfinclude}`);
            saveMeshGLTF(fname, meshes);
            break;
         }
      } else {
         puts('No meshes to save');
      }
      
      dialog.close();
   }

   function saveMeshGLTF(filename, meshes) {
      
      let mlist = meshes;
      let options = {
         shouldExportNode: function (node) {
            let ok = mlist.includes(node);
            // if (ok) {
            //    puts(`ok with ${node.id}/${node.name}`);
            // }
            return ok;
         },
      };
      
      BABYLON.GLTF2Export.GLBAsync($scene, filename, options).then((glb) => {
         glb.downloadFiles();
      });

      // BABYLON.GLTF2Export.GLTFAsync(scene, filename, options).then((gltf) => {
      //   gltf.downloadFiles();
      // });
   }

   function saveMeshBabylon(filename, meshes) {

      const serializedMesh = BABYLON.SceneSerializer.SerializeMesh(meshes[0]);

      const strMesh = JSON.stringify(serializedMesh);

      if (filename.toLowerCase().lastIndexOf(".babylon") !== filename.length - 8 || filename.length < 9) {
         filename += ".babylon";
      }

      const blob = new Blob([strMesh], { type: "octet/stream" });

      saveAs.saveAs(blob, filename);
   }

  let tip_btn_msave = `Save Model in Babylon or GLTF2 format`;
</script>


<button class="rabutton" id="btn-msave" disabled={smdisabled} on:click={() => showModal=true}
           data-bs-toggle="tooltip" data-bs-title={tip_btn_msave}
  > <i class="bi-save"></i>{label}</button>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
  id="saveModelModal"
   bind:this={dialog}
   on:close={() => (showModal = false)}
   on:click|self={() => dialog.close()}
   style="z-index=1000"
   >
   <div class="fcol"> 
      <label>
         <input type="radio" bind:group={ftype} value={1} name="bformat" />
         Babylon format (mesh only)
      </label>
      <label>
         <input type="radio" bind:group={ftype} value={2} name="gformat"/>
         GLTF2/GLB format (can't save instances)
      </label>
   </div>
   {#if ftype == 2}
      <div class="fcol indented"> 
      {#each sceneElements as sceneOpt}
         <label>
            <input type="checkbox" bind:group={gltfinclude} value={sceneOpt} name={sceneOpt} />
            {sceneOpt}
         </label>
      {/each}
   </div>
   {/if}
   <!-- svelte-ignore a11y-no-static-element-interactions -->
   <div class="footer" on:click|stopPropagation>
      <!-- svelte-ignore a11y-autofocus -->
      <button on:click={uiDoSave}>Save Mesh</button>
      <button value="cancel" formmethod="dialog" on:click={() => dialog.close()}>Cancel</button>
   </div>

</dialog>

<style>
   .fcol {
      display: flex;
      flex-direction: column;
   }
   .indented {
      padding-left: 2rem ;
   }
   .rabutton {
     border: 1px solid black;
     border-radius: 4px;
     margin: 0;
     padding: 0 0.25em;
     background-color: aquamarine;
   }
   .footer {
     display: flex;
     justify-content: space-between;
   }
</style>
