<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useRoute } from 'vue-router'

const route = useRoute()
const docId = route.params.id

const documentTitle = ref('Untitled Presentation')

const slides = ref([
  { id: 1, title: 'Welcome to LemPresent', content: 'Create beautiful slides easily.', bgColor: '#ffffff', textColor: '#d24726' }
])

const activeSlideIndex = ref(0)
const isPresenting = ref(false)
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
  // Setup User
  let storedName = localStorage.getItem('lemhand_office_name')
  if (!storedName) {
    storedName = prompt("Enter your name to join this presentation:") || "Anonymous"
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
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'office', docId), {
        title: documentTitle.value,
        slides: slides.value,
        lastUpdated: new Date()
      }, { merge: true })
      saveToRecents()
    } catch (e) {
      console.error("Error saving:", e)
    }
  }, 1000); // 1s debounce
}

watch(documentTitle, saveToCloud)
watch(slides, saveToCloud, { deep: true })

const addSlide = () => {
  slides.value.push({
    id: Date.now(),
    title: 'New Slide',
    content: 'Add your content here',
    bgColor: '#ffffff',
    textColor: '#d24726',
    transition: 'fade',
    textBgImage: ''
  })
  activeSlideIndex.value = slides.value.length - 1
}

const selectSlide = (index) => {
  activeSlideIndex.value = index
}

const deleteSlide = (index) => {
  if (slides.value.length > 1) {
    slides.value.splice(index, 1)
    if (activeSlideIndex.value >= slides.value.length) {
      activeSlideIndex.value = slides.value.length - 1
    }
  }
}

const togglePresent = () => {
  isPresenting.value = !isPresenting.value
  if (isPresenting.value) {
    document.documentElement.requestFullscreen().catch((e) => {
      console.log('Fullscreen failed:', e)
    })
  } else {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }
}

const nextSlide = () => {
  if (activeSlideIndex.value < slides.value.length - 1) {
    activeSlideIndex.value++
  }
}

const prevSlide = () => {
  if (activeSlideIndex.value > 0) {
    activeSlideIndex.value--
  }
}

const setTextBgImage = () => {
  const url = prompt("Enter Image URL for Text Fill (leave blank to remove):", slides.value[activeSlideIndex.value].textBgImage || "");
  if (url !== null) {
    slides.value[activeSlideIndex.value].textBgImage = url;
  }
}

const printPresentation = () => {
  window.print()
}

const downloadPPT = () => {
  let content = slides.value.map(s => `<div style="background:${s.bgColor};color:${s.textColor};padding:50px;margin-bottom:20px;border:1px solid #ccc;page-break-after:always;"><h1>${s.title}</h1><p>${s.content}</p></div>`).join('');
  const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:p='urn:schemas-microsoft-com:office:powerpoint' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${documentTitle.value}</title></head><body>${content}</body></html>`;
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${documentTitle.value}.ppt`;
  a.click();
  URL.revokeObjectURL(url);
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
  <!-- Loading Animation -->
  <div v-if="isLoading" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background:#f3f2f1; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
    <svg width="150" height="120" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="90" height="70" rx="4" fill="white" stroke="#d24726" stroke-width="4"/>
      <path class="slide-line slide-line-1" d="M 15 20 L 50 20" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
      <path class="slide-line slide-line-2" d="M 15 40 L 85 40" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
      <path class="slide-line slide-line-3" d="M 15 50 L 70 50" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
      <path class="slide-line slide-line-4" d="M 15 60 L 60 60" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <div style="position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; color: #d24726; font-weight: bold; font-size: 1.2rem;">
      LemHand Office
      <span style="font-size: 0.9rem; font-weight: normal; margin-top: 5px;">Loading LemPresent...</span>
    </div>
  </div>

  <!-- Presentation Mode -->
  <div v-if="isPresenting" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: black; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center;" @click="nextSlide">
    <div :style="{ backgroundColor: slides[activeSlideIndex].bgColor }" style="width: 80%; height: 80%; padding: 60px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; transition: background-color 0.3s;">
      <h1 :style="{ color: slides[activeSlideIndex].textColor }" style="font-size: 4rem; margin-bottom: 40px;">{{ slides[activeSlideIndex].title }}</h1>
      <p style="font-size: 2rem; color: #333;">{{ slides[activeSlideIndex].content }}</p>
    </div>
    
    <div style="position: absolute; bottom: 20px; color: rgba(255,255,255,0.5); display: flex; gap: 20px; align-items: center;">
      <button @click.stop="prevSlide" style="color: white; background: transparent; font-size: 20px;">◀</button>
      <span>{{ activeSlideIndex + 1 }} / {{ slides.length }}</span>
      <button @click.stop="nextSlide" style="color: white; background: transparent; font-size: 20px;">▶</button>
      <button @click.stop="togglePresent" style="color: white; background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 4px; margin-left: 20px;">Exit</button>
    </div>
  </div>

  <!-- Edit Mode -->
  <div v-else style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1;">
    <!-- Enterprise Header -->
    <div style="background-color: #d24726; color: white; padding: 8px 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <RouterLink to="/office" style="color: white; font-size: 1.2rem; text-decoration: none; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; gap: 5px;">
          <strong style="background: white; color: #d24726; padding: 0px 4px; border-radius: 2px;">P</strong> 
          ⌂
        </RouterLink>
        <div class="menu-container" style="display: flex; flex-direction: column; gap: 2px;">
          <input type="text" v-model="documentTitle" style="background: transparent; border: 1px solid transparent; color: white; font-size: 1.1rem; outline: none; font-weight: 600; width: 300px; padding: 2px 4px; border-radius: 2px;" onfocus="this.style.border='1px solid rgba(255,255,255,0.5)'" onblur="this.style.border='1px solid transparent'">
          <div style="display: flex; gap: 5px; font-size: 13px; color: rgba(255,255,255,0.9); margin-left: 2px;">
            <div style="position: relative;">
              <span @click="toggleMenu('file')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'file' ? 'rgba(255,255,255,0.2)' : 'transparent' }">File</span>
              <div v-if="activeMenu === 'file'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="downloadPPT(); activeMenu=null" class="menu-item">Download .PPT</div>
                <div @click="printPresentation(); activeMenu=null" class="menu-item">Print...</div>
              </div>
            </div>
            <div style="position: relative;">
              <span @click="toggleMenu('edit')" style="cursor: pointer; padding: 2px 8px; border-radius: 2px;" :style="{ background: activeMenu === 'edit' ? 'rgba(255,255,255,0.2)' : 'transparent' }">Edit</span>
              <div v-if="activeMenu === 'edit'" style="position: absolute; top: 100%; left: 0; background: white; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e1dfdd; border-radius: 2px; padding: 5px 0; min-width: 150px; z-index: 100;">
                <div @click="addSlide(); activeMenu=null" class="menu-item">New Slide</div>
                <div @click="deleteSlide(activeSlideIndex); activeMenu=null" class="menu-item" style="color: #d83b01;">Delete Current Slide</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collaboration & Actions -->
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-size: 12px; color: rgba(255,255,255,0.6);">☁ Saved to LemCloud</span>
        <div style="display: flex; align-items: center; margin-right: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #0078d4; border: 2px solid #d24726; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: -10px; z-index: 99;" :title="username + ' (You)'">{{ (username || '??').substring(0, 2).toUpperCase() }}</div>
          <div v-for="(avatar, idx) in avatars" :key="idx" :style="{ background: ['#107c41', '#2b579a', '#8764b8', '#c239b3'][idx % 4], zIndex: 98 - idx }" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #d24726; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: -10px;" :title="avatar">{{ (avatar || '??').substring(0, 2).toUpperCase() }}</div>
        </div>
        
        <button @click="openShare" style="background: white; color: #d24726; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 5px; cursor: pointer;">
          👤 Share
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar-wrap" style="background-color: white; padding: 8px 20px; border-bottom: 1px solid #e1dfdd; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <button @click="addSlide" style="padding: 6px 12px; background: #f3f2f1; border: 1px solid #e1dfdd; cursor: pointer; border-radius: 4px; font-weight: 600;">+ New Slide</button>
      <div style="width: 1px; height: 24px; background: #e1dfdd;"></div>
      
      <label style="font-size: 14px; display: flex; align-items: center; gap: 5px;">
        Background
        <input type="color" v-model="slides[activeSlideIndex].bgColor" style="border: none; width: 24px; height: 24px; padding: 0; cursor: pointer;">
      </label>
      <label style="font-size: 14px; display: flex; align-items: center; gap: 5px;">
        Text Color
        <input type="color" v-model="slides[activeSlideIndex].textColor" style="border: none; width: 24px; height: 24px; padding: 0; cursor: pointer;">
      </label>
      
      <button @click="setTextBgImage" style="padding: 4px 8px; background: white; border: 1px solid #ccc; cursor: pointer; border-radius: 4px; font-size: 13px;">🖼 Text Fill Image</button>

      <label style="font-size: 14px; display: flex; align-items: center; gap: 5px;">
        Transition:
        <select v-model="slides[activeSlideIndex].transition" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="none">None</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="magic">Match & Move</option>
        </select>
      </label>
      
      <div style="margin-left: auto; display: flex; gap: 8px;">
        <button @click="downloadPPT" style="background: #e1dfdd; color: #d24726; padding: 6px 16px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">⬇ .PPT</button>
        <button @click="printPresentation" style="background: white; color: #333; border: 1px solid #ccc; padding: 6px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">🖨️ PDF</button>
        <button @click="togglePresent" style="background: #d24726; color: white; border: none; padding: 6px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">▶ Present</button>
      </div>
    </div>

    <div style="display: flex; flex-grow: 1; overflow: hidden;">
      <!-- Sidebar -->
      <div style="width: 250px; background: white; border-right: 1px solid #e1dfdd; display: flex; flex-direction: column;">
        <div style="flex-grow: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 15px;">
          <div 
            v-for="(slide, index) in slides" 
            :key="slide.id"
            @click="selectSlide(index)"
            :style="{ borderColor: activeSlideIndex === index ? '#d24726' : '#e1dfdd', backgroundColor: slide.bgColor }"
            style="aspect-ratio: 16/9; border: 2px solid; border-radius: 4px; cursor: pointer; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px; text-align: center; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"
          >
            <div style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 10px; font-weight: bold;">{{ index + 1 }}</div>
            <button v-if="slides.length > 1" @click.stop="deleteSlide(index)" style="position: absolute; top: 5px; right: 5px; color: red; background: transparent; cursor: pointer;">✕</button>
            <strong :style="{ color: slide.textColor, backgroundImage: slide.textBgImage ? `url(${slide.textBgImage})` : 'none', backgroundClip: slide.textBgImage ? 'text' : 'initial', WebkitBackgroundClip: slide.textBgImage ? 'text' : 'initial', WebkitTextFillColor: slide.textBgImage ? 'transparent' : 'initial', backgroundSize: 'cover', backgroundPosition: 'center' }" style="margin-bottom: 5px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">{{ slide.title }}</strong>
          </div>
        </div>
      </div>

      <!-- Main Editor -->
      <div style="flex-grow: 1; padding: 40px; display: flex; justify-content: center; align-items: center; overflow: auto;">
        <transition :name="slides[activeSlideIndex].transition || 'none'" mode="out-in">
          <div :key="activeSlideIndex" :style="{ backgroundColor: slides[activeSlideIndex].bgColor }" style="width: 100%; max-width: 900px; aspect-ratio: 16/9; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; text-align: center; transition: background-color 0.3s;">
            <input 
              type="text" 
              v-model="slides[activeSlideIndex].title" 
              placeholder="Click to add title"
              :style="{ color: slides[activeSlideIndex].textColor, backgroundImage: slides[activeSlideIndex].textBgImage ? `url(${slides[activeSlideIndex].textBgImage})` : 'none', backgroundClip: slides[activeSlideIndex].textBgImage ? 'text' : 'initial', WebkitBackgroundClip: slides[activeSlideIndex].textBgImage ? 'text' : 'initial', WebkitTextFillColor: slides[activeSlideIndex].textBgImage ? 'transparent' : 'initial', backgroundSize: 'cover', backgroundPosition: 'center' }"
              style="font-size: 3rem; font-weight: 600; text-align: center; border: 1px dashed transparent; outline: none; width: 100%; margin-bottom: 30px; background-color: transparent;"
              onfocus="this.style.border='1px dashed #ccc'"
              onblur="this.style.border='1px dashed transparent'"
            >
            <textarea 
              v-model="slides[activeSlideIndex].content" 
              placeholder="Click to add text"
              :style="{ color: slides[activeSlideIndex].textColor, backgroundImage: slides[activeSlideIndex].textBgImage ? `url(${slides[activeSlideIndex].textBgImage})` : 'none', backgroundClip: slides[activeSlideIndex].textBgImage ? 'text' : 'initial', WebkitBackgroundClip: slides[activeSlideIndex].textBgImage ? 'text' : 'initial', WebkitTextFillColor: slides[activeSlideIndex].textBgImage ? 'transparent' : 'initial', backgroundSize: 'cover', backgroundPosition: 'center' }"
              style="font-size: 1.5rem; text-align: center; border: 1px dashed transparent; outline: none; width: 100%; height: 200px; resize: none; background-color: transparent; font-family: inherit;"
              onfocus="this.style.border='1px dashed #ccc'"
              onblur="this.style.border='1px dashed transparent'"
            ></textarea>
          </div>
        </transition>
      </div>
    </div>

    <!-- Share Modal -->
    <div v-if="isShareOpen" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 30px; border-radius: 8px; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <h2 style="margin-bottom: 20px; color: #323130;">Share Presentation</h2>
        <p style="margin-bottom: 10px; color: #666; font-size: 14px;">Anyone with this link can join and collaborate in real-time.</p>
        <input type="text" readonly :value="shareLink" @click="$event.target.select()" style="width: 100%; padding: 10px; border: 1px solid #c8c6c4; border-radius: 4px; margin-bottom: 15px; outline: none; background: #f3f2f1; color: #333;">
        <p v-if="copyStatus" style="color: #107c41; margin-bottom: 15px; font-weight: 600; font-size: 14px;">{{ copyStatus }}</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button @click="isShareOpen = false" style="padding: 8px 16px; background: #e1dfdd; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; color: black;">Close</button>
          <button @click="copyLink" style="padding: 8px 16px; background: #d24726; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Copy Link</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-scroll::-webkit-scrollbar {
  display: none;
}
.toolbar-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.toolbar-scroll > * {
  flex-shrink: 0;
}
.menu-item {
  padding: 8px 15px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}
.menu-item:hover {
  background: #f3f2f1;
}
.slide-line {
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  animation: draw-slide 1.5s infinite ease-in-out alternate;
}
.slide-line-1 { animation-delay: 0s; }
.slide-line-2 { animation-delay: 0.2s; }
.slide-line-3 { animation-delay: 0.4s; }
.slide-line-4 { animation-delay: 0.6s; }
@keyframes draw-slide {
  0% { stroke-dashoffset: 80; }
  100% { stroke-dashoffset: 0; }
}
</style>
