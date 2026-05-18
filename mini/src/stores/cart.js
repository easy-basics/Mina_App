import { defineStore } from 'pinia'
import { getCart } from '@/api/cart'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    count: 0,
  }),
  actions: {
    async refresh() {
      try {
        const res = await getCart()
        this.items = res.data || []
        this.count = this.items.reduce((sum, i) => sum + Number(i.quantity), 0)
      } catch {
        this.items = []
        this.count = 0
      }
    },
  },
})
