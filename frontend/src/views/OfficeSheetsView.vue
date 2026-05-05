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

// Create a larger grid
const cols = 26
const rows = 100

// State holds raw input strings
const rawData = reactive(
  Array(rows).fill().map(() => Array(cols).fill(''))
)

const stylesData = reactive(
  Array(rows).fill().map(() => Array(cols).fill({ bold: false, italic: false, color: '#000000', bg: 'transparent', align: 'left' }))
)

const activeCell = ref({ r: 0, c: 0 })
const username = ref('Anonymous')
const avatars = ref([])

let clientId = localStorage.getItem('lemhand_office_client_id')
if (!clientId) {
  clientId = Date.now().toString(36) + Math.random().toString(36).substr(2)
  localStorage.setItem('lemhand_office_client_id', clientId)
}
const myUserObj = { id: clientId, name: '' }

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
    storedName = prompt("Enter your name to join this document:") || "Anonymous"
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
      
      if (!isUpdatingFromServer) {
        isUpdatingFromServer = true
        if (data.grid) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (data.grid[r] && data.grid[r][c] !== undefined) { rawData[r][c] = data.grid[r][c] }
            }
          }
        }
        if (data.styles) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (data.styles[r] && data.styles[r][c]) { stylesData[r][c] = { ...stylesData[r][c], ...data.styles[r][c] } }
            }
          }
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
  recents.push({ id: docId, type: 'sheets', title: documentTitle.value, lastOpened: Date.now() })
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
        grid: rawData,
        styles: stylesData,
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
watch(() => [...rawData.map(row => [...row])], saveToCloud, { deep: true })
watch(() => [...stylesData.map(row => [...row])], saveToCloud, { deep: true })

const selectCell = (r, c) => { activeCell.value = { r, c } }
const toggleBold = () => { stylesData[activeCell.value.r][activeCell.value.c].bold = !stylesData[activeCell.value.r][activeCell.value.c].bold }
const toggleItalic = () => { stylesData[activeCell.value.r][activeCell.value.c].italic = !stylesData[activeCell.value.r][activeCell.value.c].italic }
const setCellColor = (e) => { stylesData[activeCell.value.r][activeCell.value.c].color = e.target.value }
const setCellBg = (e) => { stylesData[activeCell.value.r][activeCell.value.c].bg = e.target.value }
const setAlign = (dir) => { stylesData[activeCell.value.r][activeCell.value.c].align = dir }

const getColumnLabel = (index) => String.fromCharCode(65 + index)

const evaluateCell = (r, c) => {
  let val = rawData[r][c]
  if (typeof val === 'string' && val.startsWith('=')) {
    try {
      let expr = val.substring(1).toUpperCase()
      expr = expr.replace(/[A-Z][0-9]+/g, (match) => {
        const col = match.charCodeAt(0) - 65
        const row = parseInt(match.substring(1)) - 1
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          if (row === r && col === c) return 0
          const refVal = evaluateCell(row, col)
          return isNaN(refVal) ? 0 : refVal
        }
        return 0
      })
      const safeExpr = expr.replace(/[^0-9+\-*/(). ]/g, '')
      return safeExpr ? new Function('return ' + safeExpr)() : ''
    } catch (e) { return '#ERROR!' }
  }
  return val
}

const displayData = computed(() => {
  return rawData.map((row, r) => row.map((col, c) => {
    if (activeCell.value.r === r && activeCell.value.c === c) return rawData[r][c]
    return evaluateCell(r, c)
  }))
})

const deleteDocument = async () => {
  if (confirm('Are you sure you want to PERMANENTLY delete this spreadsheet? This cannot be undone.')) {
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

const downloadCSV = () => {
  let csvContent = ''
  for (let r = 0; r < rows; r++) {
    let rowValues = []
    for (let c = 0; c < cols; c++) {
      let val = evaluateCell(r, c); let strVal = String(val).replace(/"/g, '""');
      if (strVal.includes(',') || strVal.includes('"')) strVal = `"${strVal}"`;
      rowValues.push(strVal);
    }
    csvContent += rowValues.join(',') + '\n'
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.setAttribute('href', url); link.setAttribute('download', `${documentTitle.value}.csv`);
  link.click();
}

const isShareOpen = ref(false); const shareLink = ref(''); const copyStatus = ref('');
const openShare = () => { shareLink.value = window.location.href; isShareOpen.value = true; }
const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    copyStatus.value = 'Copied!';
    setTimeout(() => { copyStatus.value = ''; }, 3000);
  });
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    
    <!-- Loading Animation -->
    <div v-if="isLoading" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background:#f3f2f1; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <svg width="120" height="150" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="100" rx="4" fill="white" stroke="#217346" stroke-width="4"/>
        <path class="grid-line grid-line-v" d="M 36 10 L 36 110" stroke="#ccc" stroke-width="2"/>
        <path class="grid-line grid-line-v" d="M 62 10 L 62 110" stroke="#ccc" stroke-width="2"/>
        <path class="grid-line grid-line-h" d="M 10 35 L 90 35" stroke="#ccc" stroke-width="2"/>
        <path class="grid-line grid-line-h" d="M 10 60 L 90 60" stroke="#ccc" stroke-width="2"/>
      </svg>
      <div style="position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; color: #217346; font-weight: bold; font-size: 1.2rem;">
        LemHand Office
        <span style="font-size: 0.9rem; font-weight: normal; margin-top: 5px;">Loading LemSheet...</span>
      </div>
    </div>

    <!-- Top Header -->
    <div style="background-color: #217346; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
      <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
        <RouterLink to="/office" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">X</RouterLink>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        <button @click="saveToCloud" class="quick-btn">💾</button>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        
        <!-- Renaming Input -->
        <input 
          v-model="documentTitle" 
          class="header-title-input"
          placeholder="Enter spreadsheet title..."
        >
        
        <span v-if="isCloudSaving" style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saving...</span>
        <span v-else style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saved to LemCloud</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 10px;">
        <button @click="openShare" style="background: white; color: #217346; padding: 2px 12px; border-radius: 2px; border: none; font-weight: 600; font-size: 11px; cursor: pointer;">Share</button>
        <div style="display: flex; align-items: center;">
          <div :title="username + ' (You)'" style="width: 24px; height: 24px; border-radius: 50%; background: #0078d4; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; z-index: 10;">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :title="avatar" :style="{ background: ['#d83b01', '#2b579a', '#8764b8', '#c239b3'][idx % 4] }" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-left: -8px; z-index: 5;">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- Ribbon Tabs -->
    <div style="background: #f3f2f1; display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0;">
      <div v-for="tab in ['File', 'Home', 'Insert', 'Layout', 'Formulas', 'Data', 'View', 'Help']" :key="tab" 
           @click="activeTab = tab" 
           class="ribbon-tab" :class="{ active: activeTab === tab }">
        {{ tab }}
      </div>
    </div>

    <!-- Ribbon Panel -->
    <div class="ribbon-panel" :class="{ hidden: !isRibbonVisible }">
      <!-- Home Tab -->
      <template v-if="activeTab === 'Home'">
        <div class="ribbon-group">
          <div style="display: flex; gap: 4px;">
            <button @click="toggleBold" class="small-ribbon-btn" :class="{active: stylesData[activeCell.r][activeCell.c].bold}"><b>B</b></button>
            <button @click="toggleItalic" class="small-ribbon-btn" :class="{active: stylesData[activeCell.r][activeCell.c].italic}"><i>I</i></button>
          </div>
          <label>Font</label>
        </div>
        <div class="ribbon-group">
          <div style="display: flex; gap: 10px;">
            <label class="color-label">Text <input type="color" @change="setCellColor" :value="stylesData[activeCell.r][activeCell.c].color"></label>
            <label class="color-label">Fill <input type="color" @change="setCellBg" :value="stylesData[activeCell.r][activeCell.c].bg"></label>
          </div>
          <label>Colors</label>
        </div>
        <div class="ribbon-group">
           <div style="display: flex; gap: 2px;">
              <button @click="setAlign('left')" class="small-ribbon-btn">⫷</button>
              <button @click="setAlign('center')" class="small-ribbon-btn">≡</button>
              <button @click="setAlign('right')" class="small-ribbon-btn">⫸</button>
           </div>
           <label>Alignment</label>
        </div>
        <div class="ribbon-group">
           <button class="small-ribbon-btn">$ Currency</button>
           <button class="small-ribbon-btn">% Percent</button>
           <label>Number</label>
        </div>
      </template>

      <!-- Formulas Tab -->
      <template v-if="activeTab === 'Formulas'">
        <div class="ribbon-group">
          <div style="display: flex; gap: 5px;">
            <button @click="rawData[activeCell.r][activeCell.c] = '=SUM()'" class="small-ribbon-btn">Σ Sum</button>
            <button @click="rawData[activeCell.r][activeCell.c] = '=AVG()'" class="small-ribbon-btn">x̄ Average</button>
          </div>
          <label>Function Library</label>
        </div>
      </template>

      <!-- Data Tab -->
      <template v-if="activeTab === 'Data'">
         <div class="ribbon-group">
            <button class="small-ribbon-btn">↑ Sort A-Z</button>
            <button class="small-ribbon-btn">↓ Sort Z-A</button>
            <label>Sort & Filter</label>
         </div>
      </template>

      <!-- File Tab -->
      <template v-if="activeTab === 'File'">
        <div class="ribbon-group">
          <button @click="downloadCSV" class="big-ribbon-btn">📥 Download CSV</button>
          <button @click="deleteDocument" class="big-ribbon-btn" style="color: #d13438;">🗑 Delete Spreadsheet</button>
          <label>Actions</label>
        </div>
      </template>
    </div>

    <!-- Formula Bar -->
    <div style="padding: 6px 15px; border-bottom: 1px solid #e1dfdd; display: flex; gap: 10px; align-items: center; background: #fff; flex-shrink: 0;">
      <span style="font-weight: bold; min-width: 40px; font-size: 12px; color: #666;">{{ getColumnLabel(activeCell.c) }}{{ activeCell.r + 1 }}</span>
      <span style="color: #217346; font-style: italic; font-weight: bold;">fx</span>
      <input type="text" v-model="rawData[activeCell.r][activeCell.c]" style="flex-grow: 1; border: 1px solid #e1dfdd; padding: 2px 8px; outline: none; font-size: 13px;">
    </div>

    <!-- Grid Area -->
    <div style="flex-grow: 1; overflow: auto; background: #fff;">
      <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
        <thead>
          <tr style="background: #f3f2f1;">
            <th style="width: 40px; border: 1px solid #ccc; position: sticky; top: 0; left: 0; z-index: 3;"></th>
            <th v-for="c in cols" :key="'h'+c" style="border: 1px solid #ccc; padding: 4px; min-width: 100px; position: sticky; top: 0; z-index: 2;">{{ getColumnLabel(c - 1) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIndex) in rawData" :key="'r'+rIndex">
            <td style="background: #f3f2f1; border: 1px solid #ccc; text-align: center; position: sticky; left: 0; z-index: 2;">{{ rIndex + 1 }}</td>
            <td v-for="(col, cIndex) in row" :key="'c'+cIndex" @click="selectCell(rIndex, cIndex)"
                :style="{ 
                  outline: (activeCell.r === rIndex && activeCell.c === cIndex) ? '2px solid #217346' : 'none', 
                  backgroundColor: stylesData[rIndex][cIndex].bg, 
                  color: stylesData[rIndex][cIndex].color, 
                  fontWeight: stylesData[rIndex][cIndex].bold ? 'bold' : 'normal', 
                  fontStyle: stylesData[rIndex][cIndex].italic ? 'italic' : 'normal', 
                  textAlign: stylesData[rIndex][cIndex].align || 'left',
                  border: '1px solid #e1dfdd', 
                  padding: '0', 
                  position: (activeCell.r === rIndex && activeCell.c === cIndex) ? 'relative' : 'static', 
                  zIndex: (activeCell.r === rIndex && activeCell.c === cIndex) ? 1 : 0 
                }">
              <input v-if="activeCell.r === rIndex && activeCell.c === cIndex" type="text" v-model="rawData[rIndex][cIndex]" style="width: 100%; height: 100%; border: none; outline: none; padding: 4px; background: transparent; color: inherit; font: inherit;" autofocus>
              <div v-else style="padding: 4px; min-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ displayData[rIndex][cIndex] }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Status Bar -->
    <div style="background: #217346; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
      <div>Ready | Sum: 0</div>
      <div>100% | LemCloud {{ isCloudSaving ? 'Syncing...' : 'Connected' }}</div>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" class="modal-overlay">
      <div class="modal">
        <h2>Share Spreadsheet</h2>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" class="share-input">
        <p v-if="copyStatus" style="color: green;">{{ copyStatus }}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false">Close</button>
          <button @click="copyLink" style="background: #217346; color: white; border: none; padding: 5px 15px; border-radius: 4px;">Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-btn { background: transparent; border: none; color: white; padding: 4px 8px; cursor: pointer; border-radius: 2px; }
.quick-btn:hover { background: rgba(255,255,255,0.2); }

.header-title-input {
  background: transparent;
  border: 1px solid transparent;
  color: white;
  font-weight: 600;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 2px;
  outline: none;
  width: 250px;
  transition: all 0.2s;
}
.header-title-input:hover {
  background: rgba(255,255,255,0.1);
}
.header-title-input:focus {
  background: white;
  color: #217346;
  border-color: white;
}

.ribbon-tab { padding: 6px 12px; font-size: 12px; color: #333; cursor: pointer; border-bottom: 3px solid transparent; }
.ribbon-tab:hover { background: #e1dfdd; }
.ribbon-tab.active { border-bottom-color: #217346; font-weight: 600; background: #fff; }

.ribbon-panel { background: #fff; height: 90px; display: flex; padding: 5px 10px; gap: 15px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; overflow-x: auto; }
.ribbon-panel.hidden { height: 0; padding: 0; overflow: hidden; }

.ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid #f3f2f1; padding-right: 15px; height: 100%; min-width: max-content; }
.ribbon-group label { font-size: 9px; color: #666; margin-top: auto; text-transform: uppercase; padding-top: 5px; }

.big-ribbon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; gap: 2px; }
.big-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }

.small-ribbon-btn { background: transparent; border: 1px solid transparent; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 12px; }
.small-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }
.small-ribbon-btn.active { background: #e1dfdd; border-color: #217346; }

.color-label { font-size: 10px; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.color-label input { width: 16px; height: 16px; border: none; padding: 0; background: none; cursor: pointer; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; padding: 30px; border-radius: 8px; width: 400px; }
.share-input { width: 100%; padding: 10px; border: 1px solid #ccc; margin: 15px 0; }

.grid-line {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: draw-grid 1.5s infinite ease-in-out alternate;
}
@keyframes draw-grid {
  0% { stroke-dashoffset: 40; }
  100% { stroke-dashoffset: 0; }
}
</style>
