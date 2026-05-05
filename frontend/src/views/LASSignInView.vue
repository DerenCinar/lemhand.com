<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const error = ref('')
const clientName = ref('LemHand Partner')
const email = ref('')
const password = ref('')
const isSigningIn = ref(false)
const verifiedRedirectUri = ref(null)

const clientId = route.query.client_id
const redirectUri = route.query.redirect_uri

onMounted(async () => {
  if (!clientId || !redirectUri) {
    error.value = "Invalid request. Missing client_id or redirect_uri."
    loading.value = false
    return
  }

  try {
    // Verify Client in Firestore
    const clientRef = doc(db, 'las_clients', clientId)
    const clientSnap = await getDoc(clientRef)

    if (clientSnap.exists()) {
      const clientData = clientSnap.data()
      
      // Verify redirect_uri is in allowed_redirect_uris
      if (clientData.allowed_redirect_uris && clientData.allowed_redirect_uris.includes(redirectUri)) {
        verifiedRedirectUri.value = redirectUri
        clientName.value = clientData.name || clientId
        loading.value = false
      } else {
        error.value = "Security Error: Unauthorized redirect URI for this client."
        loading.value = false
      }
    } else {
      error.value = "Security Error: Invalid client ID. The requested service is not authorized to use LemHand Account Services."
      loading.value = false
    }
  } catch (err) {
    console.error("Error verifying client:", err)
    error.value = "A network error occurred while verifying the request. Please try again."
    loading.value = false
  }
})

const handleSignIn = async () => {
  if (!email.value || !password.value) {
    error.value = "Please enter both email and password."
    return
  }

  if (!verifiedRedirectUri.value) return

  isSigningIn.value = true
  error.value = ''

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user
    
    // Construct redirect URL
    const redirectUrl = new URL(verifiedRedirectUri.value)
    redirectUrl.searchParams.append('email', user.email)
    
    if (user.displayName) {
      redirectUrl.searchParams.append('name', user.displayName)
    }

    redirectUrl.searchParams.append('success', 'true')

    // Since it's an external redirect usually, we use window.location
    window.location.href = redirectUrl.toString()

  } catch (err) {
    console.error(err)
    isSigningIn.value = false
    
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      error.value = "Invalid email or password."
    } else if (err.code === 'auth/too-many-requests') {
      error.value = "Too many failed attempts. Please try again later."
    } else {
      error.value = err.message
    }
  }
}
</script>

<template>
  <div class="las-container">
    <div class="las-card">
      <!-- Logo and Header -->
      <div class="las-header">
        <div class="las-logo-container">
          <img src="/las_logo.png" alt="LAS Logo" class="las-logo" />
        </div>
        <h2 class="las-title">Sign in</h2>
        <p class="las-subtitle">to continue to <span class="client-name">{{ clientName }}</span></p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="error-alert">
        <div class="error-flex">
          <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="error-message">{{ error }}</p>
        </div>
      </div>

      <!-- Form container -->
      <div v-if="!loading && !error" class="form-container">
        <div class="input-group">
          <input 
            type="email" 
            v-model="email" 
            class="las-input" 
            placeholder="Email address"
            @keyup.enter="handleSignIn"
          />
          <input 
            type="password" 
            v-model="password" 
            class="las-input" 
            placeholder="Password"
            @keyup.enter="handleSignIn"
          />
        </div>

        <div class="form-actions">
          <a href="#" class="forgot-link">Forgot password?</a>
          <button 
            @click="handleSignIn" 
            :disabled="isSigningIn"
            class="submit-btn"
            :class="{ 'btn-loading': isSigningIn }"
          >
            {{ isSigningIn ? 'Signing in...' : 'Next' }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">Verifying request...</p>
      </div>

      <!-- Footer -->
      <div class="las-footer">
        <span>LemHand Account Services</span>
        <div class="footer-links">
          <a href="#" class="footer-link">Help</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.las-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  padding: 1rem;
  font-family: 'Inter', sans-serif;
}

.las-card {
  max-width: 28rem;
  width: 100%;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 1px solid #f3f4f6;
}

.las-header {
  padding: 2rem 2rem 1.5rem;
  text-align: center;
}

.las-logo-container {
  margin-left: auto;
  margin-right: auto;
  width: 4rem;
  height: 4rem;
  background-color: #f0fdf4;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.las-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.las-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.las-subtitle {
  font-size: 0.875rem;
  color: #4b5563;
  margin-top: 0.5rem;
}

.client-name {
  font-weight: 600;
  color: #1f2937;
}

.error-alert {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 1rem;
}

.error-flex {
  background-color: #fef2f2;
  border-left: 4px solid #ef4444;
  padding: 1rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
}

.error-icon {
  height: 1.25rem;
  width: 1.25rem;
  color: #f87171;
  flex-shrink: 0;
}

.error-message {
  margin-left: 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.form-container {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.las-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.las-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.forgot-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
  text-decoration: none;
}

.forgot-link:hover {
  color: #047857;
}

.submit-btn {
  background-color: #10b981;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.submit-btn:hover {
  background-color: #059669;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-state {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 4px solid rgba(16, 185, 129, 0.25);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1rem;
}

.las-footer {
  background-color: #f9fafb;
  padding: 1rem 2rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

.footer-link {
  color: #6b7280;
  text-decoration: none;
}

.footer-link:hover {
  color: #111827;
  text-decoration: underline;
}
</style>
