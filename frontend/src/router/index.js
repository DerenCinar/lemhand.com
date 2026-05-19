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
      component: HomeView,
      meta: { title: 'LemHand | Innovative Software Solutions', description: 'LemHand provides innovative software solutions including our modern Office suite and BusTracker application.' }
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { title: 'Our Products | LemHand', description: 'Explore our suite of modern applications including LemHand Office, BusTracker, and more.' }
    },
    {
      path: '/bustracker',
      name: 'bustracker',
      component: BusTrackerView,
      meta: { title: 'BusTracker | LemHand', description: 'Track your local transit in real-time with the LemHand BusTracker app.' }
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView,
      meta: { title: 'Blog | LemHand', description: 'Read the latest updates, news, and technical insights from the LemHand team.' }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { title: 'Admin Dashboard | LemHand' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Sign In | LemHand', description: 'Sign in to your LemHand account to access your documents and services.' }
    },
    {
      path: '/office',
      name: 'office',
      component: () => import('../views/OfficeDashboardView.vue'),
      meta: { title: 'LemHand Office', description: 'Access your cloud-based documents, spreadsheets, and presentations with LemHand Office.' }
    },
    {
      path: '/office/word/:id',
      name: 'office-word',
      component: () => import('../views/OfficeWordView.vue'),
      meta: { title: 'Word Document | LemHand Office' }
    },
    {
      path: '/office/form/:id',
      name: 'office-form',
      component: () => import('../views/OfficeFormView.vue'),
      meta: { title: 'Form Editor | LemHand Office' }
    },
    {
      path: '/office/form/:id/respond',
      name: 'form-respond',
      component: () => import('../views/OfficeFormResponderView.vue'),
      meta: { title: 'Respond to Form | LemHand Office' }
    },
    {
      path: '/office/sheets/:id',
      name: 'office-sheets',
      component: () => import('../views/OfficeSheetsView.vue'),
      meta: { title: 'Spreadsheet | LemHand Office' }
    },
    {
      path: '/office/present/:id',
      name: 'office-present',
      component: () => import('../views/OfficePresentView.vue'),
      meta: { title: 'Presentation | LemHand Office' }
    },
    {
      path: '/app/word',
      name: 'app-word',
      component: () => import('../views/AppWordDashboard.vue')
    },
    {
      path: '/app/sheets',
      name: 'app-sheets',
      component: () => import('../views/AppSheetsDashboard.vue')
    },
    {
      path: '/app/present',
      name: 'app-present',
      component: () => import('../views/AppPresentDashboard.vue')
    },
    {
      path: '/page/:id',
      name: 'generic',
      component: GenericPage
    },
    {
      path: '/las/signin',
      name: 'las-signin',
      component: () => import('../views/LASSignInView.vue'),
      meta: { title: 'Sign In | LemHand Account Services' }
    },
    {
      path: '/las/demo',
      name: 'las-demo',
      component: () => import('../views/LASDemoView.vue'),
      meta: { title: 'Demo | LemHand Account Services' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page Not Found | LemHand' }
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export const isOfficeUnderConstruction = true;

router.beforeEach((to, from, next) => {
  // SEO Titles
  if (to.meta && to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = 'LemHand';
  }

  // SEO Meta Descriptions
  const description = (to.meta && to.meta.description) ? to.meta.description : 'LemHand provides innovative software solutions including our modern Office suite and BusTracker application.';
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', description);
  } else {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = description;
    document.head.appendChild(metaDesc);
  }

  if (isOfficeUnderConstruction && to.path.startsWith('/office/')) {
    next('/office');
  } else {
    next();
  }
});

export default router
