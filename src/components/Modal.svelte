<script>
/* stolen from somewhere */
  export let showModal=false; // boolean
  export let showNonModal=false; // boolean
  export let closeModalLbl = 'Close';  
  export let position = 'static';

  let dialog; // HTMLDialogElement
  
  $: if (dialog && showModal) dialog.showModal();
  $: if (dialog && showNonModal) dialog.show();
  $: if (dialog && dialog.open && !(showModal || showNonModal)) dialog.close();
</script>


<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
   bind:this={dialog}
   on:close={() => (showModal = showNonModal = false)}
   on:click|self={() => dialog.close()}
   style:position
   >
   <!-- svelte-ignore a11y-no-static-element-interactions -->
   <div on:click|stopPropagation>
      <slot name="header" />
      <slot />
      <hr />
      <!-- svelte-ignore a11y-autofocus -->
      <button autofocus on:click={() => dialog.close()}>{closeModalLbl}</button>
   </div>
</dialog>

<style>
   dialog {
      max-width: 32em;
      border-radius: 0.2em;
      border: 2px solid black;
      padding: 0;
   }
   dialog::backdrop {
      background: rgba(0, 0, 0, 0.3);
   }
   dialog > div {
      padding: 1em;
   }
   dialog[open] {
      animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   @keyframes zoom {
      from {
	 transform: scale(0.95);
      }
      to {
	 transform: scale(1);
      }
   }
   dialog[open]::backdrop {
      animation: fade 0.2s ease-out;
   }
   @keyframes fade {
      from {
	 opacity: 0;
      }
      to {
	 opacity: 1;
      }
   }
   button {
      display: block;
   }
</style>
