import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    selectedStore: null,
  }),
  actions: {
    setStore(store) {
      this.selectedStore = store
    },
    clearStore() {
      this.selectedStore = null
    },
  },
})
