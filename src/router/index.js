import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import { BasicLayout } from '@/layouts'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: BasicLayout,
    redirect: '/about/index',
    children: [{
      path: '/about/index',
      component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    }

    ]
  }
]
export default new VueRouter({
  mode: 'history',
  routes: routes
})
