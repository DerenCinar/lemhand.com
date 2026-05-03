import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductsView from '../views/ProductsView.vue'
import BusTrackerView from '../views/BusTrackerView.vue'
import BlogView from '../views/BlogView.vue'
import AdminView from '../views/AdminView.vue'
import GenericPage from '../views/GenericPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView
    },
    {
      path: '/bustracker',
      name: 'bustracker',
      component: BusTrackerView
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/office',
      name: 'office',
      component: () => import('../views/OfficeDashboardView.vue')
    },
    {
      path: '/office/word/:id',
      name: 'office-word',
      component: () => import('../views/OfficeWordView.vue')
    },
    {
      path: '/office/sheets/:id',
      name: 'office-sheets',
      component: () => import('../views/OfficeSheetsView.vue')
    },
    {
      path: '/office/present/:id',
      name: 'office-present',
      component: () => import('../views/OfficePresentView.vue')
    },
    {
      path: '/page/:id',
      name: 'generic',
      component: GenericPage
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
