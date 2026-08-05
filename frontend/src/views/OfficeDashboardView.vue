<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { db } from "../firebase";
import { doc, deleteDoc as firestoreDelete, setDoc } from "firebase/firestore";
import { isOfficeUnderConstruction } from "../router/index.js";

const router = useRouter();
const recentDocs = ref([]);
const activeCategory = ref("all");
const searchQuery = ref("");

const username = ref(localStorage.getItem("lemhand_office_name") || "");
const loginModal = ref(false);
const accountMenuOpen = ref(false);
const settingsModalOpen = ref(false);
const customThemeColor = ref(
  localStorage.getItem("lemhand_office_theme_color") || "#0078d4",
);
const showWelcomeVideo = ref(false);

const closeWelcomeVideo = () => {
  showWelcomeVideo.value = false;
  localStorage.setItem("lemhand_office_welcomed", "true");
};

const loginWithLemHand = () => {
  const lasUrl = new URL(window.location.origin + "/las/signin");
  lasUrl.searchParams.append("client_id", "lemhand_office");
  lasUrl.searchParams.append(
    "redirect_uri",
    window.location.href.split("?")[0],
  );
  window.location.href = lasUrl.toString();
};

const logout = () => {
  localStorage.removeItem("lemhand_office_name");
  username.value = "";
  accountMenuOpen.value = false;
  loginModal.value = true;
};

const uiIcons = {
  home: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  office: `<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>`,
};

const icons = {
  word: `<img src="/1.svg" alt="Word" style="width: 100%; height: 100%; object-fit: contain;">`,
  sheets: `<img src="/2.svg" alt="Sheets" style="width: 100%; height: 100%; object-fit: contain;">`,
  present: `<img src="/3.svg" alt="Presentations" style="width: 100%; height: 100%; object-fit: contain;">`,
  form: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#7b2cbf"/><path d="M14 2V8H20L14 2Z" fill="#5a1e8a"/><text x="8" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">F</text></svg>`,
};

const templates = [
  {
    id: "blank-word",
    name: "Blank Document",
    type: "word",
    icon: icons.word,
    description: "Start from scratch",
  },
  {
    id: "resume-word",
    name: "Modern Resume",
    type: "word",
    icon: icons.word,
    description: "Professional layout",
  },
  {
    id: "blank-sheets",
    name: "Blank Spreadsheet",
    type: "sheets",
    icon: icons.sheets,
    description: "New data sheet",
  },
  {
    id: "budget-sheets",
    name: "Monthly Budget",
    type: "sheets",
    icon: icons.sheets,
    description: "Track expenses",
  },
  {
    id: "blank-present",
    name: "Blank Presentation",
    type: "present",
    icon: icons.present,
    description: "New slide deck",
  },
  {
    id: "pitch-present",
    name: "Pitch Deck",
    type: "present",
    icon: icons.present,
    description: "Business ready",
  },
  {
    id: "blank-form",
    name: "Blank Form",
    type: "form",
    icon: icons.form,
    description: "Create a form",
  },
];

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success");
  const name = urlParams.get("name") || "User";

  if (!localStorage.getItem("lemhand_office_welcomed")) {
    showWelcomeVideo.value = true;
  }

  if (success === "true") {
    localStorage.setItem("lemhand_office_name", name);
    username.value = name;
    loginModal.value = false;
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (!username.value) {
    loginModal.value = true;
  }
  const stored = localStorage.getItem("lemhand_office_recents");
  if (stored) {
    recentDocs.value = JSON.parse(stored).sort(
      (a, b) => b.lastOpened - a.lastOpened,
    );
  }
  localStorage.removeItem("lemhand_standalone_app");
});

const filteredDocs = computed(() => {
  let docs = recentDocs.value;
  if (activeCategory.value !== "all") {
    docs = docs.filter((d) => d.type === activeCategory.value);
  }
  if (searchQuery.value) {
    docs = docs.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
  }
  return docs;
});

const createNew = async (template) => {
  if (!username.value) {
    loginModal.value = true;
    return;
  }
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

  // Basic content mapping for templates
  let initialData = { title: template.name, lastUpdated: new Date() };

  if (template.id === "resume-word") {
    initialData.content = `
      <h1 style="text-align:center;">YOUR NAME</h1>
      <p style="text-align:center; color:#666;">Software Engineer | city, State | email@example.com</p>
      <hr/>
      <h3>Experience</h3>
      <p><b>Company Name</b> | 2020 - Present</p>
      <ul><li>Key achievement or responsibility</li><li>Another significant impact</li></ul>
    `;
  } else if (template.id === "budget-sheets") {
    initialData.grid = Array(100)
      .fill()
      .map(() => Array(26).fill(""));
    initialData.grid[0][0] = "Category";
    initialData.grid[0][1] = "Planned";
    initialData.grid[0][2] = "Actual";
    initialData.grid[1][0] = "Housing";
    initialData.grid[2][0] = "Food";
  } else if (template.id === "pitch-present") {
    initialData.slides = [
      {
        id: 1,
        bgColor: "#ffffff",
        elements: [
          {
            id: "e1",
            type: "text",
            x: 192,
            y: 300,
            w: 1536,
            h: 200,
            content: "Company Mission",
            style: {
              fontSize: "80px",
              fontWeight: "bold",
              textAlign: "center",
            },
          },
        ],
      },
      {
        id: 2,
        bgColor: "#f3f2f1",
        elements: [
          {
            id: "e2",
            type: "text",
            x: 192,
            y: 200,
            w: 1536,
            h: 150,
            content: "The Problem",
            style: { fontSize: "64px", textAlign: "center" },
          },
        ],
      },
    ];
  } else if (template.id === "blank-form") {
    initialData.formFields = [];
    initialData.formResponses = [];
  }

  // Pre-save to firestore if it's a template
  if (
    template.id !== "blank-word" &&
    template.id !== "blank-sheets" &&
    template.id !== "blank-present" &&
    template.id !== "blank-form"
  ) {
    await setDoc(doc(db, "office", id), initialData);
  }

  router.push(`/office/${template.type}/${id}`);
};

const openDoc = (doc) => {
  if (!username.value) {
    loginModal.value = true;
    return;
  }
  router.push(`/office/${doc.type}/${doc.id}`);
};

const deleteDoc = async (e, id) => {
  e.stopPropagation();
  if (confirm("Delete this document permanently?")) {
    try {
      await firestoreDelete(doc(db, "office", id));
      recentDocs.value = recentDocs.value.filter((d) => d.id !== id);
      localStorage.setItem(
        "lemhand_office_recents",
        JSON.stringify(recentDocs.value),
      );
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
};

const formatDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return (
      "Today, " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const showAnimations = ref(
  localStorage.getItem("lemhand_office_animations") !== "false",
);
const searchOpen = ref(false);
const saveSettings = () => {
  localStorage.setItem("lemhand_office_animations", showAnimations.value);
  localStorage.setItem("lemhand_office_theme_color", customThemeColor.value);
};
</script>

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
    <!-- Welcome Video Loading Screen -->
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

    <!-- Login Modal Overlay -->
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

    <!-- Settings Modal -->
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

    <!-- Top Toolbar (Fixed) -->
    <!-- Rebuilt Toolbar using user-provided Vanilla Navigation -->
    <header
      id="navigation"
      class="p-navigation--sliding is-dark"
      :class="{ 'has-search-open': searchOpen }"
      :style="{ backgroundColor: customThemeColor }"
      style="flex-shrink: 0; z-index: 10"
    >
      <div class="p-navigation__row--25-75">
        <div class="p-navigation__banner">
          <div class="p-navigation__tagged-logo">
            <a class="p-navigation__link" href="#">
              <span class="p-navigation__logo-title">LemHand Office</span>
            </a>
          </div>
          <ul class="p-navigation__items">
            <li class="p-navigation__item">
              <button
                class="js-search-button p-navigation__link--search-toggle"
                @click="searchOpen = !searchOpen"
              >
                <span class="p-navigation__search-label">Search</span>
              </button>
            </li>
          </ul>
        </div>
        <nav class="p-navigation__nav" id="main-nav" aria-label="Example main">
          <ul
            class="p-navigation__items js-dropdown-nav-list js-navigation-sliding-panel"
          >
            <li
              class="p-navigation__item--dropdown-toggle js-navigation-dropdown-toggle"
              id="account-dropdown"
              :class="{ 'is-active': accountMenuOpen }"
              @click="accountMenuOpen = !accountMenuOpen"
            >
              <button
                class="p-navigation__link"
                style="
                  border: none;
                  background: transparent;
                  cursor: pointer;
                  color: inherit;
                "
              >
                {{ (username || "??").substring(0, 2).toUpperCase() }}
              </button>
              <ul
                class="p-navigation__dropdown js-dropdown-nav-list js-navigation-sliding-panel"
                id="account-menu"
                :aria-hidden="!accountMenuOpen"
              >
                <li
                  class="p-navigation__item--dropdown-close"
                  id="account-back"
                >
                  <button
                    class="p-navigation__link js-back-button"
                    @click.stop="accountMenuOpen = false"
                  >
                    Back
                  </button>
                </li>
                <li>
                  <a href="#" class="p-navigation__dropdown-item"
                    >Signed in as {{ username }}</a
                  >
                </li>
                <li>
                  <a
                    href="#"
                    class="p-navigation__dropdown-item"
                    @click.prevent="logout"
                    >Sign Out</a
                  >
                </li>
              </ul>
            </li>
          </ul>
          <ul class="p-navigation__items">
            <li class="p-navigation__item">
              <button
                class="js-search-button p-navigation__link--search-toggle"
                @click="searchOpen = !searchOpen"
              >
                <span class="p-navigation__search-label">Search</span>
              </button>
            </li>
          </ul>
          <div
            class="p-navigation__search"
            :class="{ 'is-active': searchOpen }"
          >
            <form class="p-search-box" @submit.prevent>
              <input
                type="search"
                class="p-search-box__input"
                name="q"
                v-model="searchQuery"
                placeholder="Search documents..."
                required=""
                aria-label="Search documents..."
              />
              <button
                type="reset"
                class="p-search-box__reset"
                @click="searchQuery = ''"
              >
                <i class="p-icon--close"></i>
              </button>
              <button type="submit" class="p-search-box__button">
                <i class="p-icon--search"></i>
              </button>
            </form>
          </div>
        </nav>
      </div>
      <div
        class="p-navigation__search-overlay"
        v-if="searchOpen"
        @click="searchOpen = false"
      ></div>
    </header>

    <!-- Main Body Area -->
    <div
      style="display: flex; flex-grow: 1; overflow: hidden; background: #f0f2f5"
    >
      <!-- Left Navbar (Fixed width, icons only) -->
      <nav
        :style="{ backgroundColor: customThemeColor }"
        style="
          width: 70px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 0;
          z-index: 5;
        "
      >
        <button
          class="p-button--base u-no-margin"
          style="
            padding: 10px;
            margin-bottom: 1rem;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
            color: white;
          "
          :style="{
            background:
              activeCategory === 'all'
                ? 'rgba(255,255,255,0.2)'
                : 'transparent',
          }"
          title="All Content"
          @click="activeCategory = 'all'"
        >
          <span v-html="uiIcons.home"></span>
        </button>

        <button
          class="p-button--base u-no-margin"
          style="
            padding: 10px;
            margin-bottom: 1rem;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
            color: white;
          "
          :style="{
            background:
              activeCategory === 'word'
                ? 'rgba(255,255,255,0.2)'
                : 'transparent',
          }"
          title="Word Docs"
          @click="activeCategory = 'word'"
        >
          <img src="/1.svg" alt="Word" style="width: 24px; height: 24px" />
        </button>

        <button
          class="p-button--base u-no-margin"
          style="
            padding: 10px;
            margin-bottom: 1rem;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
            color: white;
          "
          :style="{
            background:
              activeCategory === 'sheets'
                ? 'rgba(255,255,255,0.2)'
                : 'transparent',
          }"
          title="Spreadsheets"
          @click="activeCategory = 'sheets'"
        >
          <img src="/2.svg" alt="Sheets" style="width: 24px; height: 24px" />
        </button>

        <button
          class="p-button--base u-no-margin"
          style="
            padding: 10px;
            margin-bottom: 1rem;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
            color: white;
          "
          :style="{
            background:
              activeCategory === 'present'
                ? 'rgba(255,255,255,0.2)'
                : 'transparent',
          }"
          title="Presentations"
          @click="activeCategory = 'present'"
        >
          <img
            src="/3.svg"
            alt="Presentations"
            style="width: 24px; height: 24px"
          />
        </button>

        <button
          class="p-button--base u-no-margin"
          style="
            padding: 10px;
            margin-bottom: auto;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s;
            color: white;
          "
          :style="{
            background:
              activeCategory === 'form'
                ? 'rgba(255,255,255,0.2)'
                : 'transparent',
          }"
          title="Forms"
          @click="activeCategory = 'form'"
        >
          <!-- Placeholder Icon (Forms) -->
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path
              d="M8 8h8M8 12h8M8 16h5"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
        </button>

        <button
          class="p-button--base u-no-margin"
          style="
            padding: 10px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            color: white;
          "
          title="Settings"
          @click="settingsModalOpen = true"
        >
          <span v-html="uiIcons.settings"></span>
        </button>
      </nav>

      <!-- Scrollable Main Content -->
      <main style="flex-grow: 1; overflow-y: auto; padding: 2rem">
        <div style="max-width: 1200px; margin: 0 auto">
          <div
            v-if="isOfficeUnderConstruction"
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
              <h2>We are working on something new</h2>
              <p>
                LemHand Office is currently undergoing a major update. The
                individual office applications are temporarily unavailable as we
                push out these changes. Please check back later!
              </p>
            </div>
          </div>
          <template v-else>
            <section class="u-sv1">
              <h1>Welcome back to LemHand Office</h1>
              <p>Pick a template or start something new.</p>
            </section>

            <!-- Template Gallery -->
            <section class="u-sv2">
              <div class="row">
                <div class="col-12">
                  <h2>Create New</h2>
                </div>
              </div>
              <div class="row" style="display: flex; flex-wrap: wrap">
                <div
                  v-for="t in templates"
                  :key="t.id"
                  class="col-3"
                  style="display: flex; margin-bottom: 1rem"
                >
                  <div
                    class="p-card u-no-padding"
                    @click="createNew(t)"
                    style="
                      cursor: pointer;
                      width: 100%;
                      display: flex;
                      flex-direction: column;
                      margin-bottom: 0;
                    "
                  >
                    <div
                      class="p-card__inner"
                      style="
                        flex-grow: 1;
                        display: flex;
                        flex-direction: column;
                      "
                    >
                      <div
                        v-html="t.icon"
                        style="height: 48px; width: 48px; margin-bottom: 1rem"
                      ></div>
                      <h3 style="margin-top: 0">{{ t.name }}</h3>
                      <p style="margin-bottom: 0; margin-top: auto">
                        {{ t.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Recent Content -->
            <section class="u-sv2">
              <div class="row">
                <div class="col-12">
                  <h2>Recent Content</h2>
                </div>
              </div>

              <div v-if="filteredDocs.length === 0" class="row">
                <div class="col-12">
                  <div class="p-notification--information">
                    <div class="p-notification__content">
                      <p class="p-notification__message">
                        No documents found matching your criteria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="row">
                <div class="col-12">
                  <table class="p-table--mobile-card">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Last Opened</th>
                        <th class="u-align--right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="doc in filteredDocs"
                        :key="doc.id"
                        @click="openDoc(doc)"
                        style="cursor: pointer"
                      >
                        <td data-th="Name">
                          <div
                            style="
                              display: flex;
                              align-items: center;
                              gap: 10px;
                            "
                          >
                            <div
                              v-html="icons[doc.type]"
                              style="width: 24px; height: 24px"
                            ></div>
                            <div>
                              <strong>{{
                                doc.title || "Untitled Document"
                              }}</strong>
                              <br />
                              <small
                                >LemCloud • {{ doc.type.toUpperCase() }}</small
                              >
                            </div>
                          </div>
                        </td>
                        <td data-th="Last Opened">
                          {{ formatDate(doc.lastOpened) }}
                        </td>
                        <td data-th="Actions" class="u-align--right">
                          <button
                            @click.stop="deleteDoc($event, doc.id)"
                            class="p-button--negative"
                            style="padding: 0.25rem 0.5rem; font-size: 0.8rem"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </template>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-grow: 1;
  color: #202124;
  font-family: "Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 80px;
  border-right: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  flex-shrink: 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 20;
  color: white;
}
.logo-area {
  color: white;
  margin-bottom: 40px;
  cursor: pointer;
  transition: transform 0.2s;
}
.logo-area:hover {
  transform: scale(1.1);
}
.nav-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-grow: 1;
  align-items: center;
}
.nav-items button {
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 12px;
  font-weight: bold;
  color: white;
  opacity: 0.7;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-items button:hover,
.nav-items button.active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}
.nav-footer {
  margin-top: auto;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
}
.nav-footer:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

/* Main Content */
.main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 40px 40px 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  margin: 12px 12px 12px 0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.header-title-input {
  background: transparent;
  border: 1px solid transparent;
  color: white;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 2px;
}
.header-title-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}
.header-title-input:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}
/* Custom CSS removed to prevent conflicts with Vanilla Framework */

/* Modals */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.custom-modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: fadeInDown 0.3s ease;
}
.modal-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
  outline: none;
  font-size: 15px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.modal-input:focus {
  border-color: var(--theme-color);
}
.modal-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}
.modal-btn.primary {
  color: white;
}
.modal-btn.primary:hover {
  filter: brightness(1.1);
}
.modal-btn.secondary {
  background: #f0f2f5;
  color: #333;
}
.modal-btn.secondary:hover {
  background: #e4e6e9;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
