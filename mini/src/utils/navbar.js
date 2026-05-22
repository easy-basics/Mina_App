/** 自定义导航栏布局（适配微信胶囊） */
export function getNavBarMetrics() {
  const sys = uni.getSystemInfoSync()
  const menu = uni.getMenuButtonBoundingClientRect()
  const navBarHeight = (menu.top - sys.statusBarHeight) * 2 + menu.height
  return {
    statusBarHeight: sys.statusBarHeight || 0,
    navBarHeight,
    menuButton: menu,
    totalHeight: menu.bottom,
    capsuleRight: sys.windowWidth - menu.left,
  }
}
