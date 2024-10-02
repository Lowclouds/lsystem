<script>

  import {createReactiveContext} from '/src/lib/reactiveContext.js';
  import Toplevel from "/src/components/Toplevel";

</script>

<main>
  <Toplevel/>
</main>


<style>

  main {
    width: 100%;
    /* max-width: 240px; */
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<!-- These are required for sveltestrap to work  -->
<svelte:head>
  <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"> -->

  <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"> -->
</svelte:head>
