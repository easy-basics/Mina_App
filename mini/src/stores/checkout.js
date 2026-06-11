import { defineStore } from 'pinia'

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    draft: null,
  }),
  actions: {
    setDraft(draft) {
      this.draft = draft
    },
    getDraft() {
      return this.draft
    },
    clearDraft() {
      this.draft = null
    },
  },
})
