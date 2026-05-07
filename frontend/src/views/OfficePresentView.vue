<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, deleteDoc as firestoreDelete } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import JSZip from 'jszip'
import pptxgen from 'pptxgenjs'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const documentTitle = ref('Untitled Presentation')
const activeTab = ref('Home')
const zoom = ref(0.4)
const isRibbonVisible = ref(true)
const isCloudSaving = ref(false)
const showGrid = ref(false)
const spellcheckEnabled = ref(true)
const originalFormat = ref('')

const returnPath = computed(() => {
  const app = localStorage.getItem('lemhand_standalone_app')
  return app === 'present' ? '/app/present' : '/office'
})

// Custom Modal State
const modal = ref({ visible: false, title: '', message: '', type: 'alert', inputValue: '', onConfirm: null })
const showModal = (title, message, type = 'alert', onConfirm = null, defaultValue = '') => {
  modal.value = { visible: true, title, message, type, onConfirm, inputValue: defaultValue }
}
const closeModal = () => { modal.value.visible = false }
const confirmModal = () => {
  if (modal.value.onConfirm) modal.value.onConfirm(modal.value.inputValue)
  closeModal()
}

const toggleSpellcheck = () => {
  spellcheckEnabled.value = !spellcheckEnabled.value;
  saveToCloud(); // Save preference if needed, or just keep local
  showModal('Spell Check', spellcheckEnabled.value ? 'Spell check enabled for text boxes.' : 'Spell check disabled.')
}

const icons = {
  save: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17,3H5C3.89,3 3,3.9 3,5V19C3,20.1 3.89,21 5,21H19C20.1,21 21,20.1 21,19V7L17,3M12,19C10.34,19 9,17.66 9,16C9,14.34 10.34,13 12,13C13.66,13 15,14.34 15,16C15,17.66 13.66,19 12,19M15,9H5V5H15V9Z"/></svg>`,
  play: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8,5.14V19.14L19,12.14L8,5.14Z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>`,
  image: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,5V19H5V5H19Z"/></svg>`,
  shape: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19,3H5C3.89,3 3,3.89 3,5V19C3,20.1 3.89,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/></svg>`,
  ppt: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>`,
  font: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.62,12L12,5.67L14.38,12H9.62M11,3L5.5,17H7.75L8.87,14H15.12L16.25,17H18.5L13,3H11Z"/></svg>`
}

const slides = ref([
  { id: 1, bgColor: '#ffffff', transition: 'fade', aspectRatio: '16/9', elements: [
    { id: 'e1', type: 'text', x: 192, y: 300, w: 1536, h: 200, content: 'Welcome to LemPresent', animation: 'fade-in', style: { color: '#d24726', fontSize: '80px', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial' } },
    { id: 'e2', type: 'text', x: 192, y: 550, w: 1536, h: 100, content: 'Subtitle goes here', animation: 'slide-up', style: { color: '#333', fontSize: '32px', textAlign: 'center', fontFamily: 'Arial' } }
  ]}
])

const activeSlideIndex = ref(0)
const selectedElementId = ref(null)
const isPresenting = ref(false)
const username = ref('Anonymous')
const avatars = ref([])

const windowWidth = ref(window.innerWidth); const windowHeight = ref(window.innerHeight)
const updateWindowSize = () => { windowWidth.value = window.innerWidth; windowHeight.value = window.innerHeight }

let clientId = localStorage.getItem('lemhand_office_client_id')
if (!clientId) { clientId = Date.now().toString(36) + Math.random().toString(36).substr(2); localStorage.setItem('lemhand_office_client_id', clientId) }
const myUserObj = { id: clientId, name: '' }

let saveTimeout = null; let isUpdatingFromServer = false; let unsubscribe = null
const showAnimations = localStorage.getItem('lemhand_office_animations') !== 'false'
const isLoading = ref(showAnimations); let isDataLoaded = false; let isMinTimePassed = !showAnimations

if (showAnimations) { setTimeout(() => { isMinTimePassed = true; if (isDataLoaded) isLoading.value = false }, 1500) }

const handleUnload = () => { setDoc(doc(db, 'office', docId), { activeUsers: arrayRemove(myUserObj) }, { merge: true }).catch(() => {}) }

onMounted(() => {
  let storedName = localStorage.getItem('lemhand_office_name')
  if (!storedName) {
    showModal("Welcome", "Enter your name:", "prompt", (val) => {
      const name = val || "Anonymous"; localStorage.setItem('lemhand_office_name', name)
      username.value = name; myUserObj.name = name; updateUserPresence()
    })
  } else { username.value = storedName; myUserObj.name = storedName; updateUserPresence() }

  saveToRecents()
  const docRef = doc(db, 'office', docId)
  window.addEventListener('beforeunload', handleUnload); window.addEventListener('resize', updateWindowSize)

  unsubscribe = onSnapshot(docRef, (docSnap) => {
    isDataLoaded = true; if (isMinTimePassed) isLoading.value = false
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.title) { documentTitle.value = data.title; saveToRecents() }
      if (data.activeUsers) avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      if (data.slides && !isUpdatingFromServer) {
        isUpdatingFromServer = true; slides.value = data.slides
        if (activeSlideIndex.value >= slides.value.length) activeSlideIndex.value = slides.value.length - 1
        setTimeout(() => { isUpdatingFromServer = false }, 100)
      }
      if (data.originalFormat) {
        originalFormat.value = data.originalFormat
      }
    }
  })
})

const updateUserPresence = () => { setDoc(doc(db, 'office', docId), { activeUsers: arrayUnion(myUserObj) }, { merge: true }) }
onUnmounted(() => { if (unsubscribe) unsubscribe(); window.removeEventListener('beforeunload', handleUnload); window.removeEventListener('resize', updateWindowSize); handleUnload() })

const saveToRecents = () => {
  let recents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
  recents = recents.filter(d => d.id !== docId); recents.push({ id: docId, type: 'present', title: documentTitle.value, lastOpened: Date.now() })
  localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
}

const saveToCloud = () => {
  if (isUpdatingFromServer) return; isCloudSaving.value = true; clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), { title: documentTitle.value, slides: slides.value, originalFormat: originalFormat.value, lastUpdated: new Date() }, { merge: true })
      saveToRecents(); isCloudSaving.value = false
    } catch (e) { isCloudSaving.value = false }
  }, 1000)
}

watch(documentTitle, saveToCloud); watch(slides, saveToCloud, { deep: true })

const addElement = (type, shapeType = 'rectangle') => {
  const newEl = { 
    id: 'e' + Date.now(), 
    type, 
    shapeType,
    x: 400, y: 300, 
    w: type === 'image' ? 600 : (type === 'shape' ? 400 : 800), 
    h: type === 'image' ? 400 : (type === 'shape' ? 400 : 150), 
    content: type === 'text' ? 'New Text' : (type === 'image' ? 'https://picsum.photos/600/400' : ''), 
    animation: 'none', 
    style: { 
      color: '#333', 
      fontSize: '32px', 
      textAlign: 'center', 
      fontFamily: 'Arial',
      backgroundColor: type === 'shape' ? '#d24726' : 'transparent',
      borderRadius: shapeType === 'circle' ? '50%' : '0',
      clipPath: shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
    } 
  }
  slides.value[activeSlideIndex.value].elements.push(newEl); selectedElementId.value = newEl.id
}

const updateElementPos = (e) => {
  if (!isDragging.value && !isResizing.value) return
  const slideRect = document.querySelector('.slide-canvas').getBoundingClientRect()
  const scale = 1920 / slideRect.width
  const dx = (e.clientX - dragStart.x) * scale; const dy = (e.clientY - dragStart.y) * scale
  const el = slides.value[activeSlideIndex.value].elements.find(el => el.id === selectedElementId.value)
  if (!el) return
  if (isDragging.value) { el.x = Math.max(0, Math.min(1920 - el.w, initialPos.x + dx)); el.y = Math.max(0, Math.min(1080 - el.h, initialPos.y + dy)) }
  else if (isResizing.value) { if (resizeHandle.value === 'se') { el.w = Math.max(50, initialPos.w + dx); el.h = Math.max(50, initialPos.h + dy) } }
}

const isDragging = ref(false); const isResizing = ref(false); const dragStart = { x: 0, y: 0 }; const initialPos = { x: 0, y: 0, w: 0, h: 0 }; const resizeHandle = ref(null)
const startDrag = (e, id) => {
  if (isPresenting.value) return; selectedElementId.value = id; isDragging.value = true; dragStart.x = e.clientX; dragStart.y = e.clientY
  const el = slides.value[activeSlideIndex.value].elements.find(el => el.id === id); initialPos.x = el.x; initialPos.y = el.y
  window.addEventListener('mousemove', updateElementPos); window.addEventListener('mouseup', stopInteraction)
}
const startResize = (e, id, handle) => {
  e.stopPropagation(); selectedElementId.value = id; isResizing.value = true; resizeHandle.value = handle; dragStart.x = e.clientX; dragStart.y = e.clientY
  const el = slides.value[activeSlideIndex.value].elements.find(el => el.id === id); initialPos.w = el.w; initialPos.h = el.h
  window.addEventListener('mousemove', updateElementPos); window.addEventListener('mouseup', stopInteraction)
}
const stopInteraction = () => { isDragging.value = false; isResizing.value = false; window.removeEventListener('mousemove', updateElementPos); window.removeEventListener('mouseup', stopInteraction) }

const applyTheme = (theme) => {
  const themes = { modern: { bg: '#ffffff', text: '#333333', primary: '#d24726' }, dark: { bg: '#1e1e1e', text: '#ffffff', primary: '#0078d4' }, corporate: { bg: '#f3f2f1', text: '#323130', primary: '#2b579a' }, nature: { bg: '#f0f4f0', text: '#2d4d2d', primary: '#107c41' } }
  const t = themes[theme]; const slide = slides.value[activeSlideIndex.value]
  slide.bgColor = t.bg; slide.elements.forEach(el => { if (el.type === 'text') el.style.color = t.text; if (el.id.startsWith('t')) el.style.color = t.primary })
}

const togglePresent = () => {
  isPresenting.value = !isPresenting.value
  if (isPresenting.value) { selectedElementId.value = null; document.documentElement.requestFullscreen().catch(() => {}) }
  else if (document.fullscreenElement) document.exitFullscreen()
}

const addSlide = () => {
  slides.value.push({ id: Date.now(), bgColor: '#ffffff', transition: 'fade', aspectRatio: '16/9', elements: [{ id: 't' + Date.now(), type: 'text', x: 192, y: 300, w: 1536, h: 200, content: 'New Slide', style: { color: '#d24726', fontSize: '64px', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial' } }] })
  activeSlideIndex.value = slides.value.length - 1
}

const deletePresentation = async () => {
  showModal("Delete", "Permanently delete this presentation?", "confirm", async (c) => {
    if (c) { await firestoreDelete(doc(db, 'office', docId)); router.push('/office') }
  })
}

const downloadPPT = () => {
  const pres = new pptxgen()
  pres.title = documentTitle.value
  slides.value.forEach(slide => {
    const s = pres.addSlide()
    s.background = { color: slide.bgColor.replace('#', '') }
    slide.elements.forEach(el => {
      // Very rough mapping of coordinates for PPTXGenJS (it uses inches, approx 1 inch = 100px for 1920x1080 -> 10x5.625 inches)
      const opts = { x: el.x/192, y: el.y/192, w: el.w/192, h: el.h/192, fontSize: parseInt(el.style.fontSize) || 14, color: el.style.color.replace('#','') }
      if (el.type === 'text') s.addText(el.content, opts)
      if (el.type === 'shape') s.addShape(pres.ShapeType.rect, { ...opts, fill: { color: el.style.backgroundColor.replace('#','') }})
    })
  })
  pres.writeFile({ fileName: `${documentTitle.value}.pptx` })
}

const uploadPPTX = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pptx'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const zip = await JSZip.loadAsync(arrayBuffer)
        const newSlides = []
        // Extract basic text from slide XMLs
        const slideFiles = Object.keys(zip.files).filter(k => k.match(/^ppt\/slides\/slide\d+\.xml$/)).sort()
        for (let i = 0; i < slideFiles.length; i++) {
          const slideXml = await zip.file(slideFiles[i]).async("text")
          const texts = [...slideXml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map(m => m[1])
          const elements = texts.map((t, idx) => ({
            id: 'e' + Date.now() + idx,
            type: 'text',
            shapeType: 'rectangle',
            x: 100, y: 100 + (idx * 60),
            w: 1200, h: 50,
            content: t,
            animation: 'none',
            style: { color: '#333', fontSize: '32px', textAlign: 'left', fontFamily: 'Arial', backgroundColor: 'transparent', borderRadius: '0', clipPath: 'none' }
          }))
          newSlides.push({
            id: Date.now() + i,
            bgColor: '#ffffff',
            transition: 'fade',
            aspectRatio: '16/9',
            elements
          })
        }
        if (newSlides.length > 0) {
          slides.value = newSlides
          activeSlideIndex.value = 0
          originalFormat.value = 'pptx'
          saveToCloud()
        } else {
          showModal("Warning", "No text found in PPTX.")
        }
      } catch (err) {
        showModal("Error", "Could not parse presentation: " + err.message)
      }
    }
  }
  input.click()
}

const isShareOpen = ref(false); const shareLink = ref(''); const copyStatus = ref('')
const openShare = () => { shareLink.value = window.location.href; isShareOpen.value = true }
const copyLink = () => { navigator.clipboard.writeText(shareLink.value).then(() => { copyStatus.value = 'Copied!'; setTimeout(() => copyStatus.value = '', 3000) }) }

// Context Menu
const contextMenu = ref({ visible: false, x: 0, y: 0, elementId: null })
const openContextMenu = (e, id) => { e.preventDefault(); contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, elementId: id }; selectedElementId.value = id }
const closeContextMenu = () => { contextMenu.value.visible = false }

onMounted(() => {
  window.addEventListener('click', closeContextMenu)
})
onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
})

const deleteElement = () => {
  if (!contextMenu.value.elementId) return
  const slide = slides.value[activeSlideIndex.value]
  slide.elements = slide.elements.filter(e => e.id !== contextMenu.value.elementId)
  selectedElementId.value = null
  saveToCloud()
}

const bringToFront = () => {
  if (!contextMenu.value.elementId) return
  const slide = slides.value[activeSlideIndex.value]
  const idx = slide.elements.findIndex(e => e.id === contextMenu.value.elementId)
  if (idx !== -1) {
    const el = slide.elements.splice(idx, 1)[0]
    slide.elements.push(el)
    saveToCloud()
  }
}

const sendToBack = () => {
  if (!contextMenu.value.elementId) return
  const slide = slides.value[activeSlideIndex.value]
  const idx = slide.elements.findIndex(e => e.id === contextMenu.value.elementId)
  if (idx !== -1) {
    const el = slide.elements.splice(idx, 1)[0]
    slide.elements.unshift(el)
    saveToCloud()
  }
}

const flipHorizontal = () => {
  if (!contextMenu.value.elementId) return
  const el = slides.value[activeSlideIndex.value].elements.find(e => e.id === contextMenu.value.elementId)
  if (el) { el.style.transform = el.style.transform === 'scaleX(-1)' ? 'none' : 'scaleX(-1)'; saveToCloud() }
}

const flipVertical = () => {
  if (!contextMenu.value.elementId) return
  const el = slides.value[activeSlideIndex.value].elements.find(e => e.id === contextMenu.value.elementId)
  if (el) { el.style.transform = el.style.transform === 'scaleY(-1)' ? 'none' : 'scaleY(-1)'; saveToCloud() }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    
    <!-- Modals -->
    <div v-if="modal.visible" class="custom-modal-overlay">
      <div class="custom-modal">
        <h3 style="color: #d24726;">{{ modal.title }}</h3>
        <p>{{ modal.message }}</p>
        <input v-if="modal.type === 'prompt'" v-model="modal.inputValue" type="text" class="modal-input" @keyup.enter="confirmModal" autofocus>
        <div class="modal-actions">
          <button v-if="modal.type !== 'alert'" @click="closeModal" class="modal-btn secondary">Cancel</button>
          <button @click="confirmModal" class="modal-btn primary" style="background: #d24726;">OK</button>
        </div>
      </div>
    </div>

    <!-- Presentation Mode -->
    <div v-if="isPresenting" class="presentation-mode" @click="activeSlideIndex < slides.length - 1 ? activeSlideIndex++ : togglePresent()">
      <div class="presentation-canvas-container" :style="{ backgroundColor: slides[activeSlideIndex].bgColor }">
        <div class="presentation-scaler" :style="{ transform: `scale(${Math.min(windowWidth/1920, windowHeight/1080)})` }">
          <div class="slide-canvas-real" :style="{ backgroundColor: slides[activeSlideIndex].bgColor }">
            <div v-for="el in slides[activeSlideIndex].elements" :key="el.id" :class="['animated-el', el.animation]" :style="{ position: 'absolute', left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px', ...el.style, backgroundImage: el.type === 'image' ? `url(${el.content})` : 'none', backgroundSize: 'cover' }">
              <template v-if="el.type === 'text'">{{ el.content }}</template>
              <div v-if="el.type === 'shape'" style="width: 100%; height: 100%;"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="presentation-controls">
        <button @click.stop="activeSlideIndex > 0 && activeSlideIndex--">◀</button>
        <span>{{ activeSlideIndex + 1 }} / {{ slides.length }}</span>
        <button @click.stop="activeSlideIndex < slides.length - 1 ? activeSlideIndex++ : togglePresent()">▶</button>
        <button @click.stop="togglePresent" class="exit-btn">Exit</button>
      </div>
    </div>

    <!-- Edit Mode -->
    <template v-else>
      <!-- Header -->
      <div style="background-color: #d24726; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
        <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
          <RouterLink :to="returnPath" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">P</RouterLink>
          <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
          <button @click="saveToCloud" class="quick-btn" v-html="icons.save"></button>
          <button @click="togglePresent" class="quick-btn" v-html="icons.play"></button>
          <input v-model="documentTitle" class="header-title-input" placeholder="Presentation title...">
          <div v-if="originalFormat" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-left: 5px; color: white;">.{{ originalFormat }}</div>
          <span style="font-size: 10px; opacity: 0.7; margin-left: 10px;">{{ isCloudSaving ? 'Saving...' : 'Saved to LemCloud' }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button @click="openShare" class="share-header-btn">Share</button>
          <div class="avatar-stack">
            <div class="avatar me">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
            <div v-for="(avatar, idx) in avatars" :key="idx" class="avatar other" :style="{ background: ['#107c41', '#2b579a', '#8764b8', '#c239b3'][idx % 4] }">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
          </div>
        </div>
      </div>

      <!-- Ribbon Tabs -->
      <div class="ribbon-tabs">
        <div v-for="tab in ['Home', 'Insert', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View', 'Help', 'File']" :key="tab" @click="activeTab = tab" class="ribbon-tab" :class="{ active: activeTab === tab }">{{ tab }}</div>
      </div>

      <!-- Ribbon Panel -->
      <div class="ribbon-panel">
        <template v-if="activeTab === 'Home'">
          <div class="ribbon-group">
            <button @click="addSlide" class="big-ribbon-btn" v-html="icons.plus + '<span>New Slide</span>'"></button>
            <label>Slides</label>
          </div>
          <div class="ribbon-group">
            <div v-if="selectedElementId" style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; gap: 4px;">
                <select v-model="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.fontFamily" class="ribbon-select" style="width: 90px;">
                  <option v-for="f in ['Arial','Times New Roman','Courier New','Georgia','Verdana','Inter','Roboto','Outfit','Comic Sans MS','Impact','Trebuchet MS','Tahoma']" :key="f" :value="f">{{ f }}</option>
                </select>
                <select v-model="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.fontSize" class="ribbon-select">
                  <option v-for="s in ['12px','24px','32px','48px','64px','80px','120px']" :key="s" :value="s">{{ s.replace('px','') }}</option>
                </select>
              </div>
              <div style="display: flex; gap: 4px;">
                <button @click="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.fontWeight = 'bold'" class="small-ribbon-btn">B</button>
                <button @click="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.textAlign = 'left'" class="small-ribbon-btn">L</button>
                <button @click="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.textAlign = 'center'" class="small-ribbon-btn">C</button>
                <input type="color" v-model="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.color" title="Text Color">
                <input type="color" v-model="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).style.backgroundColor" title="Shape/Background Color">
              </div>
            </div>
            <div v-else style="font-size:10px; color:#999; padding:10px;">Select item to style</div>
            <label>Font & Style</label>
          </div>
          <div class="ribbon-group">
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <button @click="addElement('text')" class="small-ribbon-btn">Text</button>
                <button @click="addElement('shape', 'rectangle')" class="small-ribbon-btn">Rect</button>
                <button @click="addElement('shape', 'circle')" class="small-ribbon-btn">Circle</button>
                <button @click="addElement('shape', 'triangle')" class="small-ribbon-btn">Tri</button>
             </div>
             <label>Drawing</label>
          </div>
        </template>

        <template v-if="activeTab === 'Insert'">
          <div class="ribbon-group">
            <button @click="addSlide" class="big-ribbon-btn" v-html="icons.plus + '<span>New Slide</span>'"></button>
            <label>Slides</label>
          </div>
          <div class="ribbon-group">
            <div style="display: flex; gap: 8px;">
              <button @click="addElement('image')" class="big-ribbon-btn" v-html="icons.image + '<span>Picture</span>'"></button>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <button @click="addElement('shape', 'rectangle')" class="small-ribbon-btn" style="text-align: left;">Rectangle</button>
                <button @click="addElement('shape', 'circle')" class="small-ribbon-btn" style="text-align: left;">Circle</button>
                <button @click="addElement('shape', 'triangle')" class="small-ribbon-btn" style="text-align: left;">Triangle</button>
              </div>
            </div>
            <label>Illustrations</label>
          </div>
        </template>

        <template v-if="activeTab === 'Design'">
          <div class="ribbon-group">
            <div style="display: flex; gap: 8px;">
              <div @click="applyTheme('modern')" class="theme-mini" style="background:#fff; border:1px solid #ccc;"></div>
              <div @click="applyTheme('dark')" class="theme-mini" style="background:#1e1e1e;"></div>
              <div @click="applyTheme('corporate')" class="theme-mini" style="background:#f3f2f1; border:1px solid #2b579a;"></div>
              <div @click="applyTheme('nature')" class="theme-mini" style="background:#f0f4f0; border:1px solid #107c41;"></div>
            </div>
            <label>Themes</label>
          </div>
          <div class="ribbon-group">
            <input type="color" v-model="slides[activeSlideIndex].bgColor" style="height:30px;">
            <label>Background</label>
          </div>
        </template>

        <template v-if="activeTab === 'Transitions'">
          <div class="ribbon-group">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <button v-for="t in ['none','fade','slide','push','wipe']" :key="t" @click="slides[activeSlideIndex].transition = t" class="small-ribbon-btn" style="font-size:9px;">{{ t }}</button>
            </div>
            <label>Transition</label>
          </div>
        </template>

        <template v-if="activeTab === 'Animations'">
          <div class="ribbon-group">
            <div v-if="selectedElementId" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <button v-for="a in ['none','fade-in','slide-up','scale-up','rotate-in']" :key="a" @click="slides[activeSlideIndex].elements.find(el => el.id === selectedElementId).animation = a" class="small-ribbon-btn" style="font-size:9px;">{{ a.replace('-in','').replace('-up','') }}</button>
            </div>
            <div v-else style="font-size:10px; color:#999; padding:10px;">Select item</div>
            <label>Animation</label>
          </div>
        </template>

        <template v-if="activeTab === 'Slide Show'">
          <div class="ribbon-group">
            <button @click="activeSlideIndex = 0; togglePresent()" class="big-ribbon-btn">Beginning</button>
            <button @click="togglePresent" class="big-ribbon-btn">Current</button>
            <label>Start</label>
          </div>
        </template>

        <template v-if="activeTab === 'Review'">
          <div class="ribbon-group">
             <button @click="toggleSpellcheck()" class="big-ribbon-btn" :style="{ background: spellcheckEnabled ? '#e1dfdd' : 'transparent' }">✓ Spelling</button>
             <label>Proofing</label>
          </div>
          <div class="ribbon-group">
             <button @click="showModal('Comments', 'Add a comment functionality coming soon.')" class="big-ribbon-btn">💬 Comment</button>
             <label>Comments</label>
          </div>
        </template>

        <template v-if="activeTab === 'View'">
          <div class="ribbon-group">
            <button @click="showGrid = !showGrid" class="big-ribbon-btn">{{ showGrid ? 'Hide' : 'Show' }} Grid</button>
            <label>Guides</label>
          </div>
          <div class="ribbon-group">
            <button @click="zoom = 0.4" class="big-ribbon-btn">🔍 100%</button>
            <label>Zoom</label>
          </div>
        </template>

        <template v-if="activeTab === 'Help'">
          <div class="ribbon-group">
             <button @click="showModal('Help', 'Search for help articles or contact support.')" class="big-ribbon-btn">❓ Help</button>
             <button @click="showModal('Feedback', 'Thank you for your feedback!')" class="big-ribbon-btn">📢 Feedback</button>
             <label>Support</label>
          </div>
        </template>

        <template v-if="activeTab === 'File'">
          <div class="ribbon-group">
            <button @click="uploadPPTX" class="big-ribbon-btn">📤 <br>Upload .pptx</button>
            <label>Import</label>
          </div>
          <div class="ribbon-group">
            <button @click="downloadPPT" class="big-ribbon-btn" v-html="icons.ppt + '<span>Download</span>'"></button>
            <label>Export</label>
          </div>
          <div class="ribbon-group">
            <button @click="deletePresentation" class="big-ribbon-btn" style="color: #d13438;" v-html="icons.delete + '<span>Delete</span>'"></button>
            <label>Actions</label>
          </div>
        </template>
      </div>

      <!-- Workspace -->
      <div style="display: flex; flex-grow: 1; overflow: hidden;">
        <div class="slide-sidebar">
          <div v-for="(slide, index) in slides" :key="slide.id" @click="activeSlideIndex = index; selectedElementId = null" :class="{active: activeSlideIndex === index}" class="slide-thumb" :style="{ backgroundColor: slide.bgColor }">
             <span class="thumb-num">{{ index + 1 }}</span>
             <div class="thumb-preview">
                <div v-for="el in slide.elements" :key="el.id" :style="{ position: 'absolute', left: (el.x/1920*100)+'%', top: (el.y/1080*100)+'%', width: (el.w/1920*100)+'%', height: (el.h/1080*100)+'%', background: el.type==='shape' ? el.style.backgroundColor : 'transparent', border: el.type==='text' ? '0.5px solid #ccc' : 'none', borderRadius: el.style.borderRadius, clipPath: el.style.clipPath }"></div>
             </div>
          </div>
          <button @click="addSlide" class="add-slide-btn">+ Add Slide</button>
        </div>
        <div class="canvas-area">
          <div class="slide-canvas" :style="{ width: '1920px', height: '1080px', backgroundColor: slides[activeSlideIndex].bgColor, transform: `scale(${zoom})` }">
            <div v-if="showGrid" class="slide-grid"></div>
            <div v-for="el in slides[activeSlideIndex].elements" :key="el.id" class="slide-element" @contextmenu.prevent="openContextMenu($event, el.id)" @mousedown.stop="startDrag($event, el.id)" :style="{ position: 'absolute', left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px', outline: selectedElementId === el.id ? '4px solid #0078d4' : 'none', ...el.style, backgroundImage: el.type === 'image' ? `url(${el.content})` : 'none', backgroundSize: 'cover' }">
               <textarea v-if="el.type === 'text'" v-model="el.content" @input="saveToCloud" :spellcheck="spellcheckEnabled"></textarea>
               <div v-if="el.type === 'shape'" style="width: 100%; height: 100%;"></div>
               <div v-if="selectedElementId === el.id" class="resize-handle" @mousedown.stop="startResize($event, el.id, 'se')"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="status-bar" style="background: #d24726;">
        <div>Slide {{ activeSlideIndex + 1 }} of {{ slides.length }} | English (US)</div>
        <div style="display: flex; gap: 15px; align-items: center;">
           <input type="range" v-model="zoom" min="0.1" max="0.8" step="0.05">
           <span>{{ Math.round(zoom * 250) }}% | LemCloud Connected</span>
        </div>
      </div>
    </template>

    <!-- Share Modal -->
    <div v-if="isShareOpen" class="modal-overlay">
      <div class="modal">
        <h3>Share Presentation</h3>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" class="share-input">
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false" class="modal-btn secondary">Close</button>
          <button @click="copyLink" class="modal-btn primary" style="background: #d24726;">{{ copyStatus || 'Copy' }}</button>
        </div>
      </div>
    </div>
    <!-- Context Menu -->
    <div v-if="contextMenu.visible" :style="{ position: 'fixed', top: contextMenu.y + 'px', left: contextMenu.x + 'px', background: 'white', border: '1px solid #ccc', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', borderRadius: '4px', zIndex: 10000, minWidth: '150px' }">
      <div @click="bringToFront" class="context-item">Bring to Front</div>
      <div @click="sendToBack" class="context-item">Send to Back</div>
      <div @click="flipHorizontal" class="context-item">Flip Horizontal</div>
      <div @click="flipVertical" class="context-item">Flip Vertical</div>
      <div style="height: 1px; background: #eee; margin: 4px 0;"></div>
      <div @click="deleteElement" class="context-item" style="color: #d13438;">Delete</div>
    </div>
  </div>
</template>

<style scoped>
.context-item { padding: 8px 12px; font-size: 13px; cursor: pointer; color: #333; }
.context-item:hover { background: #f3f2f1; }
.quick-btn { background: transparent; border: none; color: white; padding: 4px 8px; cursor: pointer; border-radius: 2px; }
.header-title-input { background: transparent; border: 1px solid transparent; color: white; font-weight: 600; font-size: 12px; padding: 2px 8px; border-radius: 2px; outline: none; width: 250px; }
.header-title-input:hover { background: rgba(255,255,255,0.1); }
.header-title-input:focus { background: white; color: #d24726; }

.avatar-stack { display: flex; align-items: center; }
.avatar { width: 24px; height: 24px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
.avatar.me { background: #0078d4; z-index: 10; }
.avatar.other { margin-left: -8px; z-index: 5; }

.ribbon-tabs { background: #f3f2f1; display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; }
.ribbon-tab { padding: 6px 12px; font-size: 11px; color: #333; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; }
.ribbon-tab:hover { background: #e1dfdd; }
.ribbon-tab.active { border-bottom-color: #d24726; font-weight: 600; background: #fff; }

.ribbon-panel { background: #fff; height: 95px; display: flex; padding: 5px 10px; gap: 15px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; }
.ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid #f3f2f1; padding-right: 15px; height: 100%; min-width: max-content; }
.ribbon-group label { font-size: 9px; color: #666; margin-top: auto; text-transform: uppercase; padding-top: 5px; }

.big-ribbon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; gap: 2px; }
.big-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }
.small-ribbon-btn { background: transparent; border: 1px solid #eee; padding: 2px 8px; border-radius: 2px; cursor: pointer; font-size: 11px; }
.small-ribbon-btn:hover { background: #f3f2f1; }
.ribbon-select { font-size: 11px; border: 1px solid #eee; outline: none; }
.theme-mini { width: 30px; height: 20px; border-radius: 2px; cursor: pointer; }

/* Workspace */
.slide-sidebar { width: 180px; background: #fff; border-right: 1px solid #e1dfdd; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
.slide-thumb { border: 2px solid transparent; cursor: pointer; aspect-ratio: 16/9; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
.slide-thumb.active { border-color: #d24726; }
.thumb-num { position: absolute; top: 2px; left: 4px; font-size: 10px; font-weight: bold; color: #666; z-index: 2; }
.thumb-preview { width: 100%; height: 100%; position: relative; }
.add-slide-btn { padding: 10px; border: 1px dashed #ccc; background: transparent; cursor: pointer; color: #666; }

.canvas-area { flex-grow: 1; display: flex; justify-content: center; align-items: center; background: #e1dfdd; overflow: auto; padding: 50px; }
.slide-canvas { transform-origin: center center; position: relative; flex-shrink: 0; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.slide-grid { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(#ccc 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }

.slide-element textarea { width: 100%; height: 100%; background: transparent; border: none; outline: none; color: inherit; font: inherit; resize: none; text-align: inherit; }
.resize-handle { position: absolute; bottom: -6px; right: -6px; width: 12px; height: 12px; background: white; border: 2px solid #0078d4; cursor: se-resize; }

.presentation-mode { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: black; z-index: 10000; display: flex; flex-direction: column; }
.presentation-canvas-container { flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.presentation-scaler { transform-origin: center center; }
.slide-canvas-real { width: 1920px; height: 1080px; position: relative; overflow: hidden; }
.presentation-controls { height: 40px; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; gap: 20px; color: white; font-size: 14px; }
.presentation-controls button { background: rgba(255,255,255,0.1); border: none; color: white; padding: 4px 15px; cursor: pointer; border-radius: 4px; }
.exit-btn { background: #d24726 !important; }

.status-bar { color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; }

/* Custom Modal */
.custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 20000; display: flex; align-items: center; justify-content: center; }
.custom-modal { background: white; padding: 25px; border-radius: 8px; width: 350px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.modal-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin: 15px 0; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-btn { padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
.modal-btn.primary { background: #d24726; color: white; }
.modal-btn.secondary { background: #f3f2f1; color: #333; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; padding: 25px; border-radius: 8px; width: 400px; }
.share-input { width: 100%; padding: 10px; border: 1px solid #ccc; margin: 15px 0; border-radius: 4px; font-size: 13px; }
.share-header-btn { background: white; color: #d24726; padding: 2px 12px; border-radius: 2px; border: none; font-weight: 600; font-size: 11px; cursor: pointer; }
</style>
