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
  <main class="min-h-[80vh] flex items-center justify-center bg-base-200 p-4">
    <div class="w-full max-w-md">
      
      <div v-if="!isAuthenticated" class="card bg-base-100 shadow-2xl border border-base-200">
        <div class="card-body p-10">
          <div class="flex items-center gap-3 mb-6">
            <img src="/las_logo.png" class="h-8" alt="LemHand Logo">
            <span class="font-extrabold text-2xl text-primary">LemHand</span>
          </div>
          
          <h2 class="text-2xl font-bold mb-2">{{ isLoginMode ? 'Sign in' : 'Create account' }}</h2>
          <p class="text-base-content/70 mb-8">to continue to LemHand Services</p>
          
          <div class="form-control gap-4 mb-6">
            <input type="email" v-model="email" class="input input-bordered input-primary w-full" placeholder="Email address">
            <input type="password" v-model="password" @keyup.enter="handleAuth" class="input input-bordered input-primary w-full" placeholder="Password">
          </div>
          
          <p class="text-sm mb-4">
            {{ isLoginMode ? "No account?" : "Already have an account?" }}
            <button class="link link-primary font-bold" @click="isLoginMode = !isLoginMode">
              {{ isLoginMode ? 'Create one!' : 'Sign in' }}
            </button>
          </p>

          <div v-if="error" class="alert alert-error mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{{ error }}</span>
          </div>
          
          <div class="card-actions justify-end mt-4">
            <button @click="handleAuth" class="btn btn-primary rounded-full px-8" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              {{ loading ? 'Please wait...' : (isLoginMode ? 'Sign in' : 'Next') }}
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="card bg-base-100 shadow-2xl border border-base-200 text-center">
        <div class="card-body p-10 items-center">
          <div class="avatar placeholder mb-6">
            <div class="bg-primary text-primary-content rounded-full w-24 shadow-lg">
              <span class="text-3xl font-bold">{{ userEmail.charAt(0).toUpperCase() }}</span>
            </div>
          </div>
          <h2 class="text-2xl font-bold mb-2">Welcome back</h2>
          <p class="text-base-content/70 mb-8 text-lg">{{ userEmail }}</p>
          
          <button @click="handleSignOut" class="btn btn-outline btn-error rounded-full px-8">Sign out</button>
        </div>
      </div>

    </div>
  </main>
</template>
