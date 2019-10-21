import Vue from 'vue'
import Router from 'vue-router'
import MenuList from '@/components/MenuList'
import MenuView from '@/components/MenuView'

Vue.use(Router)

const withNameView = (name, view, optons) => {
  const { component, ...otherOptions } = optons

  return {
    components: {
      default: component,
      [name || view.name]: view
    },
    ...otherOptions
  }
}

export const withMenuViewRoutes = [
  {
    path: '/wx-jump-stage1',
    name: 'wx-jump-stage1',
    meta: {
      title: '微信跳一跳 (1)'
    },
    component: () => import(/* webpackChunkName: "wx-jump-stage1" */ './games/wx-jump-1/index.vue')
  },
  {
    path: '/wx-jump-stage2',
    name: 'wx-jump-stage2',
    meta: {
      title: '微信跳一跳 (2)'
    },
    component: () => import(/* webpackChunkName: "wx-jump-stage2" */ './games/wx-jump-2/index.vue')
  }
]

const defaultRoutes = [
  {
    path: '/',
    name: 'menu-list',
    component: MenuList
  }
]

export default new Router({
  routes: [
    ...defaultRoutes,
    ...withMenuViewRoutes.map(withNameView.bind(null, 'MenuView', MenuView)),
    {
      path: '*',
      component: MenuList
    }
  ]
})
