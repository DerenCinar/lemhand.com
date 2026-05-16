<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const isAuthenticated = ref(false);
const userEmail = ref("");
const isLoginMode = ref(true);

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

let unsubscribeAuth = null;

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true;
      userEmail.value = user.email;
    } else {
      isAuthenticated.value = false;
      userEmail.value = "";
    }
  });
});

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth();
});

const handleAuth = async () => {
  error.value = "";
  loading.value = true;
  try {
    if (isLoginMode.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
    }
    email.value = "";
    password.value = "";
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleSignOut = async () => {
  await signOut(auth);
};
</script>

<template>
  <main class="l-main">
    <div class="p-strip">
      <div class="row" style="display: flex; justify-content: center">
        <div class="col-4">
          <!-- Not Authenticated -->
          <div v-if="!isAuthenticated" class="p-card">
            <div class="p-card__content">
              <div class="u-align-text--center u-sv1"></div>

              <h2 class="u-align-text--center">
                {{ isLoginMode ? "Sign in" : "Create account" }}
              </h2>
              <p class="u-align-text--center u-sv1">
                to continue to LemHand Services
              </p>

              <div class="u-sv1">
                <label for="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  v-model="email"
                  placeholder="Email address"
                  class="u-sv1"
                />

                <label for="password">Password</label>
                <input
                  type="password"
                  id="password"
                  v-model="password"
                  @keyup.enter="handleAuth"
                  placeholder="Password"
                  class="u-sv1"
                />
              </div>

              <p class="u-sv1">
                {{ isLoginMode ? "No account?" : "Already have an account?" }}
                <button
                  class="p-button--link"
                  @click="isLoginMode = !isLoginMode"
                >
                  {{ isLoginMode ? "Create one!" : "Sign in" }}
                </button>
              </p>

              <div v-if="error" class="p-notification--negative">
                <div class="p-notification__content">
                  <p class="p-notification__message">{{ error }}</p>
                </div>
              </div>

              <div class="u-sv1 u-align-text--right">
                <button
                  @click="handleAuth"
                  class="p-button"
                  :disabled="loading"
                >
                  <span v-if="loading" class="p-icon--spinner"></span>
                  {{
                    loading
                      ? "Please wait..."
                      : isLoginMode
                        ? "Sign in"
                        : "Next"
                  }}
                </button>
              </div>
            </div>
          </div>

          <!-- Authenticated -->
          <div v-else class="p-card">
            <div class="p-card__content u-align-text--center">
              <div class="u-sv2">
                <div
                  style="
                    background-color: #0055ff;
                    color: white;
                    border-radius: 50%;
                    width: 4rem;
                    height: 4rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 0 auto;
                  "
                >
                  {{ userEmail.charAt(0).toUpperCase() }}
                </div>
              </div>
              <h2>Welcome back</h2>
              <p class="u-sv2">{{ userEmail }}</p>

              <div class="u-sv2">
                <button @click="handleSignOut" class="p-button--negative">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
