<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useRoute } from 'vue-router'

const route = useRoute()
const docId = route.params.id

const documentTitle = ref('Untitled Word Document')
const textColor = ref('#000000')
const bgColor = ref('#ffffff')
const editorDiv = ref(null)
const isShareOpen = ref(false)
const shareLink = ref('')
const copyStatus = ref('')
const activeMenu = ref(null)
const username = ref('Anonymous')
const avatars = ref([])

let clientId = localStorage.getItem('lemhand_office_client_id')
if (!clientId) {
  clientId = Date.now().toString(36) + Math.random().toString(36).substr(2)
  localStorage.setItem('lemhand_office_client_id', clientId)
}
const myUserObj = { id: clientId, name: '' }

let saveTimeout = null;
let isUpdatingFromServer = false;
let unsubscribe = null;

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

  // Connect to Firebase
  const docRef = doc(db, 'office', docId)
  
  // Join the document
  setDoc(docRef, { activeUsers: arrayUnion(myUserObj) }, { merge: true })
  window.addEventListener('beforeunload', handleUnload)

  unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists() && editorDiv.value) {
      const data = docSnap.data()
      if (data.title) {
        documentTitle.value = data.title
        saveToRecents()
      }
      
      if (data.activeUsers) {
        // Use Set to remove duplicate ghost names
        avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      }
      
      // Only update HTML if it changed to prevent constant cursor resetting
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
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), {
        title: documentTitle.value,
        content: editorDiv.value.innerHTML,
        lastUpdated: new Date()
      }, { merge: true })
      saveToRecents()
    } catch (e) {
      console.error("Error saving:", e)
    }
  }, 1000); // 1s debounce
}

const handleInput = () => {
  saveToCloud()
}

watch(documentTitle, () => {
  saveToCloud()
})

const execCmd = (command, value = null) => {
  document.execCommand(command, false, value)
  saveToCloud()
}

const toggleMenu = (menu) => {
  activeMenu.value = activeMenu.value === menu ? null : menu
}

// Click outside to close menus
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container')) {
    activeMenu.value = null
  }
})

const changeColor = (e) => {
  execCmd('foreColor', e.target.value)
}

const changeBgColor = (e) => {
  execCmd('hiliteColor', e.target.value)
}

const insertLink = () => {
  const url = prompt('Enter the link URL:', 'http://')
  if (url) execCmd('createLink', url)
}

const insertImage = () => {
  const url = prompt('Enter the image URL:', 'http://')
  if (url) execCmd('insertImage', url)
}

const printDoc = () => {
  window.print()
}

const downloadHTML = () => {
  if (!editorDiv.value) return;
  const content = editorDiv.value.innerHTML;
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${documentTitle.value}</title><style>body{font-family:Arial,sans-serif;font-size:16px;line-height:1.6;max-width:800px;margin:40px auto;padding:40px;}</style></head><body>${content}</body></html>`;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  triggerDownload(blob, `${documentTitle.value}.html`);
}

const downloadDOC = () => {
  if (!editorDiv.value) return;
  const content = editorDiv.value.innerHTML;
  const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${documentTitle.value}</title></head><body>${content}</body></html>`;
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  triggerDownload(blob, `${documentTitle.value}.doc`);
}

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  <div style="display: flex; flex-direction: column; height: calc(100vh - 54px); background-color: #f3f2f1; position: relative;">
    <!-- Enterprise Header -->
    <div style="background-color: #2b579a; color: white; padding: 8px 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <RouterLink to="/office" style="color: white; font-size: 1.2rem; text-decoration: none; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 5px;">
          <strong style="background: white; color: #2b579a; padding: 0px 4px; border-radius: 2px;">W</strong> 
          ⌂
        </RouterLink>
        <div class="menu-container" style="display: flex; flex-direction: column; gap: 2px;">
          <input type="text" v-model="documentTitle" style="background: transparent; border: 1px solid transparent; color: white; font-size: 1.1rem; outline: none; font-weight: 600; width: 300px; padding: 2px 4px; border-radius: 2px;" onfocus="this.style.border='1px solid rgba(255,255,255,0.5)'" onblur="this.style.border='1px solid transparent'">
          <div style="display: flex; gap: 5px; font-size: 13px; color: rgba(255,255,255,0.9); margin-left: 2px;">
            <div style="position: relative;">
              <span @click="toggleMenu('file')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'file' ? 'rgba(255,255,255,0.2)' : 'transparent' }">File</span>
              <div v-if="activeMenu === 'file'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="downloadDOC(); activeMenu=null" class="menu-item">Download .DOC</div>
                <div @click="downloadHTML(); activeMenu=null" class="menu-item">Download .HTML</div>
                <div @click="printDoc(); activeMenu=null" class="menu-item">Print...</div>
              </div>
            </div>
            <div style="position: relative;">
              <span @click="toggleMenu('edit')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'edit' ? 'rgba(255,255,255,0.2)' : 'transparent' }">Edit</span>
              <div v-if="activeMenu === 'edit'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="execCmd('undo'); activeMenu=null" class="menu-item">Undo</div>
                <div @click="execCmd('redo'); activeMenu=null" class="menu-item">Redo</div>
                <hr style="margin: 5px 0; border: 0; border-top: 1px solid #e1dfdd;">
                <div @click="execCmd('selectAll'); activeMenu=null" class="menu-item">Select All</div>
              </div>
            </div>
            <div style="position: relative;">
              <span @click="toggleMenu('insert')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'insert' ? 'rgba(255,255,255,0.2)' : 'transparent' }">Insert</span>
              <div v-if="activeMenu === 'insert'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="insertImage(); activeMenu=null" class="menu-item">Image...</div>
                <div @click="insertLink(); activeMenu=null" class="menu-item">Link...</div>
                <div @click="execCmd('insertHorizontalRule'); activeMenu=null" class="menu-item">Horizontal Line</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Collaboration -->
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 12px; color: rgba(255,255,255,0.6);">☁ Saved to LemCloud</span>
        <div style="display: flex; align-items: center;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #0078d4; border: 2px solid #2b579a; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: -10px; z-index: 99;" :title="username + ' (You)'">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :style="{ background: ['#107c41', '#d83b01', '#8764b8', '#c239b3'][idx % 4], zIndex: 98 - idx }" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #2b579a; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: -10px;" :title="avatar">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
        <button @click="openShare" style="background: white; color: #2b579a; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 5px;">
          👤 Share
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div style="background-color: white; padding: 8px 20px; border-bottom: 1px solid #e1dfdd; display: flex; gap: 8px; flex-wrap: wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.05); align-items: center;">
      <!-- Undo / Redo -->
      <button class="toolbar-btn" @click="execCmd('undo')" title="Undo">↩</button>
      <button class="toolbar-btn" @click="execCmd('redo')" title="Redo">↪</button>
      <div class="toolbar-divider"></div>

      <!-- Fonts -->
      <select @change="execCmd('fontName', $event.target.value)" class="toolbar-select" style="width: 120px;">
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>
      <select @change="execCmd('fontSize', $event.target.value)" class="toolbar-select">
        <option value="3">12pt</option>
        <option value="1">8pt</option>
        <option value="2">10pt</option>
        <option value="4">14pt</option>
        <option value="5">18pt</option>
        <option value="6">24pt</option>
        <option value="7">36pt</option>
      </select>
      <div class="toolbar-divider"></div>

      <!-- Text Formatting -->
      <button class="toolbar-btn" @click="execCmd('bold')" title="Bold" style="font-weight: bold;">B</button>
      <button class="toolbar-btn" @click="execCmd('italic')" title="Italic" style="font-style: italic;">I</button>
      <button class="toolbar-btn" @click="execCmd('underline')" title="Underline" style="text-decoration: underline;">U</button>
      <button class="toolbar-btn" @click="execCmd('strikeThrough')" title="Strikethrough" style="text-decoration: line-through;">S</button>
      <div class="toolbar-divider"></div>

      <!-- Colors -->
      <label style="display: flex; align-items: center; gap: 5px; font-size: 14px; cursor: pointer;">
        <span style="font-weight: bold; border-bottom: 3px solid #000;">A</span> 
        <input type="color" v-model="textColor" @change="changeColor" style="padding: 0; border: none; width: 20px; height: 20px; cursor: pointer;" title="Text Color">
      </label>
      <label style="display: flex; align-items: center; gap: 5px; font-size: 14px; cursor: pointer; margin-right: 5px;">
        🖍 <input type="color" v-model="bgColor" @change="changeBgColor" style="padding: 0; border: none; width: 20px; height: 20px; cursor: pointer;" title="Highlight Color">
      </label>
      <div class="toolbar-divider"></div>

      <!-- Alignment -->
      <button class="toolbar-btn" @click="execCmd('justifyLeft')" title="Align Left">⫷</button>
      <button class="toolbar-btn" @click="execCmd('justifyCenter')" title="Align Center">≡</button>
      <button class="toolbar-btn" @click="execCmd('justifyRight')" title="Align Right">⫸</button>
      <div class="toolbar-divider"></div>

      <!-- Lists -->
      <button class="toolbar-btn" @click="execCmd('insertUnorderedList')" title="Bullet List">•</button>
      <button class="toolbar-btn" @click="execCmd('insertOrderedList')" title="Number List">1.</button>
      <button class="toolbar-btn" @click="execCmd('outdent')" title="Decrease Indent">⇤</button>
      <button class="toolbar-btn" @click="execCmd('indent')" title="Increase Indent">⇥</button>
      <div class="toolbar-divider"></div>

      <!-- Insert -->
      <button class="toolbar-btn" @click="insertLink" title="Insert Link">🔗</button>
      <button class="toolbar-btn" @click="insertImage" title="Insert Image">🖼</button>

      <!-- Print/Download -->
      <div style="margin-left: auto; display: flex; gap: 8px;">
        <button class="toolbar-btn" @click="downloadDOC" title="Download as Word DOC" style="background: #e1dfdd; font-weight: 600; color: #2b579a;">⬇ .DOC</button>
        <button class="toolbar-btn" @click="printDoc" title="Print to PDF">🖨️ PDF</button>
      </div>
    </div>

    <!-- Editor Area -->
    <div style="flex-grow: 1; overflow-y: auto; padding: 40px 20px; display: flex; justify-content: center;">
      <div 
        ref="editorDiv"
        @input="handleInput"
        contenteditable="true" 
        style="width: 100%; max-width: 800px; min-height: 1056px; background: white; color: black; padding: 96px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); outline: none; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;"
      >
        <p>Start typing your document here...</p>
      </div>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 30px; border-radius: 8px; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <h2 style="margin-bottom: 20px; color: #323130;">Share Document</h2>
        <p style="margin-bottom: 10px; color: #666; font-size: 14px;">Anyone with this link can join and collaborate in real-time.</p>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" style="width: 100%; padding: 10px; border: 1px solid #c8c6c4; border-radius: 4px; margin-bottom: 15px; outline: none; background: #f3f2f1; color: #333;">
        <p v-if="copyStatus" style="color: #107c41; margin-bottom: 15px; font-weight: 600; font-size: 14px;">{{ copyStatus }}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false" style="padding: 8px 16px; background: #e1dfdd; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Close</button>
          <button @click="copyLink" style="padding: 8px 16px; background: #2b579a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Copy Link</button>
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
}
.menu-item:hover {
  background: #f3f2f1;
}
.toolbar-btn {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #323130;
  display: flex;
  align-items: center;
  justify-content: center;
}
.toolbar-btn:hover {
  background: #f3f2f1;
  border-color: #e1dfdd;
}
.toolbar-select {
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #323130;
  font-size: 13px;
  cursor: pointer;
}
.toolbar-select:hover {
  background: #f3f2f1;
  border-color: #e1dfdd;
}
.toolbar-divider {
  width: 1px; 
  height: 24px; 
  background: #e1dfdd; 
  margin: 0 5px;
}
</style>
