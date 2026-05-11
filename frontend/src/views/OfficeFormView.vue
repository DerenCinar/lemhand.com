<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove, deleteDoc as firestoreDelete } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const docId = route.params.id

const formTitle = ref('Untitled Form')
const activeTab = ref('Home')
const isRibbonVisible = ref(true)
const isShareOpen = ref(false)
const shareLink = ref('')
const respondLink = ref('')
const copyStatus = ref('')
const username = ref('Anonymous')
const avatars = ref([])
const isCloudSaving = ref(false)

const returnPath = computed(() => {
  const app = localStorage.getItem('lemhand_standalone_app')
  return app === 'form' ? '/app/form' : '/office'
})

const formFields = ref([])
const formResponses = ref([])
const isViewingResponses = ref(false)

const pageSettings = ref({
  margins: 96,
  orientation: 'portrait',
  size: 'letter',
  showRuler: true,
  zoom: 100
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

const modal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'alert',
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
  image: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,5V19H5V5H19Z"/></svg>`,
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
    showModal("Welcome", "Please enter your name to use this form:", "prompt", (val) => {
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
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.title) {
        formTitle.value = data.title
        saveToRecents()
      }
      
      if (data.activeUsers) {
        avatars.value = Array.from(new Set(data.activeUsers.filter(u => u.id !== myUserObj.id).map(u => u.name)))
      }
      
      if (data.formFields && Array.isArray(data.formFields)) {
        isUpdatingFromServer = true
        formFields.value = data.formFields
        setTimeout(() => { isUpdatingFromServer = false }, 100)
      }

      if (data.formResponses && Array.isArray(data.formResponses)) {
        formResponses.value = data.formResponses
      }

      if (data.pageSettings) {
        pageSettings.value = { ...pageSettings.value, ...data.pageSettings }
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
  recents.push({ id: docId, type: 'form', title: formTitle.value, lastOpened: Date.now() })
  localStorage.setItem('lemhand_office_recents', JSON.stringify(recents))
}

const saveToCloud = () => {
  if (isUpdatingFromServer) return;
  isCloudSaving.value = true;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), {
        title: formTitle.value,
        formFields: formFields.value,
        formResponses: formResponses.value,
        pageSettings: pageSettings.value,
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

const handleInputChange = () => { saveToCloud() }
watch(formTitle, () => { saveToCloud() })

const addFormField = (type) => {
  const newField = {
    id: Date.now(),
    type: type,
    label: `${type} field`,
    required: false,
    placeholder: 'Enter text...',
    options: type === 'radio' || type === 'checkbox' || type === 'select' ? ['Option 1', 'Option 2'] : []
  }
  formFields.value.push(newField)
  saveToCloud()
}

const removeField = (fieldId) => {
  formFields.value = formFields.value.filter(f => f.id !== fieldId)
  saveToCloud()
}

const openShare = () => { 
  shareLink.value = window.location.href
  respondLink.value = window.location.href.replace('/office/form/', '/office/form/').split('?')[0] + '/respond'
  isShareOpen.value = true
}
const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    copyStatus.value = 'Edit link copied!';
    setTimeout(() => { copyStatus.value = ''; }, 3000);
  });
}
const copyRespondLink = () => {
  navigator.clipboard.writeText(respondLink.value).then(() => {
    copyStatus.value = 'Response link copied!';
    setTimeout(() => { copyStatus.value = ''; }, 3000);
  });
}

const deleteForm = async () => {
  showModal("Delete Form", "Are you sure you want to PERMANENTLY delete this form and all responses?", "confirm", async (confirmed) => {
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

const downloadResponses = () => {
  const headers = formFields.value.map(f => f.label)
  const rows = formResponses.value.map(response => 
    headers.map(header => response[header] || '')
  )
  
  const csv = [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${formTitle.value}-responses.csv`
  a.click()
}

const clearResponses = () => {
  showModal("Clear Responses", "Delete all form responses?", "confirm", (confirmed) => {
    if (confirmed) {
      formResponses.value = []
      saveToCloud()
      showModal("Success", "All responses cleared.")
    }
  })
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
        <rect x="10" y="10" width="80" height="100" rx="4" fill="white" stroke="#7b2cbf" stroke-width="4"/>
        <path class="doc-line doc-line-1" d="M 25 35 L 75 35" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
        <path class="doc-line doc-line-2" d="M 25 50 L 75 50" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
        <path class="doc-line doc-line-3" d="M 25 65 L 60 65" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <div style="position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; color: #7b2cbf; font-weight: bold; font-size: 1.2rem;">
        LemHand Office
        <span style="font-size: 0.9rem; font-weight: normal; margin-top: 5px;">Loading LemForm...</span>
      </div>
    </div>

    <!-- Top Header -->
    <div style="background-color: #7b2cbf; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
      <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
        <RouterLink :to="returnPath" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">F</RouterLink>
        <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
        <button @click="saveToCloud" class="quick-btn" title="Save" v-html="icons.save"></button>
        
        <input v-model="formTitle" class="header-title-input" placeholder="Enter form title...">
        
        <span v-if="isCloudSaving" style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saving...</span>
        <span v-else style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Saved to LemCloud</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 10px;">
        <button v-if="!isViewingResponses" @click="isViewingResponses = true" style="background: rgba(255,255,255,0.2); color: white; padding: 2px 12px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.4); font-weight: 600; font-size: 11px; cursor: pointer;">{{ formResponses.length }} Responses</button>
        <button v-else @click="isViewingResponses = false" style="background: rgba(255,255,255,0.2); color: white; padding: 2px 12px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.4); font-weight: 600; font-size: 11px; cursor: pointer;">← Back to Form</button>
        <button @click="openShare" style="background: white; color: #7b2cbf; padding: 2px 12px; border-radius: 2px; border: none; font-weight: 600; font-size: 11px; cursor: pointer;">Share</button>
        <div style="display: flex; align-items: center; padding-right: 5px;">
          <div :title="username + ' (You)'" style="width: 24px; height: 24px; border-radius: 50%; background: #7b2cbf; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; z-index: 10;">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :title="avatar" :style="{ background: ['#c239b3', '#f72585', '#a100f2', '#7b2cbf'][idx % 4] }" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; margin-left: -8px; z-index: 5;">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- Ribbon Tabs -->
    <div v-if="!isViewingResponses" style="background: #f3f2f1; display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0;">
      <div v-for="tab in ['Home', 'Insert', 'Layout', 'View']" :key="tab" 
           @click="activeTab = tab" 
           class="ribbon-tab" :class="{ active: activeTab === tab }">
        {{ tab }}
      </div>
    </div>

    <!-- Ribbon Panel -->
    <div v-if="!isViewingResponses" class="ribbon-panel" :class="{ hidden: !isRibbonVisible }">
      <!-- Home Tab -->
      <template v-if="activeTab === 'Home'">
        <div class="ribbon-group">
          <button @click="saveToCloud" class="big-ribbon-btn">💾 Save</button>
          <label>Actions</label>
        </div>
        <div class="ribbon-group">
          <button @click="deleteForm" class="big-ribbon-btn" style="color: #d13438;">🗑️ Delete</button>
          <label>Danger</label>
        </div>
      </template>

      <!-- Insert Tab -->
      <template v-if="activeTab === 'Insert'">
        <div class="ribbon-group">
          <button @click="addFormField('text')" class="small-ribbon-btn">Short Text</button>
          <button @click="addFormField('email')" class="small-ribbon-btn">Email</button>
          <button @click="addFormField('phone')" class="small-ribbon-btn">Phone</button>
          <label>Inputs</label>
        </div>
        <div class="ribbon-group">
          <button @click="addFormField('textarea')" class="small-ribbon-btn">Long Text</button>
          <button @click="addFormField('number')" class="small-ribbon-btn">Number</button>
          <label>Text</label>
        </div>
        <div class="ribbon-group">
          <button @click="addFormField('select')" class="small-ribbon-btn">Dropdown</button>
          <button @click="addFormField('radio')" class="small-ribbon-btn">Radio</button>
          <button @click="addFormField('checkbox')" class="small-ribbon-btn">Checkbox</button>
          <label>Choices</label>
        </div>
        <div class="ribbon-group">
          <button @click="addFormField('date')" class="small-ribbon-btn">Date</button>
          <button @click="addFormField('file')" class="small-ribbon-btn">File Upload</button>
          <label>Special</label>
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
      </template>

      <!-- View Tab -->
      <template v-if="activeTab === 'View'">
        <div class="ribbon-group">
           <button @click="setZoom(100)" class="small-ribbon-btn" :class="{active: pageSettings.zoom === 100}">100%</button>
           <button @click="setZoom(150)" class="small-ribbon-btn" :class="{active: pageSettings.zoom === 150}">150%</button>
           <button @click="toggleRuler()" class="small-ribbon-btn" :class="{active: pageSettings.showRuler}">Ruler</button>
           <label>Zoom</label>
        </div>
      </template>
    </div>

    <!-- Form Editor Area -->
    <div v-if="!isViewingResponses" style="flex-grow: 1; overflow-y: auto; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; background: #e1dfdd; position: relative;">
      
      <div v-if="pageSettings.showRuler" class="ruler-horizontal" :style="{ width: pageWidth + 'px' }"></div>

      <div class="form-page-container" :style="{ width: pageWidth + 'px', transform: `scale(${pageSettings.zoom / 100})`, transformOrigin: 'top center' }">
        <div style="padding: 20px; background: white; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; color: #7b2cbf;">{{ formTitle }}</h2>
          <p style="margin: 0; color: #666; font-size: 12px;">Share this form with others to gather responses</p>
        </div>

        <div class="form-fields-container">
          <template v-if="formFields.length === 0">
            <div style="padding: 40px 20px; text-align: center; color: #999;">
              <p>No fields added yet. Use the Insert tab to add fields to your form.</p>
            </div>
          </template>
          <template v-else>
            <div v-for="field in formFields" :key="field.id" class="form-field-editor">
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                <div style="flex-grow: 1;">
                  <input v-model="field.label" type="text" placeholder="Field label" class="field-label-input" @input="saveToCloud">
                  <input v-if="field.type !== 'checkbox' && field.type !== 'radio'" v-model="field.placeholder" type="text" placeholder="Placeholder text" class="field-input" @input="saveToCloud">
                  <div v-if="field.type === 'radio' || field.type === 'checkbox' || field.type === 'select'">
                    <div v-for="(opt, idx) in field.options" :key="idx" style="display: flex; gap: 5px; margin: 5px 0;">
                      <input v-model="field.options[idx]" type="text" :placeholder="`Option ${idx + 1}`" class="field-input" @input="saveToCloud">
                      <button @click="field.options.splice(idx, 1); saveToCloud()" style="background: #f0f0f0; border: 1px solid #ddd; padding: 4px 8px; border-radius: 2px; cursor: pointer; color: #d13438;">✕</button>
                    </div>
                    <button @click="field.options.push(`Option ${field.options.length + 1}`); saveToCloud()" style="background: #f0f0f0; border: 1px solid #ddd; padding: 4px 8px; border-radius: 2px; cursor: pointer; font-size: 12px; margin-top: 5px;">+ Add Option</button>
                  </div>
                  <label style="display: flex; gap: 5px; margin-top: 8px; font-size: 12px;">
                    <input type="checkbox" v-model="field.required" @change="saveToCloud">
                    Required field
                  </label>
                </div>
                <button @click="removeField(field.id)" style="background: #f0f0f0; border: 1px solid #ddd; padding: 6px 10px; border-radius: 2px; cursor: pointer; color: #d13438; white-space: nowrap;">Delete</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Responses View -->
    <div v-else style="flex-grow: 1; overflow-y: auto; padding: 20px; background: #f3f2f1;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: white; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #7b2cbf;">Form Responses ({{ formResponses.length }})</h2>
            <div style="display: flex; gap: 10px;">
              <button v-if="formResponses.length > 0" @click="downloadResponses" style="background: #7b2cbf; color: white; padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">📥 Download CSV</button>
              <button v-if="formResponses.length > 0" @click="clearResponses" style="background: #d13438; color: white; padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">🗑️ Clear All</button>
            </div>
          </div>
          
          <template v-if="formResponses.length === 0">
            <p style="color: #999; text-align: center; padding: 40px;">No responses yet</p>
          </template>
          <template v-else>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f0f0f0;">
                    <th v-for="field in formFields" :key="field.id" style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #7b2cbf; font-size: 13px;">{{ field.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(response, idx) in formResponses" :key="idx" :style="{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }">
                    <td v-for="field in formFields" :key="field.id" style="padding: 12px; border-bottom: 1px solid #eee; color: #333; font-size: 13px;">
                      {{ response[field.label] || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div style="background: #7b2cbf; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
      <div v-if="!isViewingResponses">{{ formFields.length }} fields</div>
      <div v-else>{{ formResponses.length }} responses</div>
      <div>{{ pageSettings.zoom }}% | LemCloud {{ isCloudSaving ? 'Syncing...' : 'Connected' }}</div>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" class="modal-overlay">
      <div class="modal">
        <h3>Share Form</h3>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 12px; color: #666; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">📝 Response Link (Share with respondents)</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" readonly :value="respondLink" @click="$event.target.select()" class="share-input" style="flex-grow: 1;">
            <button @click="copyRespondLink" style="background: #7b2cbf; color: white; padding: 8px 12px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600; font-size: 12px; white-space: nowrap;">Copy</button>
          </div>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-bottom: 20px;">
          <label style="display: block; font-size: 12px; color: #666; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">✏️ Edit Link (For you only)</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" readonly :value="shareLink" @click="$event.target.select()" class="share-input" style="flex-grow: 1;">
            <button @click="copyLink" style="background: #f3f2f1; color: #333; padding: 8px 12px; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; font-weight: 600; font-size: 12px; white-space: nowrap;">Copy</button>
          </div>
        </div>

        <p v-if="copyStatus" style="color: #7b2cbf; font-size: 12px; text-align: center; margin: 0;">{{ copyStatus }}</p>
        
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button @click="isShareOpen = false" class="modal-btn secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-btn { background: transparent; border: none; color: white; padding: 4px 8px; cursor: pointer; border-radius: 2px; display: flex; align-items: center; }
.quick-btn:hover { background: rgba(255,255,255,0.2); }

.header-title-input { background: transparent; border: 1px solid transparent; color: white; font-weight: 600; font-size: 12px; padding: 2px 8px; border-radius: 2px; outline: none; width: 300px; }
.header-title-input:hover { background: rgba(255,255,255,0.1); }
.header-title-input:focus { background: white; color: #7b2cbf; }

.ribbon-tab { padding: 6px 12px; font-size: 12px; color: #333; cursor: pointer; border-bottom: 3px solid transparent; }
.ribbon-tab:hover { background: #e1dfdd; }
.ribbon-tab.active { border-bottom-color: #7b2cbf; font-weight: 600; background: #fff; }

.ribbon-panel { background: #fff; height: 95px; display: flex; padding: 5px 10px; gap: 15px; border-bottom: 1px solid #e1dfdd; flex-shrink: 0; overflow-x: auto; }
.ribbon-panel.hidden { height: 0; padding: 0; overflow: hidden; }

.ribbon-group { display: flex; flex-direction: column; align-items: center; border-right: 1px solid #f3f2f1; padding-right: 15px; height: 100%; min-width: max-content; }
.ribbon-group label { font-size: 9px; color: #666; margin-top: auto; text-transform: uppercase; padding-top: 5px; }

.big-ribbon-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; gap: 2px; }
.big-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }

.small-ribbon-btn { background: transparent; border: 1px solid transparent; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; }
.small-ribbon-btn:hover { background: #f3f2f1; border-color: #e1dfdd; }
.small-ribbon-btn.active { background: #e1dfdd; font-weight: bold; }

/* Page Layout */
.form-page-container {
  width: 816px;
  background: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  margin-bottom: 40px;
}

.form-fields-container {
  padding: 20px;
}

.form-field-editor {
  background: #f9f9f9;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.field-label-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  outline: none;
  box-sizing: border-box;
}

.field-label-input:focus {
  border-color: #7b2cbf;
  outline: none;
}

.field-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 8px;
  outline: none;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #7b2cbf;
  outline: none;
}

.ruler-horizontal {
  width: 816px;
  height: 20px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 5px;
  background-image: linear-gradient(90deg, #ccc 1px, transparent 0);
  background-size: 96px 100%;
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
.custom-modal h3 { font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #7b2cbf; }
.custom-modal p { font-size: 14px; margin-bottom: 20px; color: #333; line-height: 1.4; }
.modal-input {
  width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
  margin-bottom: 20px; outline: none;
}
.modal-input:focus { border-color: #7b2cbf; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-btn {
  padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600;
}
.modal-btn.primary { background: #7b2cbf; color: white; }
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
