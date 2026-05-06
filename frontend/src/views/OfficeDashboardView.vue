<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, deleteDoc as firestoreDelete, setDoc } from 'firebase/firestore'

const router = useRouter()
const recentDocs = ref([])
const activeCategory = ref('all')
const searchQuery = ref('')

const icons = {
  word: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#2b579a"/><path d="M14 2V8H20L14 2Z" fill="#1e3a5f"/><text x="7" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">W</text></svg>`,
  sheets: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#217346"/><path d="M14 2V8H20L14 2Z" fill="#154a2d"/><text x="8" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">S</text></svg>`,
  present: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#d24726"/><path d="M14 2V8H20L14 2Z" fill="#a3361d"/><text x="8" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">P</text></svg>`
}

const templates = [
  { id: 'blank-word', name: 'Blank Document', type: 'word', icon: icons.word, description: 'Start from scratch' },
  { id: 'resume-word', name: 'Modern Resume', type: 'word', icon: icons.word, description: 'Professional layout' },
  { id: 'blank-sheets', name: 'Blank Spreadsheet', type: 'sheets', icon: icons.sheets, description: 'New data sheet' },
  { id: 'budget-sheets', name: 'Monthly Budget', type: 'sheets', icon: icons.sheets, description: 'Track expenses' },
  { id: 'blank-present', name: 'Blank Presentation', type: 'present', icon: icons.present, description: 'New slide deck' },
  { id: 'pitch-present', name: 'Pitch Deck', type: 'present', icon: icons.present, description: 'Business ready' },
]

onMounted(() => {
  const stored = localStorage.getItem('lemhand_office_recents')
  if (stored) {
    recentDocs.value = JSON.parse(stored).sort((a, b) => b.lastOpened - a.lastOpened)
  }
  localStorage.removeItem('lemhand_standalone_app')
})

const filteredDocs = computed(() => {
  let docs = recentDocs.value
  if (activeCategory.value !== 'all') {
    docs = docs.filter(d => d.type === activeCategory.value)
  }
  if (searchQuery.value) {
    docs = docs.filter(d => d.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  return docs
})

const createNew = async (template) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  
  // Basic content mapping for templates
  let initialData = { title: template.name, lastUpdated: new Date() }
  
  if (template.id === 'resume-word') {
    initialData.content = `
      <h1 style="text-align:center;">YOUR NAME</h1>
      <p style="text-align:center; color:#666;">Software Engineer | city, State | email@example.com</p>
      <hr/>
      <h3>Experience</h3>
      <p><b>Company Name</b> | 2020 - Present</p>
      <ul><li>Key achievement or responsibility</li><li>Another significant impact</li></ul>
    `
  } else if (template.id === 'budget-sheets') {
    initialData.grid = Array(100).fill().map(() => Array(26).fill(''))
    initialData.grid[0][0] = 'Category'; initialData.grid[0][1] = 'Planned'; initialData.grid[0][2] = 'Actual';
    initialData.grid[1][0] = 'Housing'; initialData.grid[2][0] = 'Food';
  } else if (template.id === 'pitch-present') {
    initialData.slides = [
      { id: 1, bgColor: '#ffffff', elements: [{ id: 'e1', type: 'text', x: 192, y: 300, w: 1536, h: 200, content: 'Company Mission', style: { fontSize: '80px', fontWeight: 'bold', textAlign: 'center' } }] },
      { id: 2, bgColor: '#f3f2f1', elements: [{ id: 'e2', type: 'text', x: 192, y: 200, w: 1536, h: 150, content: 'The Problem', style: { fontSize: '64px', textAlign: 'center' } }] }
    ]
  }

  // Pre-save to firestore if it's a template
  if (template.id !== 'blank-word' && template.id !== 'blank-sheets' && template.id !== 'blank-present') {
     await setDoc(doc(db, 'office', id), initialData)
  }

  router.push(`/office/${template.type}/${id}`)
}

const openDoc = (doc) => {
  router.push(`/office/${doc.type}/${doc.id}`)
}

const deleteDoc = async (e, id) => {
  e.stopPropagation()
  if (confirm('Delete this document permanently?')) {
    try {
      await firestoreDelete(doc(db, 'office', id))
      recentDocs.value = recentDocs.value.filter(d => d.id !== id)
      localStorage.setItem('lemhand_office_recents', JSON.stringify(recentDocs.value))
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today, ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const showAnimations = ref(localStorage.getItem('lemhand_office_animations') !== 'false')
const saveSettings = () => { localStorage.setItem('lemhand_office_animations', showAnimations.value) }
</script>

<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="logo-area">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      </div>
      <div class="nav-items">
        <button @click="activeCategory = 'all'" :class="{active: activeCategory === 'all'}" title="All Content">🏠</button>
        <button @click="activeCategory = 'word'" :class="{active: activeCategory === 'word'}" title="Word Docs">W</button>
        <button @click="activeCategory = 'sheets'" :class="{active: activeCategory === 'sheets'}" title="Spreadsheets">S</button>
        <button @click="activeCategory = 'present'" :class="{active: activeCategory === 'present'}" title="Presentations">P</button>
      </div>
      <div class="nav-footer">
        <label title="Settings">
          ⚙️
          <input type="checkbox" v-model="showAnimations" @change="saveSettings" style="display: none;">
        </label>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-bar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="searchQuery" placeholder="Search your documents...">
        </div>
        <div class="user-profile">
          <div class="avatar">LH</div>
        </div>
      </header>

      <section class="welcome-section">
        <h1>Welcome back to LemHand Office</h1>
        <p>Pick a template or start something new.</p>
      </section>

      <!-- Template Gallery -->
      <section class="template-section">
        <div class="section-header">
          <h2>Create New</h2>
          <button class="text-btn">View all templates</button>
        </div>
        <div class="template-grid">
          <div v-for="t in templates" :key="t.id" class="template-card" @click="createNew(t)">
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
          <div v-for="doc in filteredDocs" :key="doc.id" class="table-row" @click="openDoc(doc)">
            <div class="col-name">
              <div class="doc-icon" :class="doc.type" v-html="icons[doc.type]"></div>
              <div class="doc-meta">
                <span class="title">{{ doc.title || 'Untitled Document' }}</span>
                <span class="subtitle">LemCloud • {{ doc.type.toUpperCase() }}</span>
              </div>
            </div>
            <div class="col-date">{{ formatDate(doc.lastOpened) }}</div>
            <div class="col-actions">
              <button @click="deleteDoc($event, doc.id)" class="delete-btn" title="Delete Permanent">🗑️</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
  color: #202124;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 72px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  flex-shrink: 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.02);
}
.logo-area { color: #d24726; margin-bottom: 40px; cursor: pointer; transition: transform 0.2s; }
.logo-area:hover { transform: scale(1.1); }
.nav-items { display: flex; flex-direction: column; gap: 20px; flex-grow: 1; }
.nav-items button {
  width: 48px; height: 48px; border: none; background: transparent;
  cursor: pointer; border-radius: 12px; font-weight: bold; color: #5f6368;
  font-size: 16px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.nav-items button:hover { background: #f1f3f4; color: #202124; transform: translateY(-2px); }
.nav-items button.active { background: #e8f0fe; color: #1a73e8; box-shadow: 0 4px 12px rgba(26,115,232,0.15); }
.nav-footer { margin-top: auto; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
.nav-footer:hover { opacity: 1; }

/* Main Content */
.main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 40px 40px 40px;
}

.top-bar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  background: rgba(240, 242, 245, 0.9);
  backdrop-filter: blur(8px);
  z-index: 10;
  padding-top: 10px;
}
.search-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 24px;
  padding: 0 16px;
  width: 480px;
  height: 44px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}
.search-wrap:focus-within { border-color: #1a73e8; box-shadow: 0 4px 12px rgba(26,115,232,0.1); width: 500px; }
.search-wrap input {
  border: none; outline: none; padding: 0 12px; flex-grow: 1; font-size: 15px; color: #202124;
}
.avatar {
  width: 40px; height: 40px; background: linear-gradient(135deg, #1a73e8, #0d47a1); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; box-shadow: 0 4px 10px rgba(26,115,232,0.3);
  cursor: pointer; transition: transform 0.2s;
}
.avatar:hover { transform: scale(1.05); }

.welcome-section { margin: 40px 0; animation: fadeInDown 0.5s ease; }
.welcome-section h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.5px; }
.welcome-section p { color: #5f6368; font-size: 16px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; color: #5f6368; letter-spacing: 0.5px; }
.text-btn { background: none; border: none; color: #1a73e8; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.text-btn:hover { opacity: 0.8; }

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
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.template-card:hover { transform: translateY(-6px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: transparent; }
.template-preview {
  height: 130px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  padding: 24px;
  border-radius: 12px 12px 0 0;
}
.template-info { padding: 16px; }
.template-info h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #202124; }
.template-info p { font-size: 12px; color: #5f6368; }

/* Table View */
.content-table { background: #fff; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden; }
.table-header {
  display: grid;
  grid-template-columns: 1fr 200px 80px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
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
  border-bottom: 1px solid rgba(0,0,0,0.03);
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}
.table-row:hover { background: #f8f9fa; }
.table-row:last-child { border-bottom: none; }

.col-name { display: flex; align-items: center; gap: 16px; }
.doc-icon { width: 36px; height: 36px; transition: transform 0.2s; }
.table-row:hover .doc-icon { transform: scale(1.1); }
.doc-meta { display: flex; flex-direction: column; }
.doc-meta .title { font-size: 15px; font-weight: 600; color: #202124; }
.doc-meta .subtitle { font-size: 12px; color: #5f6368; margin-top: 4px; font-weight: 500; }

.col-date { font-size: 14px; color: #5f6368; font-weight: 500; }
.delete-btn {
  background: none; border: none; cursor: pointer; opacity: 0; transition: opacity 0.2s, color 0.2s; padding: 8px; font-size: 18px;
}
.table-row:hover .delete-btn { opacity: 0.5; }
.delete-btn:hover { opacity: 1 !important; color: #ea4335; }

.empty-state { text-align: center; padding: 80px 20px; color: #5f6368; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.empty-state p { font-size: 16px; margin-bottom: 10px; }

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
