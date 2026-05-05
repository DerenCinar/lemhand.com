<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, deleteDoc as firestoreDelete } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const documentTitle = ref('Untitled Presentation')
const activeTab = ref('Home')
const zoom = ref(0.5)
const isRibbonVisible = ref(true)
const isCloudSaving = ref(false)

const slides = ref([
  { 
    id: 1, 
    bgColor: '#ffffff', 
    transition: 'fade',
    aspectRatio: '16/9',
    notes: '',
    elements: [
      { id: 'e1', type: 'text', x: 192, y: 216, w: 1536, h: 216, content: 'Welcome to LemPresent', animation: 'fade-in', style: { color: '#d24726', fontSize: '80px', fontWeight: 'bold', textAlign: 'center' } },
      { id: 'e2', type: 'text', x: 384, y: 540, w: 1152, h: 108, content: 'Create professional presentations in real-time.', animation: 'slide-up', style: { color: '#333', fontSize: '32px', textAlign: 'center' } }
    ]
  }
])

const activeSlideIndex = ref(0)
const selectedElementId = ref(null)
const isPresenting = ref(false)
const showNotes = ref(false)
const activeMenu = ref(null)
const contextMenu = ref({ visible: false, x: 0, y: 0 })
const username = ref('Anonymous')
const avatars = ref([])

let clientId = localStorage.getItem('lemhand_office_client_id')
if (!clientId) {
  clientId = Date.now().toString(36) + Math.random().toString(36).substr(2)
  localStorage.setItem('lemhand_office_client_id', clientId)
}
const myUserObj = { id: clientId, name: '' }

const isShareOpen = ref(false)
const shareLink = ref('')
const copyStatus = ref('')
let saveTimeout = null
let isUpdatingFromServer = false
let unsubscribe = null

const showAnimations = localStorage.getItem('lemhand_office_animations') !== 'false';
const isLoading = ref(showAnimations);
let isDataLoaded = false;
let isMinTimePassed = !showAnimations;

if (showAnimations) {
  setTimeout(() => {
    isMinTimePassed = true;
    if (isDataLoaded) isLoading.value = false;
  }, 1500);
}

const handleUnload = () => {
  setDoc(doc(db, 'office', docId), {
    activeUsers: arrayRemove(myUserObj)
  }, { merge: true }).catch(() => {})
}

onMounted(() => {
  let storedName = localStorage.getItem('lemhand_office_name')
  if (!storedName) {
    storedName = prompt("Enter your name to join this presentation:") || "Anonymous"
    localStorage.setItem('lemhand_office_name', storedName)
  }
  username.value = storedName
  myUserObj.name = storedName

  saveToRecents()

  const docRef = doc(db, 'office', docId)
  setDoc(docRef, { activeUsers: arrayUnion(myUserObj) }, { merge: true })
  window.addEventListener('beforeunload', handleUnload)

  unsubscribe = onSnapshot(docRef, (docSnap) => {
    isDataLoaded = true;
    if (isMinTimePassed) isLoading.value = false;
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.title) {
        documentTitle.value = data.title
        saveToRecents()
      }
      
      if (data.activeUsers) {
        avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      }

      if (data.slides && !isUpdatingFromServer) {
        isUpdatingFromServer = true
        slides.value = data.slides
        if (activeSlideIndex.value >= slides.value.length) {
          activeSlideIndex.value = slides.value.length - 1
        }
        setTimeout(() => { isUpdatingFromServer = false }, 100)
      }
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  window.removeEventListener('beforeunload', handleUnload)
  handleUnload()
})

const saveToRecents = () => {
  let recents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
  recents = recents.filter(d => d.id !== docId)
  recents.push({ id: docId, type: 'present', title: documentTitle.value, lastOpened: Date.now() })
  localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
}

const saveToCloud = () => {
  if (isUpdatingFromServer) return;
  isCloudSaving.value = true;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), {
        title: documentTitle.value,
        slides: slides.value,
        lastUpdated: new Date()
      }, { merge: true })
      saveToRecents()
      isCloudSaving.value = false;
    } catch (e) {
      console.error("Error saving:", e)
      isCloudSaving.value = false;
    }
  }, 1000);
}

watch(documentTitle, saveToCloud)
watch(slides, saveToCloud, { deep: true })

const deletePresentation = async () => {
  if (confirm('Are you sure you want to PERMANENTLY delete this presentation? This cannot be undone.')) {
    try {
      await firestoreDelete(doc(db, 'office', docId))
      let recents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
      recents = recents.filter(d => d.id !== docId)
      localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
      router.push('/office')
    } catch (e) {
      alert('Error deleting: ' + e.message)
    }
  }
}

const isDragging = ref(false)
const isResizing = ref(false)
const dragStart = { x: 0, y: 0 }
const initialPos = { x: 0, y: 0, w: 0, h: 0 }
const resizeHandle = ref(null)

const selectElement = (id) => {
  selectedElementId.value = id
}

const addElement = (type) => {
  const newEl = {
    id: 'e' + Date.now(),
    type: type,
    x: 400,
    y: 300,
    w: type === 'image' ? 600 : 800,
    h: type === 'image' ? 400 : 150,
    content: type === 'text' ? 'New Text Box' : (type === 'image' ? 'https://via.placeholder.com/600x400' : ''),
    animation: 'none',
    style: {
      color: '#333',
      fontSize: '24px',
      backgroundColor: type === 'shape' ? '#d24726' : 'transparent',
      borderRadius: type === 'shape' ? '8px' : '0',
      textAlign: 'center'
    }
  }
  slides.value[activeSlideIndex.value].elements.push(newEl)
  selectedElementId.value = newEl.id
}

const updateElementPos = (e) => {
  if (!isDragging.value && !isResizing.value) return
  const slideRect = document.querySelector('.slide-canvas').getBoundingClientRect()
  const scale = 1920 / slideRect.width
  const dx = (e.clientX - dragStart.x) * scale
  const dy = (e.clientY - dragStart.y) * scale
  const el = slides.value[activeSlideIndex.value].elements.find(el => el.id === selectedElementId.value)
  if (!el) return
  if (isDragging.value) {
    el.x = Math.max(0, Math.min(1920 - el.w, initialPos.x + dx))
    el.y = Math.max(0, Math.min(1080 - el.h, initialPos.y + dy))
  } else if (isResizing.value) {
    const h = resizeHandle.value
    if (h.includes('e')) el.w = Math.max(50, initialPos.w + dx)
    if (h.includes('s')) el.h = Math.max(50, initialPos.h + dy)
    if (h.includes('w')) {
      const newW = Math.max(50, initialPos.w - dx)
      el.x = Math.max(0, initialPos.x + (initialPos.w - newW))
      el.w = newW
    }
    if (h.includes('n')) {
      const newH = Math.max(50, initialPos.h - dy)
      el.y = Math.max(0, initialPos.y + (initialPos.h - newH))
      el.h = newH
    }
  }
}

const startDrag = (e, id) => {
  if (isPresenting.value) return
  selectedElementId.value = id; isDragging.value = true; dragStart.x = e.clientX; dragStart.y = e.clientY
  const el = slides.value[activeSlideIndex.value].elements.find(el => el.id === id)
  initialPos.x = el.x; initialPos.y = el.y
  window.addEventListener('mousemove', updateElementPos); window.addEventListener('mouseup', stopInteraction)
}

const startResize = (e, id, handle) => {
  e.stopPropagation(); selectedElementId.value = id; isResizing.value = true; resizeHandle.value = handle
  dragStart.x = e.clientX; dragStart.y = e.clientY
  const el = slides.value[activeSlideIndex.value].elements.find(el => el.id === id)
  initialPos.x = el.x; initialPos.y = el.y; initialPos.w = el.w; initialPos.h = el.h
  window.addEventListener('mousemove', updateElementPos); window.addEventListener('mouseup', stopInteraction)
}

const stopInteraction = () => {
  isDragging.value = false; isResizing.value = false
  window.removeEventListener('mousemove', updateElementPos); window.removeEventListener('mouseup', stopInteraction)
}

const addSlide = () => {
  slides.value.push({
    id: Date.now(), bgColor: '#ffffff', transition: 'fade', aspectRatio: slides.value[activeSlideIndex.value].aspectRatio, notes: '',
    elements: [{ id: 't' + Date.now(), type: 'text', x: 192, y: 216, w: 1536, h: 162, content: 'New Slide Title', animation: 'fade-in', style: { color: '#d24726', fontSize: '64px', fontWeight: 'bold', textAlign: 'center' } }]
  })
  activeSlideIndex.value = slides.value.length - 1
}

const selectSlide = (index) => { activeSlideIndex.value = index; selectedElementId.value = null }
const deleteSlide = (index) => {
  if (slides.value.length > 1) {
    slides.value.splice(index, 1)
    if (activeSlideIndex.value >= slides.value.length) activeSlideIndex.value = slides.value.length - 1
  }
}

const togglePresent = () => {
  isPresenting.value = !isPresenting.value
  if (isPresenting.value) {
    selectedElementId.value = null
    document.documentElement.requestFullscreen().catch(() => {})
  } else if (document.fullscreenElement) document.exitFullscreen()
}

const nextSlide = () => {
  if (activeSlideIndex.value < slides.value.length - 1) activeSlideIndex.value++
  else if (isPresenting.value) togglePresent()
}

const prevSlide = () => { if (activeSlideIndex.value > 0) activeSlideIndex.value-- }

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      slides.value[activeSlideIndex.value].elements.push({ id: 'img' + Date.now(), type: 'image', x: 480, y: 270, w: 960, h: 540, content: event.target.result, animation: 'scale-up', style: {} })
    }
    reader.readAsDataURL(file)
  }
}

const setAspectRatio = (ratio) => slides.value.forEach(s => s.aspectRatio = ratio)

const applyTheme = (theme) => {
  const themes = { modern: { bg: '#ffffff', text: '#333333', primary: '#d24726' }, dark: { bg: '#1e1e1e', text: '#ffffff', primary: '#0078d4' }, nature: { bg: '#f0f4f0', text: '#2d4d2d', primary: '#107c41' }, corporate: { bg: '#f3f2f1', text: '#323130', primary: '#2b579a' } }
  const t = themes[theme]; const slide = slides.value[activeSlideIndex.value]
  slide.bgColor = t.bg; slide.elements.forEach(el => { if (el.type === 'text') el.style.color = t.text; if (el.id.startsWith('t')) el.style.color = t.primary })
}

const downloadPPT = () => {
  let content = slides.value.map(s => {
    const els = s.elements.map(el => `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;">${el.content}</div>`).join('')
    return `<div style="background:${s.bgColor};position:relative;width:1920px;height:1080px;page-break-after:always;">${els}</div>`
  }).join('');
  const htmlContent = `<html><body style="margin:0;">${content}</body></html>`;
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `${documentTitle.value}.ppt`; a.click();
}

const openShare = () => { shareLink.value = window.location.href; isShareOpen.value = true; }
const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    copyStatus.value = 'Copied!';
    setTimeout(() => { copyStatus.value = ''; }, 3000);
  });
}
</script>

<template>
  <div v-if="isLoading" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background:#f3f2f1; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
    <svg width="150" height="120" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="90" height="70" rx="4" fill="white" stroke="#d24726" stroke-width="4"/>
      <path class="slide-line" d="M 15 20 L 50 20" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
      <path class="slide-line" d="M 15 40 L 85 40" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <div style="position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; color: #d24726; font-weight: bold; font-size: 1.2rem;">
      LemHand Office
      <span style="font-size: 0.9rem; font-weight: normal; margin-top: 5px;">Loading LemPresent...</span>
    </div>
  </div>

  <div v-if="isPresenting" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: black; z-index: 9999; display: flex; align-items: center; justify-content: center;" @click="nextSlide">
    <div :style="{ backgroundColor: slides[activeSlideIndex].bgColor, aspectRatio: slides[activeSlideIndex].aspectRatio }" style="width: 100vw; height: 100vh; position: relative; overflow: hidden;">
      <div :style="{ width: '1920px', height: '1080px', backgroundColor: slides[activeSlideIndex].bgColor, transform: `scale(${Math.min(window.innerWidth/1920, window.innerHeight/1080)})`, transformOrigin: 'center center', position: 'absolute' }">
        <div v-for="el in slides[activeSlideIndex].elements" :key="el.id" :class="['animated-el', el.animation]" :style="{ position: 'absolute', left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px', ...el.style, backgroundImage: el.type === 'image' ? `url(${el.content})` : 'none', backgroundSize: 'cover' }">
          <template v-if="el.type === 'text'">{{ el.content }}</template>
        </div>
      </div>
    </div>
  </div>

  <div v-else style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    <!-- Top Header -->
    <div style="background-color: #d24726; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
      <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
        <RouterLink to="/office" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">P</RouterLink>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        <button @click="saveToCloud" class="quick-btn">💾</button>
        <button @click="togglePresent" class="quick-btn">▶</button>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        
        <input v-model="documentTitle" class="header-title-input" placeholder="Presentation title...">
        
        <span v-if="isCloudSaving" style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saving...</span>
        <span v-else style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saved to LemCloud</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button @click="openShare" style="background: white; color: #d24726; padding: 2px 12px; border-radius: 2px; border: none; font-weight: 600; font-size: 11px; cursor: pointer;">Share</button>
        <div style="display: flex; align-items: center;">
          <div :title="username + ' (You)'" style="width: 24px; height: 24px; border-radius: 50%; background: #0078d4; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; z-index: 10;">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :title="avatar" :style="{ background: ['#107c41', '#2b579a', '#8764b8', '#c239b3'][idx % 4] }" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-left: -8px; z-index: 5;">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- Ribbon Tabs -->
    <div style="background: #f3f2f1; display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0;">
      <div v-for="tab in ['File', 'Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View']" :key="tab" 
           @click="activeTab = tab" 
           class="ribbon-tab" :class="{ active: activeTab === tab }">
        {{ tab }}
      </div>
    </div>

    <!-- Ribbon Panel -->
    <div class="ribbon-panel" :class="{ hidden: !isRibbonVisible }">
      <template v-if="activeTab === 'Home'">
        <div class="ribbon-group">
          <button @click="addSlide" class="big-ribbon-btn">➕ New Slide</button>
          <label>Slides</label>
        </div>
        <div class="ribbon-group">
           <div v-if="selectedElementId" style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; gap: 2px;">
                <select v-model="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.fontSize" class="ribbon-select">
                  <option value="12px">12</option><option value="24px">24</option><option value="48px">48</option><option value="80px">80</option>
                </select>
              </div>
              <div style="display: flex; gap: 2px;">
                <button @click="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.fontWeight = 'bold'" class="small-ribbon-btn">B</button>
                <input type="color" v-model="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.color" style="width: 20px; height: 20px;">
              </div>
           </div>
           <label>Font</label>
        </div>
        <div class="ribbon-group">
           <div style="display: flex; gap: 4px;">
              <button @click="addElement('text')" class="small-ribbon-btn">T Box</button>
              <button @click="addElement('shape')" class="small-ribbon-btn">Shape</button>
           </div>
           <label>Drawing</label>
        </div>
      </template>
      <template v-if="activeTab === 'Slide Show'">
         <div class="ribbon-group">
            <button @click="activeSlideIndex = 0; togglePresent()" class="big-ribbon-btn">🎬 Beginning</button>
            <button @click="togglePresent" class="big-ribbon-btn">📽 Current</button>
            <label>Start</label>
         </div>
      </template>
      <template v-if="activeTab === 'File'">
        <div class="ribbon-group">
          <button @click="downloadPPT" class="big-ribbon-btn">📥 Download PPT</button>
          <button @click="deletePresentation" class="big-ribbon-btn" style="color: #d13438;">🗑 Delete</button>
          <label>Actions</label>
        </div>
      </template>
    </div>

    <!-- Workspace -->
    <div style="display: flex; flex-grow: 1; overflow: hidden;">
      <!-- Sidebar -->
      <div style="width: 180px; background: #fff; border-right: 1px solid #e1dfdd; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px;">
        <div v-for="(slide, index) in slides" :key="slide.id" @click="selectSlide(index)"
             :style="{ borderColor: activeSlideIndex === index ? '#d24726' : 'transparent', backgroundColor: slide.bgColor }"
             style="border: 2px solid; border-radius: 2px; cursor: pointer; aspect-ratio: 16/9; position: relative; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
           <div style="position: absolute; top: 2px; left: 4px; font-size: 10px; font-weight: bold; color: #666;">{{ index + 1 }}</div>
        </div>
        <button @click="addSlide" style="padding: 10px; border: 1px dashed #ccc; background: transparent; cursor: pointer; color: #666;">+ Add Slide</button>
      </div>

      <!-- Canvas Area -->
      <div style="flex-grow: 1; display: flex; justify-content: center; align-items: center; background: #e1dfdd; overflow: auto; padding: 50px;">
        <div class="slide-canvas" :style="{ width: '1920px', height: '1080px', backgroundColor: slides[activeSlideIndex].bgColor, transform: `scale(${zoom})`, transformOrigin: 'center center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }" style="position: relative; flex-shrink: 0;">
          <div v-for="el in slides[activeSlideIndex].elements" :key="el.id" class="slide-element" @mousedown.stop="startDrag($event, el.id)"
               :style="{ position: 'absolute', left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px', outline: selectedElementId === el.id ? '4px solid #0078d4' : 'none', ...el.style, backgroundImage: el.type === 'image' ? `url(${el.content})` : 'none', backgroundSize: 'cover' }">
             <template v-if="el.type === 'text'">
                <textarea v-model="el.content" style="width: 100%; height: 100%; background: transparent; border: none; outline: none; color: inherit; font: inherit; resize: none; text-align: inherit;"></textarea>
             </template>
             <template v-if="selectedElementId === el.id">
                <div class="resize-handle se" @mousedown.stop="startResize($event, el.id, 'se')"></div>
             </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div style="background: #d24726; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
      <div>Slide {{ activeSlideIndex + 1 }} of {{ slides.length }} | English (US)</div>
      <div style="display: flex; gap: 15px; align-items: center;">
         <input type="range" v-model="zoom" min="0.1" max="1" step="0.05" style="width: 100px;">
         <span>{{ Math.round(zoom * 100) }}% | LemCloud {{ isCloudSaving ? 'Syncing...' : 'Connected' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-btn { background: transparent; border: none; color: white; padding: 4px 8px; cursor: pointer; border-radius: 2px; }
.quick-btn:hover { background: rgba(255,255,255,0.2); }

.header-title-input { background: transparent; border: 1px solid transparent; color: white; font-weight: 600; font-size: 12px; padding: 2px 8px; border-radius: 2px; outline: none; width: 250px; }
.header-title-input:hover { background: rgba(255,255,255,0.1); }
.header-title-input:focus { background: white; color: #d24726; }

.ribbon-tab { padding: 6px 12px; font-size: 11px; color: #333; cursor: pointer; border-bottom: 3px solid transparent; }
.ribbon-tab:hover { background: #e1dfdd; }
.ribbon-tab.active { border-bottom-color: #d24726; font-weight: 600; background: #fff; }

.ribbon-panel { background: #fff; height: 90px; display: flex; padding: 5px 10px; gap: 15px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; position: relative; }
.ribbon-panel.hidden { height: 0; padding: 0; overflow: hidden; }

.ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid #f3f2f1; padding-right: 15px; height: 100%; min-width: max-content; }
.ribbon-group label { font-size: 9px; color: #666; margin-top: auto; text-transform: uppercase; padding-top: 5px; }

.big-ribbon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; gap: 2px; }
.big-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }

.small-ribbon-btn { background: transparent; border: 1px solid transparent; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 11px; }
.small-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }

.resize-handle.se { position: absolute; bottom: -6px; right: -6px; width: 12px; height: 12px; background: white; border: 2px solid #0078d4; cursor: se-resize; z-index: 5; }

.animated-el { transition: all 0.8s ease-out; }
.fade-in { animation: fadeIn 0.8s forwards; }
.slide-up { animation: slideUp 0.8s forwards; }
.scale-up { animation: scaleUp 0.8s forwards; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
</style>
