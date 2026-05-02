<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const isAuthenticated = ref(false)
const userEmail = ref('')
const isLoginMode = ref(true)

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

let unsubscribeAuth = null

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true
      userEmail.value = user.email
    } else {
      isAuthenticated.value = false
      userEmail.value = ''
    }
  })
})

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth()
})

const handleAuth = async () => {
  error.value = ''
  loading.value = true
  try {
    if (isLoginMode.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    }
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleSignOut = async () => {
  await signOut(auth)
}
</script>

<template>
  <main style="padding: 40px 5%; min-height: 80vh; display: flex; align-items: center; justify-content: center;">
    <div style="width: 100%; max-width: 440px;">
      
      <div v-if="!isAuthenticated" style="background: var(--bg-color); padding: 44px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); border: 1px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <img src="/las_logo.png" style="height: 24px;" alt="LemHand Logo">
          <span style="font-weight: 600; font-size: 1.2rem;">LemHand</span>
        </div>
        <h2 style="font-size: 1.5rem; margin-bottom: 10px; font-weight: 600;">{{ isLoginMode ? 'Sign in' : 'Create account' }}</h2>
        <p style="margin-bottom: 30px; font-size: 0.95rem; opacity: 0.8;">to continue to LemHand Services</p>
        
        <div class="form-group">
          <input type="email" v-model="email" class="form-control" placeholder="Email address" style="border-bottom: 1px solid var(--border-color); border-top:none; border-left:none; border-right:none; border-radius:0; padding-left:0; margin-bottom: 20px;">
          <input type="password" v-model="password" @keyup.enter="handleAuth" class="form-control" placeholder="Password" style="border-bottom: 1px solid var(--border-color); border-top:none; border-left:none; border-right:none; border-radius:0; padding-left:0;">
        </div>
        
        <p style="font-size: 0.85rem; margin-bottom: 20px;">
          {{ isLoginMode ? "No account?" : "Already have an account?" }}
          <span style="color: var(--ms-blue); cursor: pointer; text-decoration: underline;" @click="isLoginMode = !isLoginMode">
            {{ isLoginMode ? 'Create one!' : 'Sign in' }}
          </span>
        </p>

        <p v-if="error" style="color: #e81123; margin-bottom: 15px; font-size: 0.9rem;">{{ error }}</p>
        
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <button @click="handleAuth" class="ms-btn-primary" :disabled="loading">{{ loading ? 'Please wait...' : (isLoginMode ? 'Sign in' : 'Next') }}</button>
        </div>
      </div>
      
      <div v-else style="background: var(--bg-color); padding: 44px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); border: 1px solid var(--border-color); text-align: center;">
        <div style="width: 80px; height: 80px; background-color: var(--ms-blue); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600; margin: 0 auto 20px;">
          {{ userEmail.charAt(0).toUpperCase() }}
        </div>
        <h2 style="font-size: 1.5rem; margin-bottom: 10px; font-weight: 600;">Welcome back</h2>
        <p style="margin-bottom: 30px; font-size: 1rem; opacity: 0.8;">{{ userEmail }}</p>
        
        <button @click="handleSignOut" style="text-decoration: underline; color: var(--ms-blue); font-weight: 600;">Sign out</button>
      </div>

    </div>
  </main>
</template>
