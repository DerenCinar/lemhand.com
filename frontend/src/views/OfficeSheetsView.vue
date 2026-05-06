<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, deleteDoc as firestoreDelete } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const documentTitle = ref('Untitled Spreadsheet')
const activeTab = ref('Home')
const isRibbonVisible = ref(true)
const isCloudSaving = ref(false)
const showGridlines = ref(true)

const returnPath = computed(() => {
  const app = localStorage.getItem('lemhand_standalone_app')
  return app === 'sheets' ? '/app/sheets' : '/office'
})

const sheetSettings = ref({
  zoom: 100,
  frozen: true,
  protected: false,
  spellcheck: false
})
const setZoom = (val) => { sheetSettings.value.zoom = val; saveToCloud() }
const toggleFreeze = () => { sheetSettings.value.frozen = !sheetSettings.value.frozen; saveToCloud() }
const toggleProtect = () => { sheetSettings.value.protected = !sheetSettings.value.protected; saveToCloud() }
const toggleSpellcheck = () => { 
  sheetSettings.value.spellcheck = !sheetSettings.value.spellcheck; 
  saveToCloud();
  showModal('Spell Check', sheetSettings.value.spellcheck ? 'Spell check enabled for text cells.' : 'Spell check disabled.')
}

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

const icons = {
  save: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17,3H5C3.89,3 3,3.9 3,5V19C3,20.1 3.89,21 5,21H19C20.1,21 21,20.1 21,19V7L17,3M12,19C10.34,19 9,17.66 9,16C9,14.34 10.34,13 12,13C13.66,13 15,14.34 15,16C15,17.66 13.66,19 12,19M15,9H5V5H15V9Z"/></svg>`,
  bold: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z"/></svg>`,
  italic: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>`,
  sort: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18,21L14,17H17V7H14L18,3L22,7H19V17H22L18,21M2,19V17H12V19H2M2,13V11H9V13H2M2,7V5H6V7H2Z"/></svg>`,
  fx: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18,7L15,12L18,17H15.8L13.5,13.2L11.2,17H9L12,12L9,7H11.2L13.5,10.8L15.8,7H18M7,7V9H11V11H7V13H11V15H7V17H5V7H7Z"/></svg>`
}

const cols = 26
const rows = 100
const rawData = reactive(Array(rows).fill().map(() => Array(cols).fill('')))
const stylesData = reactive(Array(rows).fill().map(() => Array(cols).fill({ bold: false, italic: false, color: '#000000', bg: 'transparent', align: 'left', fontSize: '13px' })))

const activeCell = ref({ r: 0, c: 0 })
const username = ref('Anonymous')
const avatars = ref([])

// Fill Handle State
const isDraggingHandle = ref(false)
const dragRange = ref(null)

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
    showModal("Welcome", "Please enter your name:", "prompt", (val) => {
      const name = val || "Anonymous"; localStorage.setItem('lemhand_office_name', name)
      username.value = name; myUserObj.name = name; updateUserPresence()
    })
  } else { username.value = storedName; myUserObj.name = storedName; updateUserPresence() }

  saveToRecents()
  const docRef = doc(db, 'office', docId)
  window.addEventListener('beforeunload', handleUnload)

  unsubscribe = onSnapshot(docRef, (docSnap) => {
    isDataLoaded = true; if (isMinTimePassed) isLoading.value = false
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.title) { documentTitle.value = data.title; saveToRecents() }
      if (data.activeUsers) avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      if (!isUpdatingFromServer) {
        isUpdatingFromServer = true
        if (data.grid) { for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) if (data.grid[r] && data.grid[r][c] !== undefined) rawData[r][c] = data.grid[r][c] } }
        if (data.styles) { for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) if (data.styles[r] && data.styles[r][c]) stylesData[r][c] = { ...stylesData[r][c], ...data.styles[r][c] } } }
        if (data.sheetSettings) sheetSettings.value = { ...sheetSettings.value, ...data.sheetSettings }
        setTimeout(() => { isUpdatingFromServer = false }, 100)
      }
    }
  })
})

const updateUserPresence = () => { setDoc(doc(db, 'office', docId), { activeUsers: arrayUnion(myUserObj) }, { merge: true }) }
onUnmounted(() => { if (unsubscribe) unsubscribe(); window.removeEventListener('beforeunload', handleUnload); handleUnload() })

const saveToRecents = () => {
  let recents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
  recents = recents.filter(d => d.id !== docId); recents.push({ id: docId, type: 'sheets', title: documentTitle.value, lastOpened: Date.now() })
  localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
}

const saveToCloud = () => {
  if (isUpdatingFromServer) return; isCloudSaving.value = true; clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), { title: documentTitle.value, grid: rawData, styles: stylesData, sheetSettings: sheetSettings.value, lastUpdated: new Date() }, { merge: true })
      saveToRecents(); isCloudSaving.value = false
    } catch (e) { isCloudSaving.value = false }
  }, 1000)
}

watch(documentTitle, saveToCloud); watch(() => [...rawData.map(row => [...row])], saveToCloud, { deep: true }); watch(() => [...stylesData.map(row => [...row])], saveToCloud, { deep: true })

const selectCell = (r, c) => { activeCell.value = { r, c } }
const getColumnLabel = (index) => String.fromCharCode(65 + index)

const evaluateCell = (r, c, visited = new Set()) => {
  let val = rawData[r][c]
  const cellId = `${r},${c}`
  if (visited.has(cellId)) return '#REF!'
  visited.add(cellId)
  if (typeof val === 'string' && val.startsWith('=')) {
    try {
      let expr = val.substring(1).toUpperCase()
      expr = expr.replace(/([A-Z])([0-9]+):([A-Z])([0-9]+)/g, (match, c1, r1, c2, r2) => {
        const sC = c1.charCodeAt(0)-65; const sR = parseInt(r1)-1; const eC = c2.charCodeAt(0)-65; const eR = parseInt(r2)-1
        let vals = []
        for (let row = Math.min(sR,eR); row <= Math.max(sR,eR); row++) { for (let col = Math.min(sC,eC); col <= Math.max(sC,eC); col++) { const v = evaluateCell(row, col, new Set(visited)); vals.push(isNaN(parseFloat(v)) ? 0 : parseFloat(v)) } }
        return `[${vals.join(',')}]`
      })
      expr = expr.replace(/[A-Z][0-9]+/g, (m) => {
        const col = m.charCodeAt(0)-65; const row = parseInt(m.substring(1))-1
        if (row >= 0 && row < rows && col >= 0 && col < cols) { const v = evaluateCell(row, col, new Set(visited)); return isNaN(parseFloat(v)) ? 0 : parseFloat(v) }
        return 0
      })
      const ctx = { SUM: (a)=>a.reduce((x,y)=>x+y,0), AVG: (a)=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, MIN: (a)=>Math.min(...a), MAX: (a)=>Math.max(...a), COUNT: (a)=>a.filter(v=>v!==0).length, ROUND: (v,p=0)=>Math.round(v*Math.pow(10,p))/Math.pow(10,p), ABS: (v)=>Math.abs(v) }
      Object.keys(ctx).forEach(f => { expr = expr.replace(new RegExp(`${f}\\(`, 'g'), `ctx.${f}(`) })
      const safe = expr.replace(/[^0-9+\-*/(). ,\[\]ctx\.A-Z]/g, '')
      return safe ? new Function('ctx', 'return ' + safe)(ctx) : ''
    } catch (e) { return '#ERROR!' }
  }
  return val
}

const displayData = computed(() => rawData.map((row, r) => row.map((col, c) => {
  if (activeCell.value.r === r && activeCell.value.c === c) return rawData[r][c]
  return evaluateCell(r, c)
})))

const sortGrid = (direction) => {
  const colIndex = activeCell.value.c
  const sorted = [...rawData].sort((a, b) => {
    let vA = a[colIndex], vB = b[colIndex]
    if (!isNaN(vA) && !isNaN(vB)) { vA = parseFloat(vA); vB = parseFloat(vB) }
    return direction === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1)
  })
  sorted.forEach((row, r) => { row.forEach((val, c) => rawData[r][c] = val) })
}

const deleteDocument = async () => { showModal("Delete Spreadsheet", "Permanent?", "confirm", async (c) => { if (c) { await firestoreDelete(doc(db, 'office', docId)); router.push('/office') } }) }
const downloadCSV = () => {
  let csv = rawData.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${documentTitle.value}.csv`; a.click()
}
const insertFunction = (f) => { rawData[activeCell.value.r][activeCell.value.c] = `=${f}()` }

const isShareOpen = ref(false); const shareLink = ref(''); const copyStatus = ref('')
const openShare = () => { shareLink.value = window.location.href; isShareOpen.value = true }
const copyLink = () => { navigator.clipboard.writeText(shareLink.value).then(() => { copyStatus.value = 'Copied!'; setTimeout(() => copyStatus.value = '', 3000) }) }

// Drag Handle Implementation
const onHandleMouseDown = (e) => {
  e.stopPropagation()
  isDraggingHandle.value = true
  dragRange.value = { r1: activeCell.value.r, c1: activeCell.value.c, r2: activeCell.value.r, c2: activeCell.value.c }
  window.addEventListener('mousemove', onHandleMouseMove)
  window.addEventListener('mouseup', onHandleMouseUp)
}
const onHandleMouseMove = (e) => {
  if (!isDraggingHandle.value) return
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const cell = el?.closest('td')
  if (cell) {
    const r = parseInt(cell.parentElement.dataset.index)
    const c = parseInt(cell.dataset.index)
    if (r !== undefined && c !== undefined) { dragRange.value.r2 = r; dragRange.value.c2 = c }
  }
}
const onHandleMouseUp = () => {
  if (!isDraggingHandle.value) return
  isDraggingHandle.value = false
  window.removeEventListener('mousemove', onHandleMouseMove)
  window.removeEventListener('mouseup', onHandleMouseUp)
  if (!dragRange.value) return
  const { r1, c1, r2, c2 } = dragRange.value
  const sourceVal = rawData[r1][c1]
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      if (r === r1 && c === c1) continue
      if (typeof sourceVal === 'string' && sourceVal.startsWith('=')) {
        const rDiff = r - r1; const cDiff = c - c1
        rawData[r][c] = sourceVal.replace(/([A-Z])([0-9]+)/g, (match, col, row) => {
           const nC = String.fromCharCode(col.charCodeAt(0) + cDiff)
           const nR = parseInt(row) + rDiff
           return `${nC}${nR}`
        })
      } else {
        if (!isNaN(parseFloat(sourceVal))) {
           rawData[r][c] = parseFloat(sourceVal) + (r-r1) + (c-c1)
        } else { rawData[r][c] = sourceVal }
      }
    }
  }
  dragRange.value = null
}
const isInDragRange = (r, c) => {
  if (!dragRange.value) return false
  const { r1, c1, r2, c2 } = dragRange.value
  return r >= Math.min(r1, r2) && r <= Math.max(r1, r2) && c >= Math.min(c1, c2) && c <= Math.max(c1, c2)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    
    <!-- Modals -->
    <div v-if="modal.visible" class="custom-modal-overlay">
      <div class="custom-modal">
        <h3 style="color: #217346;">{{ modal.title }}</h3>
        <p>{{ modal.message }}</p>
        <input v-if="modal.type === 'prompt'" v-model="modal.inputValue" type="text" class="modal-input" @keyup.enter="confirmModal" autofocus>
        <div class="modal-actions">
          <button v-if="modal.type !== 'alert'" @click="closeModal" class="modal-btn secondary">Cancel</button>
          <button @click="confirmModal" class="modal-btn primary" style="background: #217346;">OK</button>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div style="background-color: #217346; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
      <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
        <RouterLink :to="returnPath" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">X</RouterLink>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        <button @click="saveToCloud" class="quick-btn" v-html="icons.save"></button>
        <input v-model="documentTitle" class="header-title-input" placeholder="Spreadsheet title...">
        <span style="font-size: 10px; opacity: 0.7;">{{ isCloudSaving ? 'Saving...' : 'Saved' }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button @click="openShare" class="share-header-btn">Share</button>
        <div class="avatar-stack">
          <div class="avatar me">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" class="avatar other" :style="{ background: ['#d83b01', '#2b579a', '#8764b8', '#c239b3'][idx % 4] }">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- Ribbon Tabs -->
    <div class="ribbon-tabs">
      <div v-for="tab in ['Home', 'Insert', 'Layout', 'Formulas', 'Data', 'Review', 'View', 'Help', 'File']" :key="tab" @click="activeTab = tab" class="ribbon-tab" :class="{ active: activeTab === tab }">{{ tab }}</div>
    </div>

    <!-- Ribbon Panel -->
    <div class="ribbon-panel">
      <template v-if="activeTab === 'Home'">
        <div class="ribbon-group">
          <div style="display: flex; gap: 4px;">
            <button @click="stylesData[activeCell.r][activeCell.c].bold = !stylesData[activeCell.r][activeCell.c].bold" class="small-ribbon-btn" v-html="icons.bold"></button>
            <button @click="stylesData[activeCell.r][activeCell.c].italic = !stylesData[activeCell.r][activeCell.c].italic" class="small-ribbon-btn" v-html="icons.italic"></button>
            <select v-model="stylesData[activeCell.r][activeCell.c].fontSize" class="ribbon-select">
              <option v-for="s in ['11px','12px','13px','14px','16px','18px']" :key="s" :value="s">{{ s.replace('px','') }}</option>
            </select>
          </div>
          <label>Font</label>
        </div>
        <div class="ribbon-group">
          <div style="display: flex; gap: 8px;">
            <label class="color-picker">A <input type="color" v-model="stylesData[activeCell.r][activeCell.c].color"></label>
            <label class="color-picker">Fill <input type="color" v-model="stylesData[activeCell.r][activeCell.c].bg"></label>
          </div>
          <label>Styles</label>
        </div>
        <div class="ribbon-group">
           <div style="display: flex; gap: 4px;">
              <button @click="stylesData[activeCell.r][activeCell.c].align = 'left'" class="small-ribbon-btn">L</button>
              <button @click="stylesData[activeCell.r][activeCell.c].align = 'center'" class="small-ribbon-btn">C</button>
              <button @click="stylesData[activeCell.r][activeCell.c].align = 'right'" class="small-ribbon-btn">R</button>
           </div>
           <label>Alignment</label>
        </div>
      </template>
      <template v-if="activeTab === 'Insert'">
        <div class="ribbon-group">
          <button @click="insertFunction('SUM')" class="big-ribbon-btn" v-html="icons.fx + '<span>Function</span>'"></button>
          <label>Formulas</label>
        </div>
        <div class="ribbon-group">
          <button @click="showModal('Chart', 'Chart engine coming soon!', 'alert')" class="big-ribbon-btn">📊 Chart</button>
          <button @click="showModal('Image', 'Image upload coming soon!', 'alert')" class="big-ribbon-btn">🖼️ Picture</button>
          <label>Illustrations</label>
        </div>
      </template>
      <template v-if="activeTab === 'Layout'">
        <div class="ribbon-group">
           <button @click="showGridlines = !showGridlines" class="big-ribbon-btn">{{ showGridlines ? 'Hide' : 'Show' }} Grid</button>
           <label>Display</label>
        </div>
        <div class="ribbon-group">
           <button @click="showModal('Margins', 'Normal')" class="small-ribbon-btn">Normal</button>
           <button @click="showModal('Margins', 'Narrow')" class="small-ribbon-btn">Narrow</button>
           <label>Margins</label>
        </div>
      </template>
      <template v-if="activeTab === 'Formulas'">
         <div class="ribbon-group">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
               <button v-for="f in ['SUM','AVG','MIN','MAX','COUNT','ROUND']" :key="f" @click="insertFunction(f)" class="small-ribbon-btn" style="font-size: 9px; min-width: 50px;">{{ f }}</button>
            </div>
            <label>Library</label>
         </div>
      </template>
      <template v-if="activeTab === 'Data'">
         <div class="ribbon-group">
            <button @click="sortGrid('asc')" class="big-ribbon-btn" v-html="icons.sort + '<span>A-Z</span>'"></button>
            <button @click="sortGrid('desc')" class="big-ribbon-btn" v-html="icons.sort + '<span>Z-A</span>'"></button>
            <label>Sort</label>
         </div>
         <div class="ribbon-group">
            <button @click="showModal('Filter', 'Filter functionality coming soon!')" class="big-ribbon-btn">⧩ Filter</button>
            <label>Filter</label>
         </div>
      </template>
      <template v-if="activeTab === 'Review'">
         <div class="ribbon-group">
            <button @click="toggleSpellcheck()" class="big-ribbon-btn" :style="{ background: sheetSettings.spellcheck ? '#e1dfdd' : 'transparent' }">✓ Spelling</button>
            <label>Proofing</label>
         </div>
         <div class="ribbon-group">
            <button @click="toggleProtect()" class="big-ribbon-btn" :style="{ background: sheetSettings.protected ? '#e1dfdd' : 'transparent' }">🔒 Protect</button>
            <label>Protect</label>
         </div>
      </template>
      <template v-if="activeTab === 'View'">
         <div class="ribbon-group">
            <div style="display: flex; gap: 4px;">
               <button @click="setZoom(100)" class="small-ribbon-btn" :class="{active: sheetSettings.zoom === 100}">100%</button>
               <button @click="setZoom(150)" class="small-ribbon-btn" :class="{active: sheetSettings.zoom === 150}">150%</button>
               <button @click="setZoom(200)" class="small-ribbon-btn" :class="{active: sheetSettings.zoom === 200}">200%</button>
            </div>
            <label>Zoom</label>
         </div>
         <div class="ribbon-group">
            <button @click="toggleFreeze()" class="big-ribbon-btn" :style="{ background: sheetSettings.frozen ? '#e1dfdd' : 'transparent' }">❄ Freeze</button>
            <label>Window</label>
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
          <button @click="downloadCSV" class="big-ribbon-btn" v-html="icons.download + '<span>CSV</span>'"></button>
          <button @click="deleteDocument" class="big-ribbon-btn" style="color: #d13438;" v-html="icons.delete + '<span>Delete</span>'"></button>
          <label>Actions</label>
        </div>
      </template>
    </div>

    <!-- Formula Bar -->
    <div class="formula-bar">
      <div class="cell-id">{{ getColumnLabel(activeCell.c) }}{{ activeCell.r + 1 }}</div>
      <div class="fx-icon">fx</div>
      <input type="text" v-model="rawData[activeCell.r][activeCell.c]" placeholder="Enter formula or data...">
    </div>

    <!-- Grid Container -->
    <div class="grid-scroll">
      <table :class="{ 'no-grid': !showGridlines, 'not-frozen': !sheetSettings.frozen }" :style="{ zoom: sheetSettings.zoom / 100 }">
        <thead>
          <tr>
            <th class="row-index-head"></th>
            <th v-for="c in cols" :key="'h'+c" class="col-head">{{ getColumnLabel(c - 1) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIndex) in rawData" :key="'r'+rIndex" :data-index="rIndex">
            <td class="row-index">{{ rIndex + 1 }}</td>
            <td v-for="(col, cIndex) in row" :key="'c'+cIndex" @click="!sheetSettings.protected && selectCell(rIndex, cIndex)"
                :data-index="cIndex"
                :class="{ active: activeCell.r === rIndex && activeCell.c === cIndex, 'drag-target': isInDragRange(rIndex, cIndex), 'protected-cell': sheetSettings.protected }"
                :style="{ backgroundColor: stylesData[rIndex][cIndex].bg, color: stylesData[rIndex][cIndex].color, fontWeight: stylesData[rIndex][cIndex].bold ? 'bold' : 'normal', fontStyle: stylesData[rIndex][cIndex].italic ? 'italic' : 'normal', textAlign: stylesData[rIndex][cIndex].align, fontSize: stylesData[rIndex][cIndex].fontSize }">
              <input v-if="!sheetSettings.protected && activeCell.r === rIndex && activeCell.c === cIndex" type="text" v-model="rawData[rIndex][cIndex]" :spellcheck="sheetSettings.spellcheck" autofocus>
              <div v-else class="cell-view">{{ displayData[rIndex][cIndex] }}</div>
              
              <!-- Fill Handle -->
              <div v-if="activeCell.r === rIndex && activeCell.c === cIndex" class="fill-handle" @mousedown="onHandleMouseDown"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <div>Ready | Sum: {{ evaluateCell(activeCell.r, activeCell.c) }}</div>
      <div>100% | LemCloud Connected</div>
    </div>
  </div>
</template>

<style scoped>
.quick-btn { background: transparent; border: none; color: white; padding: 4px 8px; cursor: pointer; border-radius: 2px; }
.header-title-input { background: transparent; border: 1px solid transparent; color: white; font-weight: 600; font-size: 12px; padding: 2px 8px; border-radius: 2px; outline: none; width: 250px; }
.header-title-input:hover { background: rgba(255,255,255,0.1); }
.header-title-input:focus { background: white; color: #217346; }

.avatar-stack { display: flex; align-items: center; }
.avatar { width: 24px; height: 24px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
.avatar.me { background: #0078d4; z-index: 10; }
.avatar.other { margin-left: -8px; z-index: 5; }

.ribbon-tabs { background: #f3f2f1; display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; }
.ribbon-tab { padding: 6px 12px; font-size: 11px; color: #333; cursor: pointer; border-bottom: 3px solid transparent; }
.ribbon-tab.active { border-bottom-color: #217346; font-weight: 600; background: #fff; }

.ribbon-panel { background: #fff; height: 95px; display: flex; padding: 5px 10px; gap: 15px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; }
.ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid #f3f2f1; padding-right: 15px; height: 100%; min-width: max-content; }
.ribbon-group label { font-size: 9px; color: #666; margin-top: auto; text-transform: uppercase; padding-top: 5px; }

.big-ribbon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; gap: 2px; }
.big-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }
.small-ribbon-btn { background: transparent; border: 1px solid #eee; padding: 2px 8px; border-radius: 2px; cursor: pointer; font-size: 11px; }
.small-ribbon-btn:hover { background: #f3f2f1; }
.small-ribbon-btn.active { background: #e1dfdd; font-weight: bold; }

.formula-bar { padding: 6px 15px; border-bottom: 1px solid #e1dfdd; display: flex; gap: 10px; align-items: center; background: #fff; flex-shrink: 0; }
.cell-id { font-weight: bold; min-width: 40px; font-size: 12px; color: #666; text-align: center; }
.fx-icon { color: #217346; font-style: italic; font-weight: bold; font-size: 14px; }
.formula-bar input { flex-grow: 1; border: 1px solid #e1dfdd; padding: 4px 10px; outline: none; font-size: 13px; border-radius: 4px; }

.grid-scroll { flex-grow: 1; overflow: auto; background: #fff; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
th { background: #f3f2f1; border: 1px solid #ccc; font-weight: normal; font-size: 11px; color: #666; }
.col-head { width: 100px; position: sticky; top: 0; z-index: 5; height: 24px; }
.row-index { background: #f3f2f1; border: 1px solid #ccc; text-align: center; width: 40px; position: sticky; left: 0; z-index: 5; }
.not-frozen .col-head, .not-frozen .row-index { position: static; }
td { border: 1px solid #e1dfdd; height: 24px; padding: 0; cursor: cell; overflow: hidden; position: relative; }
td.protected-cell { cursor: not-allowed; background-color: rgba(0,0,0,0.02) !important; }
td.active { outline: 2px solid #217346; z-index: 10; }
td.drag-target { background: rgba(33, 115, 70, 0.1) !important; outline: 1px dashed #217346; z-index: 9; }
td input { width: 100%; height: 100%; border: none; outline: none; padding: 0 4px; background: transparent; font: inherit; }
.cell-view { padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 24px; }

.fill-handle { position: absolute; bottom: -4px; right: -4px; width: 8px; height: 8px; background: #217346; border: 1px solid white; cursor: crosshair; z-index: 20; }

.status-bar { background: #217346; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; }

.custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.custom-modal { background: white; padding: 25px; border-radius: 8px; width: 350px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
.modal-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin: 15px 0; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-btn { padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
.modal-btn.primary { background: #217346; color: white; }
.modal-btn.secondary { background: #f3f2f1; color: #333; }
</style>
