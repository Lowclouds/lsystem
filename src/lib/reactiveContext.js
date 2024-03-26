import { setContext, getContext, get } from 'svelte'
import { writable } from 'svelte/store'

export function createReactiveContext(name, self) {
  const store = writable(self)
  setContext(name, store)

  return store
}
