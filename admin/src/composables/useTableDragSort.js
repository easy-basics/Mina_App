import { nextTick, onBeforeUnmount, watch } from 'vue'
import Sortable from 'sortablejs'

/**
 * el-table 行拖拽排序
 * @param {object} options
 * @param {import('vue').Ref} options.tableRef - el-table ref
 * @param {import('vue').Ref|Function} options.listRef - 列表 ref 或 getter
 * @param {Function} options.onSave - async (items: {id, sort}[]) => void
 * @param {import('vue').Ref<boolean>} [options.enabledRef] - 是否启用
 */
export function useTableDragSort({ tableRef, listRef, onSave, enabledRef }) {
  let sortable = null

  function getList() {
    const v = typeof listRef === 'function' ? listRef() : listRef.value
    return v || []
  }

  function setList(next) {
    if (typeof listRef === 'function') {
      throw new Error('listRef must be a ref when using setList')
    }
    listRef.value = next
  }

  function destroy() {
    sortable?.destroy()
    sortable = null
  }

  function init() {
    destroy()
    const enabled = enabledRef ? enabledRef.value : true
    if (!enabled) return

    const tbody = tableRef.value?.$el?.querySelector('.el-table__body-wrapper tbody')
    const list = getList()
    if (!tbody || list.length === 0) return

    sortable = Sortable.create(tbody, {
      animation: 180,
      handle: '.drag-handle',
      ghostClass: 'drag-row-ghost',
      chosenClass: 'drag-row-chosen',
      async onEnd({ oldIndex, newIndex }) {
        if (oldIndex === newIndex || oldIndex == null || newIndex == null) return
        const arr = [...getList()]
        const [moved] = arr.splice(oldIndex, 1)
        arr.splice(newIndex, 0, moved)
        setList(arr)
        const items = arr.map((row, i) => ({ id: row.id, sort: i }))
        try {
          await onSave(items)
        } catch {
          /* 调用方处理提示 */
        }
      },
    })
  }

  if (enabledRef) {
    watch(enabledRef, (v) => {
      if (v) nextTick(() => init())
      else destroy()
    })
  }

  watch(
    () => getList().map((r) => r.id).join(','),
    () => {
      if (!enabledRef || enabledRef.value) {
        nextTick(() => init())
      }
    }
  )

  onBeforeUnmount(destroy)

  return { init, destroy }
}
