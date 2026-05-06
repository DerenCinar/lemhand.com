<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase'
import { doc, deleteDoc as firestoreDelete, setDoc } from 'firebase/firestore'

const router = useRouter()
const recentDocs = ref([])
const searchQuery = ref('')

const icons = {
  present: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#d24726"/><path d="M14 2V8H20L14 2Z" fill="#a3361d"/><text x="8" y="18" fill="white" font-size="10" font-weight="bold" font-family="Arial">P</text></svg>`
}

const templates = [
  { id: 'blank-present', name: 'Blank Presentation', type: 'present', icon: icons.present, description: 'Start from scratch' },
  { id: 'pitch-present', name: 'Pitch Deck', type: 'present', icon: icons.present, description: 'Business ready' },
  { id: 'photo-present', name: 'Photo Album', type: 'present', icon: icons.present, description: 'Showcase photos' }
]

onMounted(() => {
  const stored = localStorage.getItem('lemhand_office_recents')
  if (stored) {
    // Only fetch present documents
    recentDocs.value = JSON.parse(stored)
      .filter(d => d.type === 'present')
      .sort((a, b) => b.lastOpened - a.lastOpened)
  }
  // Store local flag so the editor knows where to return
  localStorage.setItem('lemhand_standalone_app', 'present')
})

const filteredDocs = computed(() => {
  let docs = recentDocs.value
  if (searchQuery.value) {
    docs = docs.filter(d => d.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  return docs
})

const createNew = async (template) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  let initialData = { title: template.name, lastUpdated: new Date() }
  
  if (template.id === 'pitch-present') {
    initialData.slides = [
      { id: 1, bgColor: '#ffffff', elements: [{ id: 'e1', type: 'text', x: 192, y: 300, w: 1536, h: 200, content: 'Company Mission', style: { fontSize: '80px', fontWeight: 'bold', textAlign: 'center' } }] },
      { id: 2, bgColor: '#f3f2f1', elements: [{ id: 'e2', type: 'text', x: 192, y: 200, w: 1536, h: 150, content: 'The Problem', style: { fontSize: '64px', textAlign: 'center' } }] }
    ]
  } else if (template.id === 'photo-present') {
    initialData.slides = [
      { id: 1, bgColor: '#222222', elements: [{ id: 'e1', type: 'text', x: 192, y: 800, w: 1536, h: 100, content: 'Summer Vacation 2026', style: { fontSize: '60px', color: '#ffffff', textAlign: 'center' } }] }
    ]
  }

  if (template.id !== 'blank-present') {
     await setDoc(doc(db, 'office', id), initialData)
  }
  router.push(`/office/present/${id}`)
}

const openDoc = (doc) => { router.push(`/office/present/${doc.id}`) }
const deleteDoc = async (e, id) => {
  e.stopPropagation()
  if (confirm('Delete this document permanently?')) {
    try {
      await firestoreDelete(doc(db, 'office', id))
      recentDocs.value = recentDocs.value.filter(d => d.id !== id)
      let allRecents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
      allRecents = allRecents.filter(d => d.id !== id)
      localStorage.setItem('lemhand_office_recents', JSON.stringify(allRecents))
    } catch (err) { alert('Error: ' + err.message) }
  }
}

const formatDate = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today, ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="app-dashboard present-theme">
    <nav class="sidebar">
      <div class="logo-area" v-html="icons.present" style="width: 48px; height: 48px;"></div>
      <div class="nav-items">
        <button class="active" title="Home">🏠</button>
        <button title="New" @click="createNew(templates[0])">➕</button>
        <button title="Open">📁</button>
      </div>
    </nav>

    <main class="main-content">
      <header class="top-bar">
        <h2>LemPresent</h2>
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="searchQuery" placeholder="Search your presentations...">
        </div>
      </header>

      <section class="welcome-section">
        <h1>Create Presentation</h1>
      </section>

      <section class="template-section">
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

      <section class="recent-section">
        <h2>Recent</h2>
        <div v-if="filteredDocs.length === 0" class="empty-state">No recent presentations.</div>
        <div v-else class="content-table">
          <div class="table-header">
            <span class="col-name">Name</span>
            <span class="col-date">Last Opened</span>
            <span class="col-actions"></span>
          </div>
          <div v-for="doc in filteredDocs" :key="doc.id" class="table-row" @click="openDoc(doc)">
            <div class="col-name">
              <div class="doc-icon" v-html="icons.present"></div>
              <span class="title">{{ doc.title || 'Untitled Presentation' }}</span>
            </div>
            <div class="col-date">{{ formatDate(doc.lastOpened) }}</div>
            <div class="col-actions"><button @click="deleteDoc($event, doc.id)" class="delete-btn">🗑️</button></div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-dashboard { display: flex; height: 100vh; background: #f3f2f1; color: #323130; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
.present-theme .sidebar { background: #d24726; color: white; border-right: none; }
.present-theme .sidebar .nav-items button { color: white; opacity: 0.7; }
.present-theme .sidebar .nav-items button.active, .present-theme .sidebar .nav-items button:hover { opacity: 1; background: rgba(255,255,255,0.1); }
.present-theme .top-bar h2 { color: #d24726; font-weight: 700; margin: 0; }
.present-theme .template-card:hover { border-color: #d24726; box-shadow: 0 4px 12px rgba(210,71,38,0.15); transform: translateY(-4px); }

.sidebar { width: 72px; display: flex; flex-direction: column; align-items: center; padding: 20px 0; flex-shrink: 0; }
.nav-items { display: flex; flex-direction: column; gap: 15px; width: 100%; align-items: center; margin-top: 30px; }
.nav-items button { width: 48px; height: 48px; border: none; background: transparent; cursor: pointer; border-radius: 8px; font-size: 18px; transition: all 0.2s; }

.main-content { flex-grow: 1; overflow-y: auto; padding: 0 40px 40px 40px; background: white; margin: 10px 10px 10px 0; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }

.top-bar { height: 72px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #edebe9; margin-bottom: 30px; position: sticky; top: 0; background: white; z-index: 10; }
.search-wrap { display: flex; align-items: center; background: #f3f2f1; border-radius: 20px; padding: 0 15px; width: 300px; height: 36px; }
.search-wrap input { border: none; outline: none; padding: 0 10px; background: transparent; flex-grow: 1; font-size: 14px; }

.welcome-section h1 { font-size: 28px; font-weight: 600; margin-bottom: 20px; }

.template-grid { display: flex; gap: 20px; margin-bottom: 40px; overflow-x: auto; padding-bottom: 10px; }
.template-card { width: 160px; background: #fff; border: 1px solid #edebe9; border-radius: 8px; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
.template-preview { height: 120px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #edebe9; padding: 20px; border-radius: 8px 8px 0 0; }
.template-info { padding: 12px; }
.template-info h3 { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.template-info p { font-size: 11px; color: #605e5c; }

.recent-section h2 { font-size: 18px; margin-bottom: 15px; font-weight: 600; }
.content-table { border: 1px solid #edebe9; border-radius: 8px; overflow: hidden; }
.table-header, .table-row { display: grid; grid-template-columns: 1fr 200px 50px; padding: 12px 20px; align-items: center; }
.table-header { background: #f9f9f9; border-bottom: 1px solid #edebe9; font-size: 12px; color: #605e5c; font-weight: 600; text-transform: uppercase; }
.table-row { border-bottom: 1px solid #f3f2f1; cursor: pointer; transition: background 0.2s; }
.table-row:hover { background: #f9f9f9; }
.col-name { display: flex; align-items: center; gap: 15px; font-size: 14px; font-weight: 500; }
.doc-icon { width: 24px; height: 24px; }
.col-date { font-size: 13px; color: #605e5c; }
.delete-btn { background: none; border: none; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
.table-row:hover .delete-btn { opacity: 0.6; }
.delete-btn:hover { opacity: 1 !important; color: #d13438; }
.empty-state { padding: 40px; text-align: center; color: #605e5c; background: #f9f9f9; border-radius: 8px; border: 1px dashed #ccc; }
</style>
