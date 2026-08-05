<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, doc, setDoc, getDoc, onSnapshot, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore'

const isAuthenticated = ref(false)
const userEmail = ref('')
const isEmployee = ref(false)

const heroConfig = ref({
  badge: 'Featured',
  title: 'LemHand Products',
  description: 'Discover the ultimate tools for your digital life.',
  buttonText: 'See more',
  buttonLink: '/products',
  button2Text: '',
  button2Link: '',
  image: 'https://placehold.co/800x600/0067b8/fff?text=LemHand+Surface'
})

const title = ref('')
const excerpt = ref('')
const image = ref('')
const posts = ref([])
const bugs = ref([])
const expandedBugs = ref({})

let unsubscribeBlogs = null
let unsubscribeHero = null
let unsubscribeBugs = null

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true
      userEmail.value = user.email
      isEmployee.value = user.email.endsWith('@lemhand.com')
      if (isEmployee.value) {
        loadDashboardData()
      }
    } else {
      isAuthenticated.value = false
      userEmail.value = ''
      isEmployee.value = false
      if (unsubscribeBlogs) unsubscribeBlogs()
      if (unsubscribeHero) unsubscribeHero()
      if (unsubscribeBugs) unsubscribeBugs()
    }
  })
})

onUnmounted(() => {
  if (unsubscribeBlogs) unsubscribeBlogs()
  if (unsubscribeHero) unsubscribeHero()
  if (unsubscribeBugs) unsubscribeBugs()
})

const loadDashboardData = () => {
  const blogsRef = collection(db, 'blogs')
  const q = query(blogsRef, orderBy('createdAt', 'desc'))
  unsubscribeBlogs = onSnapshot(q, (snapshot) => {
    posts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  })

  const heroRef = doc(db, 'settings', 'homepage')
  unsubscribeHero = onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      heroConfig.value = docSnap.data()
    }
  })

  const bugsRef = collection(db, 'bugs')
  const qBugs = query(bugsRef, orderBy('createdAt', 'desc'))
  unsubscribeBugs = onSnapshot(qBugs, (snapshot) => {
    bugs.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  })
}

const handleSignOut = async () => {
  await signOut(auth)
}

const saveHeroConfig = async () => {
  try {
    await setDoc(doc(db, 'settings', 'homepage'), heroConfig.value)
    alert('Homepage Announcement Space updated successfully!')
  } catch (err) {
    alert('Error saving config: ' + err.message)
  }
}

const addPost = async () => {
  if (!title.value || !excerpt.value) return;
  
  try {
    await addDoc(collection(db, 'blogs'), {
      title: title.value,
      excerpt: excerpt.value,
      image: image.value || 'https://placehold.co/800x400/1d1d1f/fff?text=New+Post',
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      authorId: auth.currentUser.uid
    })
    
    title.value = ''
    excerpt.value = ''
    image.value = ''
    alert('Blog post published successfully!')
  } catch (err) {
    alert('Error publishing post: ' + err.message)
  }
}

const deletePost = async (id) => {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      await deleteDoc(doc(db, 'blogs', id))
    } catch (err) {
      alert('Error deleting post: ' + err.message)
    }
  }
}

const toggleBugExpand = (id) => {
  expandedBugs.value[id] = !expandedBugs.value[id]
}

const updateBugStatus = async (id, status) => {
  try {
    await setDoc(doc(db, 'bugs', id), { status }, { merge: true })
  } catch (err) {
    alert('Error updating status: ' + err.message)
  }
}

const deleteBug = async (id) => {
  if (confirm('Are you sure you want to permanently delete this bug report?')) {
    try {
      await deleteDoc(doc(db, 'bugs', id))
    } catch (err) {
      alert('Error deleting bug report: ' + err.message)
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getSeverityColor = (sev) => {
  switch (sev) {
    case 'Critical': return '#e81123'
    case 'High': return '#ff8c00'
    case 'Medium': return '#ffb900'
    default: return '#107c41'
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Resolved': return '#107c41'
    case 'In Progress': return '#0078d4'
    case 'Closed': return '#7a7a7a'
    default: return '#ffb900' // Open
  }
}
</script>

<template>
  <main style="padding: 40px 5%; min-height: 80vh;">
    <div style="max-width: 800px; margin: 0 auto;">
      
      <div v-if="!isAuthenticated" style="text-align: center; margin-top: 60px;">
        <h2 style="font-size: 2rem; margin-bottom: 20px;">LemHand Employee Portal</h2>
        <p style="margin-bottom: 30px;">Please <router-link to="/login" style="color: var(--ms-blue); text-decoration: underline;">sign in</router-link> with your employee account to continue.</p>
      </div>

      <div v-else-if="!isEmployee" style="text-align: center; margin-top: 60px;">
        <h2 style="font-size: 2rem; margin-bottom: 20px; color: #e81123;">Access Denied</h2>
        <p style="margin-bottom: 20px;">This portal is restricted to LemHand Corporation employees only (@lemhand.com).</p>
        <p>Signed in as: {{ userEmail }}</p>
      </div>
      
      <div v-else>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
          <div>
            <h1 style="font-size: 2rem; font-weight: 600;">Dashboard</h1>
            <p style="font-size: 0.9rem; opacity: 0.8;">Signed in as {{ userEmail }}</p>
          </div>
          <button @click="handleSignOut" style="text-decoration: underline;">Sign out</button>
        </div>
        
        <div style="background: var(--footer-bg); padding: 30px; margin-bottom: 40px; border: 1px solid var(--border-color);">
          <h2 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 20px;">Customize Homepage Announcement Space</h2>
          
          <div class="form-group">
            <label>Badge Text (e.g. Featured, New)</label>
            <input type="text" v-model="heroConfig.badge" class="form-control">
          </div>

          <div class="form-group">
            <label>Title</label>
            <input type="text" v-model="heroConfig.title" class="form-control">
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="heroConfig.description" class="form-control" rows="2"></textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="form-group">
              <label>Button Text</label>
              <input type="text" v-model="heroConfig.buttonText" class="form-control">
            </div>
            <div class="form-group">
              <label>Button Link</label>
              <input type="text" v-model="heroConfig.buttonLink" class="form-control">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div class="form-group">
              <label>Button 2 Text (Green Button)</label>
              <input type="text" v-model="heroConfig.button2Text" class="form-control">
            </div>
            <div class="form-group">
              <label>Button 2 Link</label>
              <input type="text" v-model="heroConfig.button2Link" class="form-control">
            </div>
          </div>

          <div class="form-group">
            <label>Image URL (e.g. upload an image for BusTracker)</label>
            <input type="text" v-model="heroConfig.image" class="form-control" placeholder="https://example.com/image.jpg">
          </div>
          
          <button @click="saveHeroConfig" class="ms-btn-primary" style="margin-top: 10px;">Save Homepage Settings</button>
        </div>
        
        <div style="background: var(--footer-bg); padding: 30px; margin-bottom: 40px; border: 1px solid var(--border-color);">
          <h2 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 20px;">Create New Blog Post</h2>
          
          <div class="form-group">
            <label>Post Title</label>
            <input type="text" v-model="title" class="form-control">
          </div>
          
          <div class="form-group">
            <label>Image URL</label>
            <input type="text" v-model="image" class="form-control">
          </div>
          
          <div class="form-group">
            <label>Excerpt / Content</label>
            <textarea v-model="excerpt" class="form-control" rows="4"></textarea>
          </div>
          
          <button @click="addPost" class="ms-btn-primary" style="margin-top: 10px;">Publish Post</button>
        </div>
        
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 20px;">Manage Posts</h2>
          <div v-if="posts.length === 0" style="padding: 20px; text-align: center; border: 1px solid var(--border-color); background: var(--bg-color);">
            No posts available.
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 15px;">
            <div v-for="post in posts" :key="post.id" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-color); border: 1px solid var(--border-color);">
              <div>
                <strong style="display: block;">{{ post.title }}</strong>
                <span style="font-size: 0.8rem; color: #666;">{{ post.date }}</span>
              </div>
              <button @click="deletePost(post.id)" style="color: #e81123; text-decoration: underline;">Delete</button>
            </div>
          </div>
        </div>

        <div style="background: var(--footer-bg); padding: 30px; margin-bottom: 40px; border: 1px solid var(--border-color);">
          <h2 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 20px;">Manage Bug Reports</h2>
          
          <div v-if="bugs.length === 0" style="padding: 20px; text-align: center; border: 1px solid var(--border-color); background: var(--bg-color);">
            No bug reports submitted yet.
          </div>
          
          <div v-else style="display: flex; flex-direction: column; gap: 20px;">
            <div v-for="bug in bugs" :key="bug.id" style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 20px;">
              <!-- Header Summary Row -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap;">
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 5px 0;">{{ bug.title }}</h3>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; align-items: center;">
                    <!-- Reference Tag -->
                    <span style="font-family: monospace; font-size: 0.75rem; background: #eee; padding: 2px 6px; border-radius: 4px;">
                      LH-BUG-{{ bug.id.substring(0, 6).toUpperCase() }}
                    </span>
                    
                    <!-- Category Badge -->
                    <span style="font-size: 0.75rem; background: #e1dfdd; padding: 2px 6px; border-radius: 4px;">
                      {{ bug.category }}
                    </span>

                    <!-- Severity Badge -->
                    <span :style="{ color: 'white', backgroundColor: getSeverityColor(bug.severity), fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }">
                      {{ bug.severity }}
                    </span>

                    <!-- Status Badge -->
                    <span :style="{ color: 'white', backgroundColor: getStatusColor(bug.status), fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }">
                      {{ bug.status }}
                    </span>
                  </div>
                  
                  <div style="font-size: 0.8rem; opacity: 0.85;">
                    Reported by: <strong>{{ bug.reporterName }}</strong> ({{ bug.reporterEmail }}) on {{ formatDate(bug.createdAt) }}
                  </div>
                </div>

                <!-- Action Controls -->
                <div style="display: flex; align-items: center; gap: 10px;">
                  <select :value="bug.status" @change="updateBugStatus(bug.id, $event.target.value)" style="padding: 6px; border: 1px solid var(--border-color); font-size: 0.85rem; background: var(--bg-color); color: var(--text-color);">
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                  
                  <button @click="toggleBugExpand(bug.id)" class="ms-btn" style="padding: 6px 12px; font-size: 0.85rem;">
                    {{ expandedBugs[bug.id] ? 'Hide Details' : 'View Details' }}
                  </button>

                  <button @click="deleteBug(bug.id)" style="color: #e81123; text-decoration: underline; background: transparent; border: none; cursor: pointer; font-size: 0.85rem;">
                    Delete
                  </button>
                </div>
              </div>

              <!-- Expanded Details Drawer -->
              <div v-if="expandedBugs[bug.id]" style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed var(--border-color); display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;">
                <div>
                  <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666; margin-bottom: 2px;">Actual Behavior</strong>
                  <div style="white-space: pre-wrap; background: #fafafa; padding: 10px; border: 1px solid #eee; border-radius: 4px;">{{ bug.actual }}</div>
                </div>

                <div v-if="bug.expected">
                  <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666; margin-bottom: 2px;">Expected Behavior</strong>
                  <div style="white-space: pre-wrap; background: #fafafa; padding: 10px; border: 1px solid #eee; border-radius: 4px;">{{ bug.expected }}</div>
                </div>

                <div v-if="bug.steps">
                  <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666; margin-bottom: 2px;">Steps to Reproduce</strong>
                  <div style="white-space: pre-wrap; background: #fafafa; padding: 10px; border: 1px solid #eee; border-radius: 4px;">{{ bug.steps }}</div>
                </div>

                <div v-if="bug.systemInfo">
                  <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #666; margin-bottom: 2px;">System / Browser Information</strong>
                  <pre style="font-family: monospace; font-size: 0.8rem; background: #f3f3f3; padding: 10px; border-radius: 4px; overflow-x: auto; margin: 0;">{{ bug.systemInfo }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
    </div>
  </main>
</template>
