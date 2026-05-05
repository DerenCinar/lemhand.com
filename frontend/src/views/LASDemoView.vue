<script setup>
import { ref, onMounted } from 'vue'

// Configuration
const CLIENT_ID = 'demo_client_123'

// State
const isLoggedIn = ref(false)
const userName = ref('-')
const userEmail = ref('-')
const userInitial = ref('U')

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const success = urlParams.get('success')
  const email = urlParams.get('email')
  const name = urlParams.get('name') || 'Not provided'

  if (success === 'true' && email) {
    // User is logged in! Update state
    isLoggedIn.value = true
    userName.value = name
    userEmail.value = email
    
    if (name !== 'Not provided') {
      userInitial.value = name.charAt(0).toUpperCase()
    } else {
      userInitial.value = email.charAt(0).toUpperCase()
    }

    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname)
  }
})

const loginWithLemHand = () => {
  // Construct the LAS Sign-In URL
  // In the Vue app, this will be /las/signin
  const lasUrl = new URL(window.location.origin + '/las/signin')
  lasUrl.searchParams.append('client_id', CLIENT_ID)
  lasUrl.searchParams.append('redirect_uri', window.location.href.split('?')[0])

  // Redirect to LAS
  window.location.href = lasUrl.toString()
}

const logout = () => {
  isLoggedIn.value = false
  userName.value = '-'
  userEmail.value = '-'
  userInitial.value = 'U'
}
</script>

<template>
  <div class="demo-container">
    <div class="demo-card">
      <h1 class="demo-title">Awesome Third Party App</h1>
      <p class="demo-subtitle">This is a demo showing how to use LemHand Account Services (LAS) for authentication on external websites.</p>

      <!-- Logged Out View -->
      <div v-if="!isLoggedIn" class="logged-out-view">
        <h2 class="view-title">Welcome Back</h2>
        <p class="view-text">Log in to your account using your standard LemHand login.</p>
        <button @click="loginWithLemHand" class="login-btn">
          <img src="/favicon.svg" alt="LemHand" class="btn-logo" />
          <span>Sign in with LemHand</span>
        </button>
        <p class="provider-text">Securely provided by LemHand Account Services</p>
      </div>

      <!-- Logged In View -->
      <div v-else class="logged-in-view">
        <div class="user-header">
          <div class="avatar">
            <span>{{ userInitial }}</span>
          </div>
          <div class="user-info">
            <h2 class="welcome-text">Welcome!</h2>
            <p class="success-text">You have successfully logged in via LAS.</p>
          </div>
        </div>
        
        <div class="data-group">
          <div class="data-item">
            <p class="data-label">Name</p>
            <p class="data-value">{{ userName }}</p>
          </div>
          <div class="data-item">
            <p class="data-label">Email</p>
            <p class="data-value">{{ userEmail }}</p>
          </div>
        </div>
        
        <button @click="logout" class="logout-btn">Log out</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  min-height: 100vh;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: 'Inter', sans-serif;
}

.demo-card {
  max-width: 36rem;
  width: 100%;
  background-color: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
}

.demo-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.demo-subtitle {
  color: #4b5563;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

.view-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.view-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.login-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.login-btn:hover {
  background-color: #f9fafb;
}

.btn-logo {
  width: 20px;
  height: 20px;
}

.provider-text {
  font-size: 0.75rem;
  text-align: center;
  color: #9ca3af;
  margin-top: 1rem;
}

.logged-in-view {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  background-color: #bbf7d0;
  color: #15803d;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
}

.welcome-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #064e3b;
}

.success-text {
  color: #15803d;
  font-size: 0.875rem;
}

.data-group {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.data-item {
  background-color: white;
  padding: 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #dcfce7;
}

.data-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.data-value {
  color: #1f2937;
  font-weight: 500;
}

.logout-btn {
  margin-top: 1.5rem;
  width: 100%;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc2626;
  border: 1px solid #fecaca;
  background-color: transparent;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #fef2f2;
  color: #991b1b;
}
</style>
