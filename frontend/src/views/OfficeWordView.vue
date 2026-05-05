<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, deleteDoc as firestoreDelete } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const documentTitle = ref('Untitled Word Document')
const activeTab = ref('Home')
const isRibbonVisible = ref(true)
const textColor = ref('#000000')
const bgColor = ref('#ffffff')
const editorDiv = ref(null)
const isShareOpen = ref(false)
const shareLink = ref('')
const copyStatus = ref('')
const username = ref('Anonymous')
const avatars = ref([])
const isCloudSaving = ref(false)

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
  if (confirm('Are you sure you want to PERMANENTLY delete this document? This cannot be undone.')) {
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

const changeColor = (e) => { execCmd('foreColor', e.target.value) }
const changeBgColor = (e) => { execCmd('hiliteColor', e.target.value) }

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
  const rows = prompt("Rows:", "3"); const cols = prompt("Cols:", "3");
  if (rows && cols) {
    let table = '<table style="width:100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 15px;">';
    for (let r = 0; r < rows; r++) {
      table += '<tr>';
      for (let c = 0; c < cols; c++) { table += '<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>'; }
      table += '</tr>';
    }
    table += '</table><br/>';
    execCmd('insertHTML', table);
  }
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
  <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    
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
        <RouterLink to="/office" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">W</RouterLink>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        <button @click="saveToCloud" class="quick-btn" title="Save">💾</button>
        <button @click="execCmd('undo')" class="quick-btn" title="Undo">↩</button>
        <button @click="execCmd('redo')" class="quick-btn" title="Redo">↪</button>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        
        <!-- Renaming Input -->
        <input 
          v-model="documentTitle" 
          class="header-title-input"
          placeholder="Enter document title..."
        >
        
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
             <button @click="execCmd('paste')" class="small-ribbon-btn">📋 Paste</button>
             <div style="display: flex; flex-direction: column; gap: 2px;">
                <button @click="execCmd('cut')" class="small-ribbon-btn" style="padding: 1px 4px; font-size: 10px;">✂ Cut</button>
                <button @click="execCmd('copy')" class="small-ribbon-btn" style="padding: 1px 4px; font-size: 10px;">📄 Copy</button>
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
              <!-- Text Size Selector -->
              <select @change="execCmd('fontSize', $event.target.value)" class="ribbon-select" style="width: 45px;">
                <option value="1">8</option><option value="2">10</option><option value="3" selected>12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option>
              </select>
            </div>
            <div style="display: flex; gap: 2px;">
              <button @click="execCmd('bold')" class="small-ribbon-btn"><b>B</b></button>
              <button @click="execCmd('italic')" class="small-ribbon-btn"><i>I</i></button>
              <button @click="execCmd('underline')" class="small-ribbon-btn"><u>U</u></button>
              <button @click="execCmd('strikeThrough')" class="small-ribbon-btn"><s>S</s></button>
              <div style="width: 1px; height: 16px; background: #ddd; margin: 0 2px;"></div>
              <input type="color" @change="changeColor" title="Font Color" style="width: 20px; border: none; height: 20px; cursor: pointer; padding: 0; background: none;">
              <input type="color" @change="changeBgColor" title="Highlight" style="width: 20px; border: none; height: 20px; cursor: pointer; padding: 0; background: none;" value="#ffff00">
            </div>
          </div>
          <label>Font</label>
        </div>
        <div class="ribbon-group">
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
            <div style="display: flex; gap: 2px;">
              <button @click="execCmd('justifyLeft')" class="small-ribbon-btn">⫷</button>
              <button @click="execCmd('justifyCenter')" class="small-ribbon-btn">≡</button>
              <button @click="execCmd('justifyRight')" class="small-ribbon-btn">⫸</button>
              <button @click="execCmd('justifyFull')" class="small-ribbon-btn">≣</button>
            </div>
            <div style="display: flex; gap: 2px;">
               <button @click="execCmd('insertUnorderedList')" class="small-ribbon-btn">• List</button>
               <button @click="execCmd('insertOrderedList')" class="small-ribbon-btn">1. List</button>
            </div>
          </div>
          <label>Paragraph</label>
        </div>
        <div class="ribbon-group">
           <div style="display: flex; gap: 5px;">
              <div @click="execCmd('formatBlock', 'p')" class="style-preview">AaBbCc<br>Normal</div>
              <div @click="execCmd('formatBlock', 'h1')" class="style-preview" style="font-weight: bold; font-size: 14px;">AaBbCc<br>Title</div>
           </div>
           <label>Styles</label>
        </div>
      </template>

      <!-- Insert Tab -->
      <template v-if="activeTab === 'Insert'">
        <div class="ribbon-group">
          <button @click="insertImage" class="big-ribbon-btn">🖼 Pictures</button>
          <button @click="insertTable" class="big-ribbon-btn">▦ Table</button>
          <label>Illustrations</label>
        </div>
        <div class="ribbon-group">
          <button @click="execCmd('createLink', prompt('Link:'))" class="big-ribbon-btn">🔗 Link</button>
          <button @click="execCmd('insertHorizontalRule')" class="big-ribbon-btn">➖ Line</button>
          <label>Links</label>
        </div>
        <div class="ribbon-group">
           <button class="big-ribbon-btn">🔝 Header</button>
           <button class="big-ribbon-btn">⌂ Footer</button>
           <button class="big-ribbon-btn">🔢 Page #</button>
           <label>Header & Footer</label>
        </div>
      </template>

      <!-- Layout Tab -->
      <template v-if="activeTab === 'Layout'">
        <div class="ribbon-group">
           <button class="big-ribbon-btn">↔ Margins</button>
           <button class="big-ribbon-btn">↕ Orientation</button>
           <button class="big-ribbon-btn">📄 Size</button>
           <label>Page Setup</label>
        </div>
      </template>

      <!-- Review Tab -->
      <template v-if="activeTab === 'Review'">
        <div class="ribbon-group">
          <button class="big-ribbon-btn">ABC Spelling</button>
          <button class="big-ribbon-btn">🌐 Translate</button>
          <label>Proofing</label>
        </div>
        <div class="ribbon-group">
           <button @click="alert('Word Count: ' + editorDiv.innerText.split(/\s+/).length)" class="big-ribbon-btn">🔢 Word Count</button>
           <label>Statistics</label>
        </div>
      </template>

      <!-- View Tab -->
      <template v-if="activeTab === 'View'">
         <div class="ribbon-group">
            <button class="big-ribbon-btn">📖 Reading</button>
            <button class="big-ribbon-btn">🖻 Web Layout</button>
            <label>Views</label>
         </div>
         <div class="ribbon-group">
            <button @click="editorDiv.style.zoom = '1.2'" class="small-ribbon-btn">➕ Zoom In</button>
            <button @click="editorDiv.style.zoom = '1.0'" class="small-ribbon-btn">⌂ 100%</button>
            <button @click="editorDiv.style.zoom = '0.8'" class="small-ribbon-btn">➖ Zoom Out</button>
            <label>Zoom</label>
         </div>
      </template>

      <!-- File Tab -->
      <template v-if="activeTab === 'File'">
        <div class="ribbon-group">
          <button @click="window.print()" class="big-ribbon-btn">🖨 Print</button>
          <button @click="deleteDocument" class="big-ribbon-btn" style="color: #d13438;">🗑 Delete Document</button>
          <label>Actions</label>
        </div>
      </template>
    </div>

    <!-- Editor Area -->
    <div style="flex-grow: 1; overflow-y: auto; padding: 40px 20px; display: flex; justify-content: center; background: #e1dfdd;">
      <div 
        ref="editorDiv"
        @input="handleInput"
        contenteditable="true" 
        style="width: 100%; max-width: 800px; min-height: 1056px; background: white; color: black; padding: 96px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); outline: none; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;"
      >
        <p>Start typing your document here...</p>
      </div>
    </div>

    <!-- Status Bar -->
    <div style="background: #2b579a; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
      <div>Page 1 of 1 | English (United States) | {{ editorDiv ? editorDiv.innerText.split(/\s+/).filter(w => w.length > 0).length : 0 }} Words</div>
      <div>100% | LemCloud {{ isCloudSaving ? 'Syncing...' : 'Connected' }}</div>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" class="modal-overlay">
      <div class="modal">
        <h2>Share Document</h2>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" class="share-input">
        <p v-if="copyStatus" style="color: green;">{{ copyStatus }}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false">Close</button>
          <button @click="copyLink" style="background: #2b579a; color: white; border: none; padding: 5px 15px; border-radius: 4px;">Copy</button>
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
  color: #2b579a;
  border-color: white;
}

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

.ribbon-select { font-size: 11px; padding: 2px; border: 1px solid #e1dfdd; outline: none; background: white; }

.style-preview {
   border: 1px solid #e1dfdd;
   padding: 4px 8px;
   font-size: 10px;
   cursor: pointer;
   background: #faf9f8;
   border-radius: 2px;
   text-align: center;
   line-height: 1.2;
   min-width: 60px;
}
.style-preview:hover { background: #f3f2f1; border-color: #c8c6c4; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; padding: 30px; border-radius: 8px; width: 400px; }
.share-input { width: 100%; padding: 10px; border: 1px solid #ccc; margin: 15px 0; }

.doc-line {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: draw-line 1.5s infinite ease-in-out alternate;
}
.doc-line-1 { animation-delay: 0s; }
.doc-line-2 { animation-delay: 0.2s; }
.doc-line-3 { animation-delay: 0.4s; }

@keyframes draw-line {
  0% { stroke-dashoffset: 50; }
  100% { stroke-dashoffset: 0; }
}
</style>
