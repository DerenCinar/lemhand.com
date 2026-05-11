<script setup>
import { RouterLink, RouterView, useRoute } from "vue-router";
import { ref, onMounted, onUnmounted, computed } from "vue";
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

const route = useRoute();
const isDarkMode = ref(false);
const isMegaMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);
const userEmail = ref(null);

const hideLayout = computed(() => {
  return route.path.startsWith('/office') || 
         route.path.startsWith('/las') || 
         route.path.startsWith('/app') ||
         route.name === 'not-found';
});

let unsubscribeAuth = null;

onMounted(() => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    isDarkMode.value = true;
    document.documentElement.setAttribute("data-theme", "dark");
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      isDarkMode.value = event.matches;
      document.documentElement.setAttribute(
        "data-theme",
        event.matches ? "dark" : "light",
      );
    });

  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      userEmail.value = user.email;
    } else {
      userEmail.value = null;
    }
  });
});

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth();
});
</script>

<template>
  <div v-if="!hideLayout" class="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-200">
    <div class="navbar-start">
      <RouterLink to="/" class="btn btn-ghost normal-case text-2xl font-bold gap-2 text-primary">
        <img src="/favicon.svg" class="w-8 h-8" alt="LemHand Logo" />
        LemHand
      </RouterLink>
      <div class="hidden lg:flex gap-2 ml-4">
        <RouterLink to="/products" class="btn btn-ghost btn-sm">Products</RouterLink>
        <RouterLink to="/bustracker" class="btn btn-ghost btn-sm">BusTracker</RouterLink>
        <RouterLink to="/blog" class="btn btn-ghost btn-sm">Blog</RouterLink>
      </div>
    </div>

    <div class="navbar-end">
      <div class="dropdown dropdown-end lg:hidden">
        <label tabindex="0" class="btn btn-ghost lg:hidden" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
        </label>
        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52" v-if="isMobileMenuOpen">
          <li><RouterLink to="/products" @click="isMobileMenuOpen=false">Products</RouterLink></li>
          <li><RouterLink to="/bustracker" @click="isMobileMenuOpen=false">BusTracker</RouterLink></li>
          <li><RouterLink to="/blog" @click="isMobileMenuOpen=false">Blog</RouterLink></li>
          <li class="menu-title"><span>More</span></li>
          <li><a @click="isMegaMenuOpen = !isMegaMenuOpen; isMobileMenuOpen = false">All Products</a></li>
          <li><RouterLink to="/login" @click="isMobileMenuOpen=false" class="text-primary font-bold">{{ userEmail ? 'Account' : 'Sign in' }}</RouterLink></li>
        </ul>
      </div>

      <div class="hidden lg:flex items-center gap-2">
        <button @click="isMegaMenuOpen = !isMegaMenuOpen" class="btn btn-ghost btn-sm gap-1">
          All LemHand
          <svg class="w-4 h-4 transition-transform duration-200" :class="{'rotate-180': isMegaMenuOpen}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <RouterLink to="/login" class="btn btn-primary btn-sm rounded-full px-6">{{ userEmail ? 'Account' : 'Sign in' }}</RouterLink>
      </div>
    </div>
  </div>

  <!-- Mega Menu Dropdown -->
  <div v-show="isMegaMenuOpen" class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all" @click.self="isMegaMenuOpen = false" style="top: 65px;">
    <div class="bg-base-100 w-full max-h-[calc(100vh-65px)] overflow-y-auto shadow-2xl p-8 transform transition-transform duration-300">
      <div class="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="flex flex-col gap-2">
          <h4 class="font-bold text-lg text-primary mb-2">Software</h4>
          <RouterLink to="/page/internet" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">LemHand Internet</RouterLink>
          <RouterLink to="/office" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">LemHand Office</RouterLink>
          <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">LemHand Draw</a>
        </div>
        <div class="flex flex-col gap-2">
          <h4 class="font-bold text-lg text-primary mb-2">Mobility</h4>
          <RouterLink to="/bustracker" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">BusTracker</RouterLink>
          <a href="https://bus.lemhand.com" target="_blank" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">BusTracker Web</a>
        </div>
        <div class="flex flex-col gap-2">
          <h4 class="font-bold text-lg text-primary mb-2">Entertainment</h4>
          <a href="https://quizzy-online.web.app" target="_blank" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">Quizzy</a>
          <RouterLink to="/page/games" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">LemGames</RouterLink>
        </div>
        <div class="flex flex-col gap-2">
          <h4 class="font-bold text-lg text-primary mb-2">Business</h4>
          <RouterLink to="/page/enterprise" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">Enterprise Solutions</RouterLink>
          <RouterLink to="/blog" class="link link-hover text-base-content/80 hover:text-primary" @click="isMegaMenuOpen = false">Newsroom</RouterLink>
        </div>
      </div>
      <div class="container mx-auto mt-8 pt-4 border-t border-base-200 text-center">
        <RouterLink to="/page/sitemap" class="btn btn-outline btn-primary btn-sm rounded-full" @click="isMegaMenuOpen = false">View Sitemap</RouterLink>
      </div>
    </div>
  </div>

  <RouterView />

  <footer v-if="!hideLayout" class="footer p-10 bg-base-200 text-base-content mt-12">
    <aside class="max-w-sm">
      <img src="/favicon.svg" class="w-12 h-12 mb-4" alt="LemHand Logo" />
      <p class="font-bold text-lg">LemHand Corporation</p>
      <p class="opacity-70">Providing reliable tech since 2024.<br/>Building the future of software.</p>
    </aside>
    <nav>
      <header class="footer-title">Company</header>
      <RouterLink to="/blog" class="link link-hover">Newsroom</RouterLink>
      <RouterLink to="/page/contact" class="link link-hover">Contact us</RouterLink>
      <RouterLink to="/page/enterprise" class="link link-hover">Enterprise</RouterLink>
    </nav>
    <nav>
      <header class="footer-title">Legal</header>
      <RouterLink to="/page/terms" class="link link-hover">Terms of use</RouterLink>
      <RouterLink to="/page/privacy" class="link link-hover">Privacy policy</RouterLink>
      <RouterLink to="/page/trademarks" class="link link-hover">Trademarks</RouterLink>
    </nav>
    <nav>
      <header class="footer-title">Links</header>
      <RouterLink to="/page/sitemap" class="link link-hover">Sitemap</RouterLink>
      <RouterLink to="/page/safety" class="link link-hover">Safety & eco</RouterLink>
      <RouterLink to="/page/ads" class="link link-hover">About our ads</RouterLink>
    </nav>
  </footer>
  <footer v-if="!hideLayout" class="footer px-10 py-4 border-t bg-base-200 text-base-content border-base-300">
    <aside class="items-center grid-flow-col">
      <p>© {{ new Date().getFullYear() }} LemHand Corporation. All rights reserved.</p>
    </aside>
  </footer>
</template>
