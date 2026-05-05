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
         route.name === 'not-found';
});

let unsubscribeAuth = null;

onMounted(() => {
  // Check system preference
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
  <nav v-if="!hideLayout" class="ms-nav">
    <div class="ms-nav-left">
      <RouterLink to="/" class="ms-nav-logo"> LemHand </RouterLink>
      <div class="desktop-only" style="display: flex; align-items: center; gap: 5px; height: 100%">
        <RouterLink to="/products" class="ms-nav-link">Products</RouterLink>
        <RouterLink to="/bustracker" class="ms-nav-link">BusTracker</RouterLink>
        <RouterLink to="/blog" class="ms-nav-link">Blog</RouterLink>
      </div>
    </div>

    <div class="ms-nav-right">
      <div
        style="display: flex; align-items: center; gap: 20px; font-size: 13px"
      >
        <button
          @click="isMegaMenuOpen = !isMegaMenuOpen"
          class="ms-nav-link"
          style="
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 16px 12px;
          "
        >
          All LemHand
          <span
            style="font-size: 10px; transition: transform 0.2s"
            :style="isMegaMenuOpen ? 'transform: rotate(180deg);' : ''"
            >▼</span
          >
        </button>
        <RouterLink
          to="/login"
          style="font-weight: 600; cursor: pointer;"
          class="desktop-only"
          >{{ userEmail ? 'Account' : 'Sign in' }}</RouterLink
        >
        <!-- Mobile hamburger -->
        <button class="mobile-only ms-nav-link" @click="isMobileMenuOpen = !isMobileMenuOpen" style="font-size: 20px; padding: 10px;">
          ☰
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile Menu Dropdown -->
  <div v-show="isMobileMenuOpen" class="mega-menu mobile-only" @click.self="isMobileMenuOpen = false">
    <div class="mega-menu-content" style="padding: 15px;">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <RouterLink to="/products" class="ms-nav-link" style="font-size: 1.1rem;" @click="isMobileMenuOpen = false">Products</RouterLink>
        <RouterLink to="/bustracker" class="ms-nav-link" style="font-size: 1.1rem;" @click="isMobileMenuOpen = false">BusTracker</RouterLink>
        <RouterLink to="/blog" class="ms-nav-link" style="font-size: 1.1rem;" @click="isMobileMenuOpen = false">Blog</RouterLink>
        <div style="height: 1px; background: var(--border-color); margin: 10px 0;"></div>
        <RouterLink to="/login" class="ms-nav-link" style="font-weight: 600; font-size: 1.1rem;" @click="isMobileMenuOpen = false">{{ userEmail ? 'Account' : 'Sign in' }}</RouterLink>
      </div>
    </div>
  </div>
  <!-- Mega Menu Dropdown -->
  <div
    v-show="isMegaMenuOpen"
    class="mega-menu"
    @click.self="isMegaMenuOpen = false"
  >
    <div class="mega-menu-content">
      <div class="mega-menu-grid">
        <div class="mega-menu-column">
          <h4>Software</h4>
          <RouterLink to="/page/internet" @click="isMegaMenuOpen = false"
            >LemHand Internet</RouterLink
          >
          <RouterLink to="/office" @click="isMegaMenuOpen = false"
            >LemHand Office</RouterLink
          >
          <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" @click="isMegaMenuOpen = false"
            >LemHand Draw</a
          >
        </div>
        <div class="mega-menu-column">
          <h4>Mobility</h4>
          <RouterLink to="/bustracker" @click="isMegaMenuOpen = false"
            >BusTracker</RouterLink
          >
          <a
            href="https://bus.lemhand.com"
            target="_blank"
            @click="isMegaMenuOpen = false"
            >BusTracker Web</a
          >
        </div>
        <div class="mega-menu-column">
          <h4>Entertainment</h4>
          <a href="https://quizzy-online.web.app" target="_blank" @click="isMegaMenuOpen = false"
            >Quizzy</a
          >
          <RouterLink to="/page/games" @click="isMegaMenuOpen = false"
            >LemGames</RouterLink
          >
        </div>
        <div class="mega-menu-column">
          <h4>Business</h4>
          <RouterLink to="/page/enterprise" @click="isMegaMenuOpen = false"
            >Enterprise Solutions</RouterLink
          >
          <RouterLink to="/blog" @click="isMegaMenuOpen = false"
            >Newsroom</RouterLink
          >
        </div>
      </div>
      <div class="mega-menu-footer">
        <RouterLink to="/page/sitemap" class="ms-link" @click="isMegaMenuOpen = false">View Sitemap</RouterLink>
      </div>
    </div>
  </div>

  <RouterView />

  <footer v-if="!hideLayout" class="ms-footer">
    <div class="ms-footer-content">
      <div class="ms-footer-links">
        <RouterLink to="/page/sitemap">Sitemap</RouterLink>
        <RouterLink to="/page/contact">Contact LemHand</RouterLink>
        <RouterLink to="/page/privacy">Privacy</RouterLink>
        <RouterLink to="/page/terms">Terms of use</RouterLink>
        <RouterLink to="/page/trademarks">Trademarks</RouterLink>
        <RouterLink to="/page/safety">Safety & eco</RouterLink>
        <RouterLink to="/page/ads">About our ads</RouterLink>
        <span>© {{ new Date().getFullYear() }} LemHand Corporation</span>
      </div>
    </div>
  </footer>
</template>
