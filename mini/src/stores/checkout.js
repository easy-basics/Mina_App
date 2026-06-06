import { defineStore } from 'pinia'

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    draft: null,
    /** 购物车来源时：productId -> storeId[] */
    productStoreMap: {},
  }),
  actions: {
    setDraft(draft) {
      this.draft = draft
    },
    setProductStoreMap(map) {
      this.productStoreMap = map || {}
    },
    getDraft() {
      return this.draft
    },
    clearDraft() {
      this.draft = null
      this.productStoreMap = {}
    },
  },
})
