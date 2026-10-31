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
    route.path.startsWith("/app")
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
                <img src="/Grayscale.svg" />
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
              :class="{ 'is-selected': route.path === '/projects' }"
            >
              <RouterLink class="p-navigation__link" to="/projects"
                >Projects</RouterLink
              >
            </li>
            <li
              class="p-navigation__item"
              :class="{ 'is-selected': route.path === '/games' }"
            >
              <RouterLink class="p-navigation__link" to="/games"
                >LH Studios</RouterLink
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
            <li class="p-navigation__item" v-if="!userEmail">
              <RouterLink class="p-navigation__link" to="/login"
                >Sign in</RouterLink
              >
            </li>
            <li
              v-else
              class="p-navigation__item--dropdown-toggle"
              :class="{ 'is-active': isDropdownOpen }"
              @click="isDropdownOpen = !isDropdownOpen"
              style="cursor: pointer"
            >
              <a class="p-navigation__link" href="#" @click.prevent>
                Hi, {{ userEmail.split("@")[0] }}
              </a>
              <ul class="p-navigation__dropdown" :aria-hidden="!isDropdownOpen">
                <li>
                  <RouterLink class="p-navigation__link" to="/account"
                    >My account</RouterLink
                  >
                </li>
                <li>
                  <RouterLink class="p-navigation__link" to="/purchases"
                    >My purchases</RouterLink
                  >
                </li>
                <li>
                  <a
                    class="p-navigation__link"
                    href="#"
                    @click.prevent="handleSignOut"
                    >Sign out</a
                  >
                </li>
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
          LemHand is an independent student project for demonstrative and
          learning purposes.

          <li class="p-inline-list__item">
            <RouterLink to="/report-bug"
              ><small>Report a bug on this site</small></RouterLink
            >
          </li>
        </p>
        <span class="u-off-screen"
          ><a href="#">Go to the top of the page</a></span
        >
      </div>
    </nav>
  </footer>
</template>
<!--
<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f0f2f5;
      overflow: hidden;
    "
    :style="{ '--theme-color': customThemeColor }"
  >
    <div
      v-if="showWelcomeVideo"
      class="custom-modal-overlay"
      style="z-index: 100000; background: #000"
    >
      <video
        src="/lemhandOfficeWelcome.mp4"
        autoplay
        muted
        playsinline
        @ended="closeWelcomeVideo"
        style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        "
      ></video>
    </div>

    <div v-if="loginModal" class="custom-modal-overlay" style="z-index: 99999">
      <div class="custom-modal" style="width: 380px; text-align: center">
        <div
          style="display: flex; justify-content: center; margin-bottom: 16px"
        >
          <img
            src="/favicon.svg"
            alt="LemHand"
            style="width: 48px; height: 48px"
          />
        </div>
        <h2 style="color: var(--theme-color); margin-bottom: 10px">
          Welcome to LemHand Office
        </h2>
        <p style="margin-bottom: 24px; color: #5f6368; font-size: 14px">
          Log in to your account using your standard LemHand login.
        </p>
        <button
          @click="loginWithLemHand"
          class="modal-btn primary"
          style="
            width: 100%;
            margin-top: 10px;
            padding: 12px;
            background: var(--theme-color);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          "
        >
          <img
            src="/favicon.svg"
            alt="LemHand"
            style="width: 20px; height: 20px; filter: brightness(0) invert(1)"
          />
          Sign in with LemHand
        </button>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px">
          Securely provided by LemHand Account Services
        </p>
      </div>
    </div>

    <div
      v-if="settingsModalOpen"
      class="custom-modal-overlay"
      style="z-index: 10000"
    >
      <div class="custom-modal" style="width: 380px">
        <h2 style="color: var(--theme-color); margin-bottom: 20px">Settings</h2>
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          "
        >
          <span style="font-size: 14px; font-weight: 500"
            >Enable UI Animations</span
          >
          <input
            type="checkbox"
            v-model="showAnimations"
            @change="saveSettings"
          />
        </div>
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          "
        >
          <span style="font-size: 14px; font-weight: 500">Theme Color</span>
          <input
            type="color"
            v-model="customThemeColor"
            @change="saveSettings"
            style="border: none; width: 40px; height: 40px; cursor: pointer"
          />
        </div>
        <button
          @click="settingsModalOpen = false"
          class="modal-btn secondary"
          style="width: 100%"
        >
          Close
        </button>
      </div>
    </div>

    <div
      style="display: flex; flex-grow: 1; overflow: hidden; background: #f0f2f5"
    >

      <main style="flex-grow: 1; overflow-y: auto; padding: 2rem">
        <div style="max-width: 1200px; margin: 0 auto">
          <div
            style="
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 50vh;
            "
          >
            <div
              class="p-card--highlighted"
              style="max-width: 600px; text-align: center; padding: 3rem"
            >
              <div style="font-size: 3rem; margin-bottom: 1rem">🚧</div>
              <h2>Not Avalible</h2>
              <p>
                The LemHand.com website is currently unavalible until further
                notice
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
-->
