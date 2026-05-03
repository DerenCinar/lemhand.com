<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useRoute } from 'vue-router'

const route = useRoute()
const docId = route.params.id

const documentTitle = ref('Untitled Spreadsheet')

// Create a larger grid
const cols = 26
const rows = 100

// State holds raw input strings
const rawData = reactive(
  Array(rows).fill().map(() => Array(cols).fill(''))
)

const activeCell = ref({ r: 0, c: 0 })
const activeMenu = ref(null)
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

const handleUnload = () => {
  setDoc(doc(db, 'office', docId), {
    activeUsers: arrayRemove(myUserObj)
  }, { merge: true }).catch(() => {})
}

onMounted(() => {
  // Setup User
  let storedName = localStorage.getItem('lemhand_office_name')
  if (!storedName) {
    storedName = prompt("Enter your name to join this document:") || "Anonymous"
    localStorage.setItem('lemhand_office_name', storedName)
  }
  username.value = storedName
  myUserObj.name = storedName

  // Save to Recents
  saveToRecents()

  const docRef = doc(db, 'office', docId)

  // Join the document
  setDoc(docRef, { activeUsers: arrayUnion(myUserObj) }, { merge: true })
  window.addEventListener('beforeunload', handleUnload)

  unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.title) {
        documentTitle.value = data.title
        saveToRecents()
      }
      
      if (data.activeUsers) {
        avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      }
      
      if (data.grid && !isUpdatingFromServer) {
        isUpdatingFromServer = true
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (data.grid[r] && data.grid[r][c] !== undefined) {
              rawData[r][c] = data.grid[r][c]
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
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      // Clean up empty rows to save space
      const gridToSave = rawData.map(row => [...row]);
      await setDoc(doc(db, 'office', docId), {
        title: documentTitle.value,
        grid: gridToSave,
        lastUpdated: new Date()
      }, { merge: true })
      saveToRecents()
    } catch (e) {
      console.error("Error saving:", e)
    }
  }, 1000); // 1s debounce
}

watch(documentTitle, saveToCloud)

// Deep watch the rawData grid
watch(() => [...rawData.map(row => [...row])], () => {
  saveToCloud()
}, { deep: true })

const selectCell = (r, c) => {
  activeCell.value = { r, c }
}

const getColumnLabel = (index) => {
  return String.fromCharCode(65 + index)
}

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
      if (safeExpr) {
        return new Function('return ' + safeExpr)()
      }
    } catch (e) {
      return '#ERROR!'
    }
  }
  return val
}

const displayData = computed(() => {
  return rawData.map((row, r) => 
    row.map((col, c) => {
      if (activeCell.value.r === r && activeCell.value.c === c) {
        return rawData[r][c]
      }
      return evaluateCell(r, c)
    })
  )
})

const downloadCSV = () => {
  let csvContent = ''
  for (let r = 0; r < rows; r++) {
    let rowValues = []
    let rowHasData = false
    for (let c = 0; c < cols; c++) {
      let val = evaluateCell(r, c)
      if (val !== '') rowHasData = true
      // Escape commas and quotes
      let strVal = String(val).replace(/"/g, '""')
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        strVal = `"${strVal}"`
      }
      rowValues.push(strVal)
    }
    // Only include rows that have at least some data, up to the last row with data
    csvContent += rowValues.join(',') + '\n'
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${documentTitle.value}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const clearGrid = () => {
  if(confirm("Are you sure you want to clear the entire spreadsheet?")) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rawData[r][c] = ''
      }
    }
    saveToCloud()
  }
}

const toggleMenu = (menu) => {
  activeMenu.value = activeMenu.value === menu ? null : menu
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    activeMenu.value = null
  }
})

const openShare = () => {
  shareLink.value = window.location.href;
  isShareOpen.value = true;
  copyStatus.value = '';
}

const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    copyStatus.value = 'Link copied to clipboard!';
    setTimeout(() => { copyStatus.value = ''; }, 3000);
  }).catch(err => {
    copyStatus.value = 'Failed to copy';
  });
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: calc(100vh - 54px); background-color: white;">
    <!-- Enterprise Header -->
    <div style="background-color: #217346; color: white; padding: 8px 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <RouterLink to="/office" style="color: white; font-size: 1.2rem; text-decoration: none; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 5px;">
          <strong style="background: white; color: #217346; padding: 0px 4px; border-radius: 2px;">X</strong> 
          ⌂
        </RouterLink>
        <div class="menu-container" style="display: flex; flex-direction: column; gap: 2px;">
          <input type="text" v-model="documentTitle" style="background: transparent; border: 1px solid transparent; color: white; font-size: 1.1rem; outline: none; font-weight: 600; width: 300px; padding: 2px 4px; border-radius: 2px;" onfocus="this.style.border='1px solid rgba(255,255,255,0.5)'" onblur="this.style.border='1px solid transparent'">
          <div style="display: flex; gap: 5px; font-size: 13px; color: rgba(255,255,255,0.9); margin-left: 2px;">
            <div style="position: relative;">
              <span @click="toggleMenu('file')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'file' ? 'rgba(255,255,255,0.2)' : 'transparent' }">File</span>
              <div v-if="activeMenu === 'file'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="downloadCSV(); activeMenu=null" class="menu-item">Download .CSV</div>
              </div>
            </div>
            <div style="position: relative;">
              <span @click="toggleMenu('edit')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'edit' ? 'rgba(255,255,255,0.2)' : 'transparent' }">Edit</span>
              <div v-if="activeMenu === 'edit'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="clearGrid(); activeMenu=null" class="menu-item" style="color: #d83b01;">Clear Entire Grid</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Collaboration -->
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 12px; color: rgba(255,255,255,0.6);">☁ Saved to LemCloud</span>
        <div style="display: flex; align-items: center;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #0078d4; border: 2px solid #217346; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: -10px; z-index: 99;" :title="username + ' (You)'">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :style="{ background: ['#d83b01', '#2b579a', '#8764b8', '#c239b3'][idx % 4], zIndex: 98 - idx }" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #217346; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: -10px;" :title="avatar">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
        <button @click="openShare" style="background: white; color: #217346; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 5px; cursor: pointer;">
          👤 Share
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div style="background-color: white; padding: 8px 20px; border-bottom: 1px solid #e1dfdd; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <button @click="clearGrid" style="background: transparent; color: #d83b01; padding: 4px 10px; border: 1px solid #e1dfdd; border-radius: 4px; font-weight: bold; cursor: pointer;">🗑 Clear Grid</button>
      <div style="width: 1px; height: 24px; background: #e1dfdd; margin: 0 5px;"></div>
      <button @click="downloadCSV" style="background: #217346; color: white; padding: 4px 10px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">⬇ Download CSV</button>
    </div>

    <!-- Formula Bar -->
    <div style="padding: 10px 20px; border-bottom: 1px solid #e1dfdd; display: flex; gap: 10px; align-items: center; background: #f3f2f1;">
      <span style="font-weight: 600; min-width: 40px;">{{ getColumnLabel(activeCell.c) }}{{ activeCell.r + 1 }}</span>
      <span style="color: #666;">fx</span>
      <input 
        type="text" 
        v-model="rawData[activeCell.r][activeCell.c]" 
        style="flex-grow: 1; padding: 5px; border: 1px solid #c8c6c4; outline: none;"
      >
    </div>

    <!-- Grid -->
    <div style="flex-grow: 1; overflow: auto;">
      <table style="border-collapse: collapse; width: 100%; min-width: 800px;">
        <thead>
          <tr>
            <th style="width: 40px; background: #f3f2f1; border: 1px solid #c8c6c4; position: sticky; top: 0; z-index: 2;"></th>
            <th v-for="c in cols" :key="'h'+c" style="background: #f3f2f1; border: 1px solid #c8c6c4; padding: 5px; min-width: 100px; position: sticky; top: 0; z-index: 1;">
              {{ getColumnLabel(c - 1) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIndex) in rawData" :key="'r'+rIndex">
            <td style="background: #f3f2f1; border: 1px solid #c8c6c4; text-align: center; color: #666; font-size: 0.9em; position: sticky; left: 0;">
              {{ rIndex + 1 }}
            </td>
            <td 
              v-for="(col, cIndex) in row" 
              :key="'c'+cIndex"
              @click="selectCell(rIndex, cIndex)"
              style="border: 1px solid #e1dfdd; padding: 0;"
              :style="{ outline: (activeCell.r === rIndex && activeCell.c === cIndex) ? '2px solid #217346' : 'none' }"
            >
              <input 
                v-if="activeCell.r === rIndex && activeCell.c === cIndex"
                type="text"
                v-model="rawData[rIndex][cIndex]"
                style="width: 100%; height: 100%; border: none; outline: none; padding: 4px; font-family: inherit;"
                autofocus
              >
              <div v-else style="padding: 4px; min-height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ displayData[rIndex][cIndex] }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 30px; border-radius: 8px; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <h2 style="margin-bottom: 20px; color: #323130;">Share Spreadsheet</h2>
        <p style="margin-bottom: 10px; color: #666; font-size: 14px;">Anyone with this link can join and collaborate in real-time.</p>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" style="width: 100%; padding: 10px; border: 1px solid #c8c6c4; border-radius: 4px; margin-bottom: 15px; outline: none; background: #f3f2f1; color: #333;">
        <p v-if="copyStatus" style="color: #107c41; margin-bottom: 15px; font-weight: 600; font-size: 14px;">{{ copyStatus }}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false" style="padding: 8px 16px; background: #e1dfdd; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; color: black;">Close</button>
          <button @click="copyLink" style="padding: 8px 16px; background: #217346; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Copy Link</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  padding: 8px 15px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}
.menu-item:hover {
  background: #f3f2f1;
}
</style>
