<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, deleteDoc as firestoreDelete } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import mammoth from 'mammoth'
import * as HtmlDocx from 'html-docx-js-typescript'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const documentTitle = ref('Untitled Word Document')
const activeTab = ref('Home')
const isRibbonVisible = ref(true)
const editorDiv = ref(null)
const headerDiv = ref(null)
const footerDiv = ref(null)
const isShareOpen = ref(false)
const shareLink = ref('')
const copyStatus = ref('')
const username = ref('Anonymous')
const avatars = ref([])
const isCloudSaving = ref(false)
const originalFormat = ref('')

const returnPath = computed(() => {
  const app = localStorage.getItem('lemhand_standalone_app')
  return app === 'word' ? '/app/word' : '/office'
})

const pageSettings = ref({
  margins: 96,
  orientation: 'portrait',
  size: 'letter',
  showRuler: true,
  showGridlines: false,
  zoom: 100,
  spellcheck: true
})

const pageWidth = computed(() => {
  if (pageSettings.value.size === 'letter') return pageSettings.value.orientation === 'portrait' ? 816 : 1056
  if (pageSettings.value.size === 'a4') return pageSettings.value.orientation === 'portrait' ? 794 : 1123
  return 816
})

const pageHeight = computed(() => {
  if (pageSettings.value.size === 'letter') return pageSettings.value.orientation === 'portrait' ? 1056 : 816
  if (pageSettings.value.size === 'a4') return pageSettings.value.orientation === 'portrait' ? 1123 : 794
  return 1056
})

const setMargin = (val) => { pageSettings.value.margins = val; saveToCloud() }
const setOrientation = (val) => { pageSettings.value.orientation = val; saveToCloud() }
const setSize = (val) => { pageSettings.value.size = val; saveToCloud() }
const setZoom = (val) => { pageSettings.value.zoom = val; saveToCloud() }
const toggleRuler = () => { pageSettings.value.showRuler = !pageSettings.value.showRuler; saveToCloud() }
const toggleGridlines = () => { pageSettings.value.showGridlines = !pageSettings.value.showGridlines; saveToCloud() }
const toggleSpellcheck = () => { 
  pageSettings.value.spellcheck = !pageSettings.value.spellcheck; 
  saveToCloud();
  showModal('Spell Check', pageSettings.value.spellcheck ? 'Spell check enabled. Misspellings will be underlined in red.' : 'Spell check disabled.')
}

// Custom Modal State
const modal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'alert', // alert, confirm, prompt
  inputValue: '',
  onConfirm: null
})

const showModal = (title, message, type = 'alert', onConfirm = null, defaultValue = '') => {
  modal.value = { visible: true, title, message, type, onConfirm, inputValue: defaultValue }
}

const closeModal = () => { modal.value.visible = false }
const confirmModal = () => {
  if (modal.value.onConfirm) {
    modal.value.onConfirm(modal.value.inputValue)
  }
  closeModal()
}

const icons = {
  save: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17,3H5C3.89,3 3,3.9 3,5V19C3,20.1 3.89,21 5,21H19C20.1,21 21,20.1 21,19V7L17,3M12,19C10.34,19 9,17.66 9,16C9,14.34 10.34,13 12,13C13.66,13 15,14.34 15,16C15,17.66 13.66,19 12,19M15,9H5V5H15V9Z"/></svg>`,
  undo: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.13,8 12.5,8Z"/></svg>`,
  redo: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.87,8 2.92,11.03 1.53,15.22L3.9,16C4.95,12.81 7.96,10.5 11.5,10.5C13.46,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z"/></svg>`,
  bold: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z"/></svg>`,
  italic: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z"/></svg>`,
  underline: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5,21H19V19H5V21M12,17A6,6 0 0,0 18,11V3H15.5V11A3.5,3.5 0 0,1 12,14.5A3.5,3.5 0 0,1 8.5,11V3H6V11A6,6 0 0,0 12,17Z"/></svg>`,
  image: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,5V19H5V5H19Z"/></svg>`,
  table: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10,4V9H20V4H10M4,4V9H8V4H4M4,11V16H8V11H4M10,11V16H20V11H10M4,18V23H8V18H4M10,18V23H20V18H10Z"/></svg>`
}

let clientId = localStorage.getItem('lemhand_office_client_id')
if (!clientId) {
  clientId = Date.now().toString(36) + Math.random().toString(36).substr(2)
  localStorage.setItem('lemhand_office_client_id', clientId)
}
const myUserObj = { id: clientId, name: '' }

let saveTimeout = null;
let isUpdatingFromServer = false;
let unsubscribe = null;

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
    showModal("Welcome", "Please enter your name to join this document:", "prompt", (val) => {
      const name = val || "Anonymous"
      localStorage.setItem('lemhand_office_name', name)
      username.value = name
      myUserObj.name = name
      updateUserPresence()
    })
  } else {
    username.value = storedName
    myUserObj.name = storedName
    updateUserPresence()
  }

  saveToRecents()

  const docRef = doc(db, 'office', docId)
  window.addEventListener('beforeunload', handleUnload)

  unsubscribe = onSnapshot(docRef, (docSnap) => {
    isDataLoaded = true;
    if (isMinTimePassed) isLoading.value = false;
    if (docSnap.exists() && editorDiv.value) {
      const data = docSnap.data()
      if (data.title) {
        documentTitle.value = data.title
        saveToRecents()
      }
      
      if (data.activeUsers) {
        avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      }
      
      if (editorDiv.value.innerHTML !== data.content && data.content !== undefined) {
        isUpdatingFromServer = true
        editorDiv.value.innerHTML = data.content || '<p>Start typing your document here...</p>'
        setTimeout(() => { isUpdatingFromServer = false }, 100)
      }

      if (headerDiv.value && data.headerContent !== undefined) {
        headerDiv.value.innerHTML = data.headerContent
      }
      if (footerDiv.value && data.footerContent !== undefined) {
        footerDiv.value.innerHTML = data.footerContent
      }
      if (data.pageSettings) {
        pageSettings.value = { ...pageSettings.value, ...data.pageSettings }
      }
      if (data.originalFormat) {
        originalFormat.value = data.originalFormat
      }
    }
  })
})

const updateUserPresence = () => {
  setDoc(doc(db, 'office', docId), { activeUsers: arrayUnion(myUserObj) }, { merge: true })
}

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  window.removeEventListener('beforeunload', handleUnload)
  handleUnload()
})

const saveToRecents = () => {
  let recents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
  recents = recents.filter(d => d.id !== docId)
  recents.push({ id: docId, type: 'word', title: documentTitle.value, lastOpened: Date.now() })
  localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
}

const saveToCloud = () => {
  if (isUpdatingFromServer || !editorDiv.value) return;
  isCloudSaving.value = true;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), {
        title: documentTitle.value,
        content: editorDiv.value.innerHTML,
        headerContent: headerDiv.value?.innerHTML || '',
        footerContent: footerDiv.value?.innerHTML || '',
        pageSettings: pageSettings.value,
        originalFormat: originalFormat.value,
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

const handleInput = () => { saveToCloud() }
watch(documentTitle, () => { saveToCloud() })

const execCmd = (command, value = null) => {
  document.execCommand(command, false, value)
  saveToCloud()
}

const deleteDocument = async () => {
  showModal("Delete Document", "Are you sure you want to PERMANENTLY delete this document?", "confirm", async (confirmed) => {
    if (confirmed) {
      try {
        await firestoreDelete(doc(db, 'office', docId))
        let recents = JSON.parse(localStorage.getItem('lemhand_office_recents') || '[]')
        recents = recents.filter(d => d.id !== docId)
        localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
        router.push('/office')
      } catch (e) {
        showModal("Error", "Error deleting: " + e.message)
      }
    }
  })
}

const insertImage = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > 800) { height *= 800 / width; width = 800; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          execCmd('insertImage', canvas.toDataURL('image/jpeg', 0.6));
        }
        img.src = readerEvent.target.result;
      }
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

const insertTable = () => {
  showModal("Insert Table", "How many rows?", "prompt", (rows) => {
    if (rows) {
      showModal("Insert Table", "How many columns?", "prompt", (cols) => {
        if (cols) {
          let table = '<table style="width:100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 15px;">';
          for (let r = 0; r < rows; r++) {
            table += '<tr>';
            for (let c = 0; c < cols; c++) { table += '<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>'; }
            table += '</tr>';
          }
          table += '</table><br/>';
          execCmd('insertHTML', table);
        }
      }, "3")
    }
  }, "3")
}

const openShare = () => { shareLink.value = window.location.href; isShareOpen.value = true; }
const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    copyStatus.value = 'Copied!';
    setTimeout(() => { copyStatus.value = ''; }, 3000);
  });
}

const uploadWord = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.docx'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        if (editorDiv.value) {
          editorDiv.value.innerHTML = result.value
          originalFormat.value = 'docx'
          saveToCloud()
        }
      } catch (err) {
        showModal("Error", "Could not parse document: " + err.message)
      }
    }
  }
  input.click()
}

const downloadWord = async () => {
  if (!editorDiv.value) return
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentTitle.value}</title></head><body>${editorDiv.value.innerHTML}</body></html>`;
  try {
    const blob = await HtmlDocx.asBlob(html);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${documentTitle.value}.docx`;
    a.click();
  } catch (err) {
    showModal("Error", "Could not generate download: " + err.message)
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    
    <!-- Custom Modal -->
    <div v-if="modal.visible" class="custom-modal-overlay">
      <div class="custom-modal">
        <h3>{{ modal.title }}</h3>
        <p>{{ modal.message }}</p>
        <input v-if="modal.type === 'prompt'" v-model="modal.inputValue" type="text" class="modal-input" @keyup.enter="confirmModal" autofocus>
        <div class="modal-actions">
          <button v-if="modal.type !== 'alert'" @click="closeModal" class="modal-btn secondary">Cancel</button>
          <button @click="confirmModal" class="modal-btn primary">{{ modal.type === 'confirm' ? 'Confirm' : 'OK' }}</button>
        </div>
      </div>
    </div>

    <!-- Loading Animation -->
    <div v-if="isLoading" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background:#f3f2f1; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <svg width="120" height="150" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="100" rx="4" fill="white" stroke="#2b579a" stroke-width="4"/>
        <path class="doc-line doc-line-1" d="M 25 35 L 75 35" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
        <path class="doc-line doc-line-2" d="M 25 50 L 75 50" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
        <path class="doc-line doc-line-3" d="M 25 65 L 60 65" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <div style="position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; color: #2b579a; font-weight: bold; font-size: 1.2rem;">
        LemHand Office
        <span style="font-size: 0.9rem; font-weight: normal; margin-top: 5px;">Loading LemWord...</span>
      </div>
    </div>

    <!-- Top Header -->
    <div style="background-color: #2b579a; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
      <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
        <RouterLink :to="returnPath" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">W</RouterLink>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        <button @click="saveToCloud" class="quick-btn" title="Save" v-html="icons.save"></button>
        <button @click="execCmd('undo')" class="quick-btn" title="Undo" v-html="icons.undo"></button>
        <button @click="execCmd('redo')" class="quick-btn" title="Redo" v-html="icons.redo"></button>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        
        <input v-model="documentTitle" class="header-title-input" placeholder="Enter document title...">
        
        <div v-if="originalFormat" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; margin-left: 5px;">.{{ originalFormat }}</div>

        <span v-if="isCloudSaving" style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saving...</span>
        <span v-else style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saved to LemCloud</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 10px;">
        <button @click="openShare" style="background: white; color: #2b579a; padding: 2px 12px; border-radius: 2px; border: none; font-weight: 600; font-size: 11px; cursor: pointer;">Share</button>
        <div style="display: flex; align-items: center; padding-right: 5px;">
          <div :title="username + ' (You)'" style="width: 24px; height: 24px; border-radius: 50%; background: #0078d4; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; z-index: 10;">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :title="avatar" :style="{ background: ['#107c41', '#d83b01', '#8764b8', '#c239b3'][idx % 4] }" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-left: -8px; z-index: 5;">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- Ribbon Tabs -->
    <div style="background: #f3f2f1; display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0;">
      <div v-for="tab in ['File', 'Home', 'Insert', 'Layout', 'Review', 'View', 'Help']" :key="tab" 
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
          <div style="display: grid; grid-template-columns: auto auto; gap: 4px;">
             <button @click="execCmd('paste')" class="small-ribbon-btn">Paste</button>
             <div style="display: flex; flex-direction: column; gap: 2px;">
                <button @click="execCmd('cut')" class="small-ribbon-btn" style="padding: 1px 4px; font-size: 10px;">Cut</button>
                <button @click="execCmd('copy')" class="small-ribbon-btn" style="padding: 1px 4px; font-size: 10px;">Copy</button>
             </div>
          </div>
          <label>Clipboard</label>
        </div>
        <div class="ribbon-group">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; gap: 2px;">
              <select @change="execCmd('fontName', $event.target.value)" class="ribbon-select" style="width: 90px;">
                <option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Courier New">Courier New</option><option value="Georgia">Georgia</option>
              </select>
              <select @change="execCmd('fontSize', $event.target.value)" class="ribbon-select" style="width: 45px;">
                <option value="1">8</option><option value="2">10</option><option value="3" selected>12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option>
              </select>
            </div>
            <div style="display: flex; gap: 2px;">
              <button @click="execCmd('bold')" class="small-ribbon-btn" v-html="icons.bold"></button>
              <button @click="execCmd('italic')" class="small-ribbon-btn" v-html="icons.italic"></button>
              <button @click="execCmd('underline')" class="small-ribbon-btn" v-html="icons.underline"></button>
              <div style="width: 1px; height: 16px; background: #ddd; margin: 0 2px;"></div>
              <input type="color" @change="e => execCmd('foreColor', e.target.value)" title="Font Color" style="width: 20px; border: none; height: 20px; cursor: pointer; padding: 0; background: none;">
              <input type="color" @change="e => execCmd('hiliteColor', e.target.value)" title="Highlight" style="width: 20px; border: none; height: 20px; cursor: pointer; padding: 0; background: none;" value="#ffff00">
            </div>
          </div>
          <label>Font</label>
        </div>
        <div class="ribbon-group">
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            <div style="display: flex; gap: 2px;">
              <button @click="execCmd('justifyLeft')" class="small-ribbon-btn">Left</button>
              <button @click="execCmd('justifyCenter')" class="small-ribbon-btn">Center</button>
              <button @click="execCmd('justifyRight')" class="small-ribbon-btn">Right</button>
            </div>
            <div style="display: flex; gap: 2px;">
               <button @click="execCmd('insertUnorderedList')" class="small-ribbon-btn">List</button>
               <button @click="execCmd('insertOrderedList')" class="small-ribbon-btn">Num</button>
            </div>
          </div>
          <label>Paragraph</label>
        </div>
      </template>

      <!-- Insert Tab -->
      <template v-if="activeTab === 'Insert'">
        <div class="ribbon-group">
          <button @click="insertImage" class="big-ribbon-btn" v-html="icons.image + '<span>Pictures</span>'"></button>
          <button @click="insertTable" class="big-ribbon-btn" v-html="icons.table + '<span>Table</span>'"></button>
          <label>Illustrations</label>
        </div>
        <div class="ribbon-group">
           <button @click="headerDiv.focus()" class="big-ribbon-btn">🔝 Header</button>
           <button @click="footerDiv.focus()" class="big-ribbon-btn">⌂ Footer</button>
           <label>Header & Footer</label>
        </div>
      </template>

      <!-- File Tab -->
      <template v-if="activeTab === 'File'">
        <div class="ribbon-group">
          <button @click="uploadWord" class="big-ribbon-btn">📤 <br>Upload .docx</button>
          <label>Import</label>
        </div>
        <div class="ribbon-group">
          <button @click="downloadWord" class="big-ribbon-btn">📥 <br>Download .docx</button>
          <button @click="window.print()" class="big-ribbon-btn">🖨️ <br>Print</button>
          <label>Export</label>
        </div>
        <div class="ribbon-group">
          <button @click="deleteDocument" class="big-ribbon-btn" style="color: #d13438;">🗑️ <br>Delete</button>
          <label>Actions</label>
        </div>
      </template>

      <!-- Layout Tab -->
      <template v-if="activeTab === 'Layout'">
        <div class="ribbon-group">
           <button @click="setMargin(96)" class="small-ribbon-btn" :class="{active: pageSettings.margins === 96}">Normal</button>
           <button @click="setMargin(48)" class="small-ribbon-btn" :class="{active: pageSettings.margins === 48}">Narrow</button>
           <button @click="setMargin(144)" class="small-ribbon-btn" :class="{active: pageSettings.margins === 144}">Wide</button>
           <label>Margins</label>
        </div>
        <div class="ribbon-group">
           <button @click="setOrientation('portrait')" class="small-ribbon-btn" :class="{active: pageSettings.orientation === 'portrait'}">Portrait</button>
           <button @click="setOrientation('landscape')" class="small-ribbon-btn" :class="{active: pageSettings.orientation === 'landscape'}">Landscape</button>
           <label>Orientation</label>
        </div>
        <div class="ribbon-group">
           <button @click="setSize('letter')" class="small-ribbon-btn" :class="{active: pageSettings.size === 'letter'}">Letter</button>
           <button @click="setSize('a4')" class="small-ribbon-btn" :class="{active: pageSettings.size === 'a4'}">A4</button>
           <label>Size</label>
        </div>
      </template>

      <!-- Review Tab -->
      <template v-if="activeTab === 'Review'">
        <div class="ribbon-group">
           <button @click="toggleSpellcheck()" class="big-ribbon-btn" :style="{ background: pageSettings.spellcheck ? '#e1dfdd' : 'transparent' }">✓ Spelling</button>
           <label>Proofing</label>
        </div>
        <div class="ribbon-group">
           <button @click="showModal('Word Count', 'Words: ' + (editorDiv ? editorDiv.innerText.split(/\s+/).filter(w => w.length > 0).length : 0) + '\nCharacters: ' + (editorDiv ? editorDiv.innerText.length : 0))" class="big-ribbon-btn"># 123 Count</button>
           <label>Word Count</label>
        </div>
        <div class="ribbon-group">
           <button @click="showModal('Track Changes', 'Track changes enabled.')" class="big-ribbon-btn">✎ Track</button>
           <button @click="showModal('Comments', 'Add a comment functionality coming soon.')" class="big-ribbon-btn">💬 Comment</button>
           <label>Tracking & Comments</label>
        </div>
      </template>

      <!-- View Tab -->
      <template v-if="activeTab === 'View'">
        <div class="ribbon-group">
           <button @click="setZoom(100)" class="small-ribbon-btn" :class="{active: pageSettings.zoom === 100}">100%</button>
           <button @click="setZoom(150)" class="small-ribbon-btn" :class="{active: pageSettings.zoom === 150}">150%</button>
           <button @click="setZoom(200)" class="small-ribbon-btn" :class="{active: pageSettings.zoom === 200}">200%</button>
           <label>Zoom</label>
        </div>
        <div class="ribbon-group">
           <button @click="toggleRuler()" class="small-ribbon-btn" :class="{active: pageSettings.showRuler}">Ruler</button>
           <button @click="toggleGridlines()" class="small-ribbon-btn" :class="{active: pageSettings.showGridlines}">Gridlines</button>
           <label>Show</label>
        </div>
      </template>

      <!-- Help Tab -->
      <template v-if="activeTab === 'Help'">
        <div class="ribbon-group">
           <button @click="showModal('Help', 'Search for help articles or contact support.')" class="big-ribbon-btn">❓ Help</button>
           <button @click="showModal('Feedback', 'Thank you for your feedback!')" class="big-ribbon-btn">📢 Feedback</button>
           <label>Support</label>
        </div>
      </template>
    </div>

    <!-- Editor Area -->
    <div style="flex-grow: 1; overflow-y: auto; overflow-x: auto; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; background: #e1dfdd; position: relative;">
      
      <!-- Ruler (Aesthetics) -->
      <div v-if="pageSettings.showRuler" class="ruler-horizontal" :style="{ width: pageWidth + 'px' }"></div>

      <!-- Page Container -->
      <div class="word-page-container" :style="{ width: pageWidth + 'px', minHeight: pageHeight + 'px', transform: `scale(${pageSettings.zoom / 100})`, transformOrigin: 'top center', backgroundImage: pageSettings.showGridlines ? 'radial-gradient(#ccc 1px, transparent 1px)' : 'none', backgroundSize: '20px 20px' }">
        <!-- Header -->
        <div 
          ref="headerDiv" 
          class="page-header" 
          :style="{ padding: `20px ${pageSettings.margins}px` }"
          contenteditable="true" 
          @input="handleInput"
          placeholder="Double click to edit header"
        ></div>

        <!-- Main Editor -->
        <div 
          ref="editorDiv"
          @input="handleInput"
          contenteditable="true" 
          :spellcheck="pageSettings.spellcheck"
          class="main-editor"
          :style="{ padding: `0 ${pageSettings.margins}px` }"
        >
          <p>Start typing your document here...</p>
        </div>

        <!-- Footer -->
        <div 
          ref="footerDiv" 
          class="page-footer" 
          :style="{ padding: `20px ${pageSettings.margins}px` }"
          contenteditable="true" 
          @input="handleInput"
          placeholder="Double click to edit footer"
        ></div>
      </div>
    </div>

    <!-- Status Bar -->
    <div style="background: #2b579a; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
      <div>Page 1 of 1 | {{ editorDiv ? editorDiv.innerText.split(/\s+/).filter(w => w.length > 0).length : 0 }} Words</div>
      <div>100% | LemCloud {{ isCloudSaving ? 'Syncing...' : 'Connected' }}</div>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" class="modal-overlay">
      <div class="modal">
        <h3>Share Document</h3>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" class="share-input">
        <p v-if="copyStatus" style="color: green; font-size: 12px;">{{ copyStatus }}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false" class="modal-btn secondary">Close</button>
          <button @click="copyLink" class="modal-btn primary">Copy Link</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-btn { background: transparent; border: none; color: white; padding: 4px 8px; cursor: pointer; border-radius: 2px; display: flex; align-items: center; }
.quick-btn:hover { background: rgba(255,255,255,0.2); }

.header-title-input { background: transparent; border: 1px solid transparent; color: white; font-weight: 600; font-size: 12px; padding: 2px 8px; border-radius: 2px; outline: none; width: 250px; }
.header-title-input:hover { background: rgba(255,255,255,0.1); }
.header-title-input:focus { background: white; color: #2b579a; }

.ribbon-tab { padding: 6px 12px; font-size: 12px; color: #333; cursor: pointer; border-bottom: 3px solid transparent; }
.ribbon-tab:hover { background: #e1dfdd; }
.ribbon-tab.active { border-bottom-color: #2b579a; font-weight: 600; background: #fff; }

.ribbon-panel { background: #fff; height: 95px; display: flex; padding: 5px 10px; gap: 15px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; overflow-x: auto; }
.ribbon-panel.hidden { height: 0; padding: 0; overflow: hidden; }

.ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid #f3f2f1; padding-right: 15px; height: 100%; min-width: max-content; }
.ribbon-group label { font-size: 9px; color: #666; margin-top: auto; text-transform: uppercase; padding-top: 5px; }

.big-ribbon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; gap: 2px; }
.big-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }

.small-ribbon-btn { background: transparent; border: 1px solid transparent; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; }
.small-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }
.small-ribbon-btn.active { background: #e1dfdd; font-weight: bold; }

.ribbon-select { font-size: 11px; padding: 2px; border: 1px solid #e1dfdd; outline: none; background: white; }

/* Page Layout */
.word-page-container {
  width: 816px; /* 8.5in at 96dpi */
  min-height: 1056px; /* 11in at 96dpi */
  background: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  padding: 0;
  margin-bottom: 40px;
  position: relative;
}

.main-editor {
  flex-grow: 1;
  padding: 0 96px; /* 1 inch side margins */
  outline: none;
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.page-header, .page-footer {
  height: 96px; /* 1 inch */
  padding: 20px 96px;
  font-size: 12px;
  color: #888;
  outline: none;
  border: 1px dashed transparent;
  transition: border-color 0.2s;
}
.page-header:hover, .page-footer:hover { border-color: #ddd; }
.page-header:focus, .page-footer:focus { border-color: #2b579a; color: #333; }

.ruler-horizontal {
  width: 816px;
  height: 20px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 5px;
  background-image: linear-gradient(90deg, #ccc 1px, transparent 0);
  background-size: 96px 100%; /* inch marks */
}

/* Custom Modal Styles */
.custom-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4); z-index: 2000000;
  display: flex; align-items: center; justify-content: center;
}
.custom-modal {
  background: white; padding: 25px; border-radius: 4px; width: 350px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}
.custom-modal h3 { font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #2b579a; }
.custom-modal p { font-size: 14px; margin-bottom: 20px; color: #333; line-height: 1.4; }
.modal-input {
  width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
  margin-bottom: 20px; outline: none;
}
.modal-input:focus { border-color: #2b579a; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-btn {
  padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600;
}
.modal-btn.primary { background: #2b579a; color: white; }
.modal-btn.secondary { background: #f3f2f1; color: #333; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; padding: 25px; border-radius: 4px; width: 400px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.share-input { width: 100%; padding: 10px; border: 1px solid #ccc; margin: 15px 0; border-radius: 4px; }

/* Loading Lines */
.doc-line { stroke-dasharray: 50; stroke-dashoffset: 50; animation: draw-line 1.5s infinite ease-in-out alternate; }
.doc-line-1 { animation-delay: 0s; }
.doc-line-2 { animation-delay: 0.2s; }
.doc-line-3 { animation-delay: 0.4s; }
@keyframes draw-line { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
</style>
