<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { db } from "../firebase";
import { doc, deleteDoc as firestoreDelete, setDoc } from "firebase/firestore";

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

const loginWithLemHand = () => {
  const lasUrl = new URL(window.location.origin + '/las/signin')
  lasUrl.searchParams.append('client_id', 'lemhand_office')
  lasUrl.searchParams.append('redirect_uri', window.location.href.split('?')[0])
  window.location.href = lasUrl.toString()
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
  word: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#2b579a"/><path d="M14 2V8H20L14 2Z" fill="#1e3a5f"/><text x="7" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">W</text></svg>`,
  sheets: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#217346"/><path d="M14 2V8H20L14 2Z" fill="#154a2d"/><text x="8" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">S</text></svg>`,
  present: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#d24726"/><path d="M14 2V8H20L14 2Z" fill="#a3361d"/><text x="8" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">P</text></svg>`,
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
  const success = urlParams.get('success');
  const name = urlParams.get('name') || 'User';

  if (success === 'true') {
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
    "
    :style="{ '--theme-color': customThemeColor }"
  >
    <!-- Login Modal Overlay -->
    <div v-if="loginModal" class="custom-modal-overlay" style="z-index: 99999">
      <div class="custom-modal" style="width: 380px; text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 16px;">
          <img src="/favicon.svg" alt="LemHand" style="width: 48px; height: 48px;" />
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
          <img src="/favicon.svg" alt="LemHand" style="width: 20px; height: 20px; filter: brightness(0) invert(1);" />
          Sign in with LemHand
        </button>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
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

    <!-- Exact Office Apps Toolbar -->
    <div
      style="
        background-color: var(--theme-color);
        color: white;
        padding: 4px 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        font-size: 12px;
        height: 32px;
      "
    >
      <!-- Left Section -->
      <div style="display: flex; align-items: center; gap: 15px; flex: 1"></div>

      <!-- Center Section: Search Bar -->
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            width: 400px;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 0 10px;
            height: 26px;
          "
        >
          <span
            v-html="uiIcons.search"
            style="
              opacity: 0.7;
              display: flex;
              align-items: center;
              transform: scale(0.85);
            "
          ></span>
          <input
            v-model="searchQuery"
            class="header-title-input"
            placeholder="Search your documents..."
            style="
              width: 100%;
              height: 100%;
              border: none;
              padding: 0;
              background: transparent;
            "
          />
        </div>
      </div>

      <!-- Right Section -->
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex: 1;
          position: relative;
        "
      >
        <div
          @click="accountMenuOpen = !accountMenuOpen"
          class="account-avatar"
          :title="username + ' (Account)'"
          style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
          "
        >
          {{ (username || "??").substring(0, 2).toUpperCase() }}
        </div>

        <div v-if="accountMenuOpen" class="account-menu">
          <div class="account-header">
            <div class="avatar large" style="background: var(--theme-color)">
              {{ username ? username.substring(0, 2).toUpperCase() : "??" }}
            </div>
            <div class="account-info">
              <strong>{{ username }}</strong>
              <span>LemHand Account</span>
            </div>
          </div>
          <button @click="logout" class="logout-btn">Sign Out</button>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <!-- Sidebar -->
      <nav class="sidebar" :style="{ background: customThemeColor }">
        <div class="logo-area">
          <svg
            viewBox="0 0 24 24"
            width="36"
            height="36"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div class="nav-items">
          <button
            @click="activeCategory = 'all'"
            :class="{ active: activeCategory === 'all' }"
            title="All Content"
            v-html="uiIcons.home"
          ></button>
          <button
            @click="activeCategory = 'word'"
            :class="{ active: activeCategory === 'word' }"
            title="Word Docs"
            style="font-size: 20px"
          >
            W
          </button>
          <button
            @click="activeCategory = 'sheets'"
            :class="{ active: activeCategory === 'sheets' }"
            title="Spreadsheets"
            style="font-size: 20px"
          >
            S
          </button>
          <button
            @click="activeCategory = 'present'"
            :class="{ active: activeCategory === 'present' }"
            title="Presentations"
            style="font-size: 20px"
          >
            P
          </button>
          <button
            @click="activeCategory = 'form'"
            :class="{ active: activeCategory === 'form' }"
            title="Forms"
            style="font-size: 20px"
          >
            F
          </button>
        </div>
        <div class="nav-footer">
          <button
            @click="settingsModalOpen = true"
            title="Settings"
            v-html="uiIcons.settings"
            style="
              background: transparent;
              border: none;
              color: white;
              cursor: pointer;
            "
          ></button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <section class="welcome-section">
          <h1>Welcome back to LemHand Office</h1>
          <p>Pick a template or start something new.</p>
        </section>

        <!-- Template Gallery -->
        <section class="template-section">
          <div class="section-header">
            <h2>Create New</h2>
            <button
              class="text-btn"
              @click="alert('Template gallery coming soon!')"
            >
              View all templates
            </button>
          </div>
          <div class="template-grid">
            <div
              v-for="t in templates"
              :key="t.id"
              class="template-card"
              @click="createNew(t)"
            >
              <div class="template-preview" v-html="t.icon"></div>
              <div class="template-info">
                <h3>{{ t.name }}</h3>
                <p>{{ t.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Recent Content -->
        <section class="recent-section">
          <div class="section-header">
            <h2>Recent Content</h2>
          </div>

          <div v-if="filteredDocs.length === 0" class="empty-state">
            <p>No documents found matching your criteria.</p>
          </div>

          <div v-else class="content-table">
            <div class="table-header">
              <span class="col-name">Name</span>
              <span class="col-date">Last Opened</span>
              <span class="col-actions"></span>
            </div>
            <div
              v-for="doc in filteredDocs"
              :key="doc.id"
              class="table-row"
              @click="openDoc(doc)"
            >
              <div class="col-name">
                <div
                  class="doc-icon"
                  :class="doc.type"
                  v-html="icons[doc.type]"
                ></div>
                <div class="doc-meta">
                  <span class="title">{{
                    doc.title || "Untitled Document"
                  }}</span>
                  <span class="subtitle"
                    >LemCloud • {{ doc.type.toUpperCase() }}</span
                  >
                </div>
              </div>
              <div class="col-date">{{ formatDate(doc.lastOpened) }}</div>
              <div class="col-actions">
                <button
                  @click="deleteDoc($event, doc.id)"
                  class="delete-btn"
                  title="Delete Permanent"
                  v-html="uiIcons.delete"
                ></button>
              </div>
            </div>
          </div>
        </section>
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
.header-title-input:focus {
  background: white;
  color: black;
  outline: none;
}

.account-avatar:hover {
  background: rgba(0, 0, 0, 0.3) !important;
}

.user-profile {
  position: relative;
}
.account-menu {
  position: absolute;
  top: 32px;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 250px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 100;
  animation: fadeInDown 0.2s ease;
  color: #202124;
}
.account-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.avatar {
  width: 40px;
  height: 40px;
  background: var(--theme-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}
.avatar.large {
  width: 52px;
  height: 52px;
  font-size: 20px;
  cursor: default;
}
.account-info {
  display: flex;
  flex-direction: column;
}
.account-info strong {
  font-size: 15px;
  color: #202124;
  margin-bottom: 2px;
}
.account-info span {
  font-size: 12px;
  color: #5f6368;
}
.logout-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #333;
  transition: all 0.2s;
}
.logout-btn:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.welcome-section {
  margin: 40px 0;
  animation: fadeInDown 0.5s ease;
}
.welcome-section h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.welcome-section p {
  color: #5f6368;
  font-size: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h2 {
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  color: #5f6368;
  letter-spacing: 0.5px;
}
.text-btn {
  background: none;
  border: none;
  color: var(--theme-color);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.text-btn:hover {
  opacity: 0.8;
}

/* Template Grid */
.template-grid {
  display: flex;
  gap: 24px;
  margin-bottom: 48px;
  overflow-x: auto;
  padding: 10px 10px 20px 10px;
  margin-left: -10px;
}
.template-card {
  width: 180px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.template-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}
.template-preview {
  height: 130px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  padding: 24px;
  border-radius: 12px 12px 0 0;
}
.template-info {
  padding: 16px;
}
.template-info h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #202124;
}
.template-info p {
  font-size: 12px;
  color: #5f6368;
}

/* Table View */
.content-table {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.table-header {
  display: grid;
  grid-template-columns: 1fr 200px 80px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 13px;
  color: #5f6368;
  font-weight: 700;
  text-transform: uppercase;
  background: #fafafa;
}
.table-row {
  display: grid;
  grid-template-columns: 1fr 200px 80px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}
.table-row:hover {
  background: #f8f9fa;
}
.table-row:last-child {
  border-bottom: none;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 16px;
}
.doc-icon {
  width: 36px;
  height: 36px;
  transition: transform 0.2s;
}
.table-row:hover .doc-icon {
  transform: scale(1.1);
}
.doc-meta {
  display: flex;
  flex-direction: column;
}
.doc-meta .title {
  font-size: 15px;
  font-weight: 600;
  color: #202124;
}
.doc-meta .subtitle {
  font-size: 12px;
  color: #5f6368;
  margin-top: 4px;
  font-weight: 500;
}

.col-date {
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s,
    color 0.2s;
  padding: 8px;
  font-size: 18px;
}
.table-row:hover .delete-btn {
  opacity: 0.5;
}
.delete-btn:hover {
  opacity: 1 !important;
  color: #ea4335;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #5f6368;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.empty-state p {
  font-size: 16px;
  margin-bottom: 10px;
}

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
