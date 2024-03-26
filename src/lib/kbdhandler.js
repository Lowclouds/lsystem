// import {getContext} from 'svelte';

export const initKbd = (keybindings) => {
  document.addEventListener(
    "keydown",
    keydownHandler,
    false,
  );

  document.addEventListener(
    "keyup",
    keyupHandler,
    false,
  );
}

let iscomposing=0;

function keydownHandler(event) {
  const keyName = event.key;
  
  if (keyName === "Control") {
    // do not alert when only Control key is pressed.
    return;
  }
  
  // Even though event.key is not 'Control' (e.g., 'a' is pressed),
  // event.ctrlKey may be true if Ctrl key is pressed at the same time.

  if (event.ctrlKey && keyName === 'x') {
    iscomposing=1;
    console.log(`Combination of ctrlKey + ${keyName}; cancelable: ${event.cancelable}`);
  }
}

function keyupHandler(event) {
  const keyName = event.key;
  // As the user releases the Ctrl key, the key is no longer active,
  // so event.ctrlKey is false.
  if (keyName === "Control") {
    console.log("Control key was released");
    if (iscomposing=1) iscomposing=2;
  } else if (iscomposing == 2) {
    switch (keyName) {
    case 's':
      event.preventDefault();
      console.log('trigger a save');
      break;
    default:
      iscomposing = 0;
      break;
    }
  }
}
