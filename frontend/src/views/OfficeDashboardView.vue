<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const recentDocs = ref([])

onMounted(() => {
  const stored = localStorage.getItem('lemhand_office_recents')
  if (stored) {
    recentDocs.value = JSON.parse(stored).sort((a, b) => b.lastOpened - a.lastOpened)
  }
})

const createNew = (type) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  router.push(`/office/${type}/${id}`)
}

const openDoc = (doc) => {
  router.push(`/office/${doc.type}/${doc.id}`)
}

const formatDate = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const showAnimations = ref(localStorage.getItem('lemhand_office_animations') !== 'false')
const saveSettings = () => {
  localStorage.setItem('lemhand_office_animations', showAnimations.value)
}
</script>

<template>
  <main style="padding: 60px 5%; min-height: 80vh; background-color: var(--bg-color); color: var(--text-color); position: relative;">
    
    <!-- Settings Toggle -->
    <div style="position: absolute; top: 20px; right: 20px; display: flex; align-items: center; gap: 10px;">
      <label style="font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 5px; opacity: 0.8;">
        <input type="checkbox" v-model="showAnimations" @change="saveSettings">
        Show Loading Animations
      </label>
    </div>

    <div style="max-width: 1000px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 50px; display: flex; flex-direction: column; align-items: center; gap: 15px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #d24726;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <h1 style="font-size: 2.5rem; font-weight: 600; margin-bottom: 5px;">LemHand Office</h1>
        <p style="font-size: 1.1rem; opacity: 0.8;">Create, collaborate, and bring your ideas to life with LemCloud.</p>
      </div>

      <h2 style="font-size: 1.5rem; margin-bottom: 20px; font-weight: 600; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">Create New</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 50px;">
        <div @click="createNew('word')" class="ms-card" style="cursor: pointer; text-decoration: none;">
          <div style="height: 150px; background-color: #2b579a; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 4rem; color: white; font-weight: 700;">W</span>
          </div>
          <div class="ms-card-body">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #2b579a; margin-bottom: 10px;">LemWord</h2>
            <p style="color: #666;">Create professional documents, letters, and reports.</p>
          </div>
        </div>

        <div @click="createNew('sheets')" class="ms-card" style="cursor: pointer; text-decoration: none;">
          <div style="height: 150px; background-color: #217346; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 4rem; color: white; font-weight: 700;">S</span>
          </div>
          <div class="ms-card-body">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #217346; margin-bottom: 10px;">LemSheet</h2>
            <p style="color: #666;">Analyze data and create powerful spreadsheets.</p>
          </div>
        </div>

        <div @click="createNew('present')" class="ms-card" style="cursor: pointer; text-decoration: none;">
          <div style="height: 150px; background-color: #d24726; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 4rem; color: white; font-weight: 700;">P</span>
          </div>
          <div class="ms-card-body">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #d24726; margin-bottom: 10px;">LemPresent</h2>
            <p style="color: #666;">Design captivating slide decks and presentations.</p>
          </div>
        </div>
      </div>

      <h2 style="font-size: 1.5rem; margin-bottom: 20px; font-weight: 600; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">Recent Documents</h2>
      <div v-if="recentDocs.length === 0" style="text-align: center; padding: 40px; color: var(--text-color); opacity: 0.7; background: var(--nav-bg); border-radius: 8px;">
        <p>You haven't opened any documents yet.</p>
      </div>
      <div v-else style="display: flex; flex-direction: column; gap: 10px;">
        <div v-for="doc in recentDocs" :key="doc.id" @click="openDoc(doc)" style="display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; background: var(--nav-bg); border-radius: 8px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.filter='brightness(0.95)'" onmouseout="this.style.filter='none'">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div :style="{ background: doc.type === 'word' ? '#2b579a' : doc.type === 'sheets' ? '#217346' : '#d24726' }" style="color: white; width: 40px; height: 40px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
              {{ doc.type === 'word' ? 'W' : doc.type === 'sheets' ? 'S' : 'P' }}
            </div>
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0;">{{ doc.title || 'Untitled Document' }}</h3>
              <span style="font-size: 0.85rem; opacity: 0.7; text-transform: capitalize;">{{ doc.type }} Document</span>
            </div>
          </div>
          <div style="font-size: 0.9rem; opacity: 0.7;">
            Opened: {{ formatDate(doc.lastOpened) }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
