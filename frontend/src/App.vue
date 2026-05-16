<script setup>
import { RouterLink, RouterView, useRoute } from "vue-router";
import { ref, onMounted, onUnmounted, computed } from "vue";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const route = useRoute();
const isDarkMode = ref(false);
const isMegaMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);
const userEmail = ref(null);
const isDropdownOpen = ref(false);

const hideLayout = computed(() => {
  return (
    route.path.startsWith("/office") ||
    route.path.startsWith("/las") ||
    route.path.startsWith("/app") ||
    route.name === "not-found"
  );
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

const handleSignOut = async () => {
  await signOut(auth);
  isDropdownOpen.value = false;
};
</script>

<template>
  <div
    v-if="!hideLayout"
    class="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 border-b border-base-200"
  >
    <header id="navigation" class="p-navigation is-dark">
      <div class="p-navigation__row--25-75">
        <div class="p-navigation__banner">
          <div class="p-navigation__tagged-logo">
            <a class="p-navigation__link" href="#">
              <div
                class="p-navigation__logo-tag"
                style="background-color: green"
              >
                LH
              </div>
              <span class="p-navigation__logo-title">LemHand</span>
            </a>
          </div>
          <ul class="p-navigation__items">
            <li class="p-navigation__item">
              <button
                class="js-search-button p-navigation__link--search-toggle"
              >
                <span class="p-navigation__search-label">Search</span>
              </button>
            </li>
            <li class="p-navigation__item">
              <button class="js-menu-button p-navigation__link">Menu</button>
            </li>
          </ul>
        </div>
        <nav class="p-navigation__nav" aria-label="Example main">
          <ul class="p-navigation__items">
            <li
              class="p-navigation__item"
              :class="{ 'is-selected': route.path === '/' }"
            >
              <RouterLink class="p-navigation__link" to="/">Home</RouterLink>
            </li>
            <li
              class="p-navigation__item"
              :class="{ 'is-selected': route.path === '/products' }"
            >
              <RouterLink class="p-navigation__link" to="/products"
                >Products</RouterLink
              >
            </li>
            <li
              class="p-navigation__item"
              :class="{ 'is-selected': route.path === '/blog' }"
            >
              <RouterLink class="p-navigation__link" to="/blog"
                >LemHand Blog</RouterLink
              >
            </li>
          </ul>
          <ul class="p-navigation__items">
            <!-- Sign in or Dropdown -->
            <li class="p-navigation__item" v-if="!userEmail">
              <RouterLink class="p-navigation__link" to="/login">Sign in</RouterLink>
            </li>
            <li 
              v-else 
              class="p-navigation__item--dropdown-toggle" 
              :class="{ 'is-active': isDropdownOpen }"
              @click="isDropdownOpen = !isDropdownOpen"
              style="cursor: pointer;"
            >
              <a class="p-navigation__link" href="#" @click.prevent>
                Hi, {{ userEmail.split('@')[0] }}
              </a>
              <ul class="p-navigation__dropdown" :aria-hidden="!isDropdownOpen">
                <li><RouterLink class="p-navigation__link" to="/account">My account</RouterLink></li>
                <li><RouterLink class="p-navigation__link" to="/purchases">My purchases</RouterLink></li>
                <li><a class="p-navigation__link" href="#" @click.prevent="handleSignOut">Sign out</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  </div>
  <RouterView />

  <footer v-if="!hideLayout" class="l-footer--sticky p-strip--highlighted">
    <nav class="row" aria-label="Footer">
      <div class="has-cookie">
        <p>
          © 2026 LemHand Ltd. <a href="/bustracker">BusTracker</a> and
          <a href="#">LemHand</a> are trademarks of LemHand Ltd.
        </p>
        <ul class="p-inline-list--middot">
          <li class="p-inline-list__item">
            <a href="#"><small>Legal information</small></a>
          </li>
          <li class="p-inline-list__item">
            <a href="#"><small>Report a bug on this site</small></a>
          </li>
        </ul>
        <span class="u-off-screen"
          ><a href="#">Go to the top of the page</a></span
        >
      </div>
    </nav>
  </footer>
</template>
