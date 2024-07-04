<script>
/*
U+0391 	Α 	913 	Greek Capital Letter Alpha 	0386
U+0392 	Β 	914 	Greek Capital Letter Beta 	0387
U+0393 	Γ 	915 	Greek Capital Letter Gamma 	0388
U+0394 	Δ 	916 	Greek Capital Letter Delta 	0389
U+0395 	Ε 	917 	Greek Capital Letter Epsilon 	0390
U+0396 	Ζ 	918 	Greek Capital Letter Zeta 	0391
U+0397 	Η 	919 	Greek Capital Letter Eta 	0392
U+0398 	Θ 	920 	Greek Capital Letter Theta 	0393
U+0399 	Ι 	921 	Greek Capital Letter Iota 	0394
U+039A 	Κ 	922 	Greek Capital Letter Kappa 	0395
U+039B 	Λ 	923 	Greek Capital Letter Lambda 	0396
U+039C 	Μ 	924 	Greek Capital Letter Mu 	0397
U+039D 	Ν 	925 	Greek Capital Letter Nu 	0398
U+039E 	Ξ 	926 	Greek Capital Letter Xi 	0399
U+039F 	Ο 	927 	Greek Capital Letter Omicron 	0400
U+03A0 	Π 	928 	Greek Capital Letter Pi 	0401
U+03A1 	Ρ 	929 	Greek Capital Letter Rho 	0402
U+03A3 	Σ 	931 	Greek Capital Letter Sigma 	0403
U+03A4 	Τ 	932 	Greek Capital Letter Tau 	0404
U+03A5 	Υ 	933 	Greek Capital Letter Upsilon 	0405
U+03A6 	Φ 	934 	Greek Capital Letter Phi 	0406
U+03A7 	Χ 	935 	Greek Capital Letter Chi 	0407
U+03A8 	Ψ 	936 	Greek Capital Letter Psi 	0408
U+03A9 	Ω 	937 	Greek Capital Letter Omega 	0409
...
U+03B1 	α 	945 	Greek Small Letter Alpha 	0417
U+03B2 	β 	946 	Greek Small Letter Beta 	0418
U+03B3 	γ 	947 	Greek Small Letter Gamma 	0419
U+03B4 	δ 	948 	Greek Small Letter Delta 	0420
U+03B5 	ε 	949 	Greek Small Letter Epsilon 	0421
U+03B6 	ζ 	950 	Greek Small Letter Zeta 	0422
U+03B7 	η 	951 	Greek Small Letter Eta 	0423
U+03B8 	θ 	952 	Greek Small Letter Theta 	0424
U+03B9 	ι 	953 	Greek Small Letter Iota 	0425
U+03BA 	κ 	954 	Greek Small Letter Kappa 	0426
U+03BB 	λ 	955 	Greek Small Letter Lambda 	0427
U+03BC 	μ 	956 	Greek Small Letter Mu 	0428
U+03BD 	ν 	957 	Greek Small Letter Nu 	0429
U+03BE 	ξ 	958 	Greek Small Letter Xi 	0430
U+03BF 	ο 	959 	Greek Small Letter Omicron 	0431
U+03C0 	π 	960 	Greek Small Letter Pi 	0432
U+03C1 	ρ 	961 	Greek Small Letter Rho 	0433
U+03C2 	ς 	962 	Greek Small Letter Final Sigma 	0434
U+03C3 	σ 	963 	Greek Small Letter Sigma 	0435
U+03C4 	τ 	964 	Greek Small Letter Tau 	0436
U+03C5 	υ 	965 	Greek Small Letter Upsilon 	0437
U+03C6 	φ 	966 	Greek Small Letter Phi 	0438
U+03C7 	χ 	967 	Greek Small Letter Chi 	0439
U+03C8 	ψ 	968 	Greek Small Letter Psi 	0440
U+03C9 	ω 	969 	Greek Small Letter Omega 	0441 
*/
  export let insertTarget = null;

  let leftBound = '\u22D0';
  let rightBound = '\u22D1';

  let _symbols = [
    '\u22D0 \u22D1', '\u22D0', '\u22D1',
    '\u0393', '\u0394', '\u0398',
    '\u0399', '\u039A', '\u039B',
    '\u039E', '\u03A0', '\u03A3',
    '\u03A4', '\u03A5','\u03A6',
    '\u03A8', '\u03A9', '\u03B1',
    '\u03B2', '\u03B3', '\u03B4',
    '\u03B5', '\u03B6', '\u03B7',
    '\u03B8', '\u03B9', '\u03BA',
    '\u03BB', '\u03BC', '\u03BD',
    '\u03BE', '\u03BF', '\u03C0',
    '\u03C1', '\u03C2', '\u03C3',
    '\u03C4', '\u03C5', '\u03C6',
    '\u03C7', '\u03C8', '\u03C9',
  ];


  function insertSymbol(evt) {
    let sym = evt?.target.textContent;
    console.log('insertTarget: ', insertTarget, '  sym: ', sym)
    if (insertTarget != null) {
      evt?.target.blur();
      let curpos = insertTarget.selectionStart;

      insertTarget.focus();
      insertTarget.setRangeText(sym, curpos, curpos, 'start');
      insertTarget.selectionStart = curpos+1;
    }
  }

</script>

  <!-- <div class="gbutton nbutton my-0 py-0" >Insert network branch</div> -->
  <!-- <button class="gbutton tbutton" id="btn-insert" on:click={uiInsertSymbol}>{leftBound} </button> -->
  <!-- <button class="gbutton tbutton" id="btn-insert" on:click={uiInsertSymbol}>{rightBound}</button> -->


<div class="gbutton nbutton my-0 py-0" >More Modules</div>
<div class="dropdown">
  <button id="btn-symbols" class="gbutton tbutton" data-bs-toggle="dropdown">
    &#x22D0 &#x0398 &#x22D1 
  </button>
  <div class="dropdown-menu" aria-labelledby="btn-symbols">
    <table class="tbl" id="symboltable">
      {#each _symbols as sym, i}
        {#if (i%3) == 0}
          <tr>
        {/if}    
        <td><button on:click={insertSymbol}>{sym}</button></td>
        <!-- {#if (i%3) == 2} -->
        <!--   </tr> -->
        <!-- {/if} -->
      {/each}
    </table>
  </div>
</div>

<style>
  button {
    background-color: aquamarine;
    border-radius: 4px;
    align-content: center;
    min-width: 5em;
    padding: 0 1em 0 .25em;  }

  table {
    border: 1px solid black;
  }
  td {
    padding: 0 0em 0 0em;
  }
</style>


