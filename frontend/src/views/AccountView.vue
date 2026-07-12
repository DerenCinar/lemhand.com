<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  signOut
} from "firebase/auth";

const router = useRouter();

// State
const loading = ref(true);
const user = ref(null);
const activeTab = ref("profile"); // profile, security, licenses, danger

// Profile Form State
const displayName = ref("");
const profileError = ref("");
const profileSuccess = ref("");
const profileLoading = ref(false);

// Password Form State
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");
const passwordLoading = ref(false);

// Reset Password Email State
const resetEmailSent = ref(false);
const resetEmailLoading = ref(false);

// Delete Account State
const deleteEmailConfirmation = ref("");
const deleteError = ref("");
const deleteLoading = ref(false);
const showDeleteConfirm = ref(false);

let unsubscribeAuth = null;

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      user.value = currentUser;
      displayName.value = currentUser.displayName || "";
      loading.value = false;
    } else {
      user.value = null;
      loading.value = false;
      // Redirect to login if not authenticated
      router.push("/login");
    }
  });
});

onUnmounted(() => {
  if (unsubscribeAuth) unsubscribeAuth();
});

// Format dates nicely
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getInitials = (email, name) => {
  if (name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
};

// Actions
const handleUpdateProfile = async () => {
  profileError.value = "";
  profileSuccess.value = "";
  profileLoading.value = true;
  try {
    await updateProfile(auth.currentUser, {
      displayName: displayName.value
    });
    // Refresh user object reference
    user.value = { ...auth.currentUser };
    profileSuccess.value = "Profile updated successfully!";
  } catch (err) {
    profileError.value = err.message;
  } finally {
    profileLoading.value = false;
  }
};

const handleUpdatePassword = async () => {
  passwordError.value = "";
  passwordSuccess.value = "";
  
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "New passwords do not match.";
    return;
  }

  if (newPassword.value.length < 6) {
    passwordError.value = "Password must be at least 6 characters long.";
    return;
  }

  passwordLoading.value = true;
  try {
    await updatePassword(auth.currentUser, newPassword.value);
    passwordSuccess.value = "Password changed successfully!";
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err) {
    if (err.code === "auth/requires-recent-login") {
      passwordError.value = "For security reasons, this action requires a recent sign-in. Please sign out and sign back in to change your password.";
    } else {
      passwordError.value = err.message;
    }
  } finally {
    passwordLoading.value = false;
  }
};

const handleSendResetEmail = async () => {
  resetEmailLoading.value = true;
  try {
    await sendPasswordResetEmail(auth, user.value.email);
    resetEmailSent.value = true;
    setTimeout(() => {
      resetEmailSent.value = false;
    }, 8000);
  } catch (err) {
    passwordError.value = "Error sending reset email: " + err.message;
  } finally {
    resetEmailLoading.value = false;
  }
};

const handleDeleteAccount = async () => {
  deleteError.value = "";
  if (deleteEmailConfirmation.value !== user.value.email) {
    deleteError.value = "Email address does not match.";
    return;
  }

  deleteLoading.value = true;
  try {
    await deleteUser(auth.currentUser);
    alert("Your account has been deleted successfully.");
    router.push("/");
  } catch (err) {
    if (err.code === "auth/requires-recent-login") {
      deleteError.value = "For security reasons, this action requires a recent sign-in. Please sign out, sign back in, and try deleting your account again.";
    } else {
      deleteError.value = err.message;
    }
  } finally {
    deleteLoading.value = false;
  }
};

const handleSignOut = async () => {
  await signOut(auth);
  router.push("/");
};
</script>

<template>
  <main class="l-main">
    <!-- Header Strip -->
    <div class="p-strip is-paper" style="padding-bottom: 24px;">
      <div class="row">
        <div class="col-12">
          <h1>My Account</h1>
          <p class="p-heading--5">Manage your credentials, security settings, and product licensing.</p>
        </div>
      </div>
    </div>

    <!-- Main Container -->
    <div class="p-strip" style="padding-top: 12px; min-height: 60vh;">
      <!-- Loading State -->
      <div v-if="loading" class="row">
        <div class="col-12 u-align-text--center" style="padding: 100px 0;">
          <span class="p-icon--spinner" style="font-size: 2rem;"></span>
          <p class="u-sv2">Loading account details...</p>
        </div>
      </div>

      <!-- Main Layout -->
      <div v-else-if="user" class="row">
        <!-- Sidebar Navigation -->
        <div class="col-3">
          <div class="p-card u-align-text--center u-sv2" style="background-color: #fafafa; border: 1px solid #e0e0e0;">
            <div class="p-card__content">
              <!-- Avatar -->
              <div class="u-sv2">
                <div class="avatar-circle">
                  {{ getInitials(user.email, user.displayName) }}
                </div>
              </div>
              
              <!-- Basic Info -->
              <h3 class="u-no-margin-bottom">{{ user.displayName || 'LemHand User' }}</h3>
              <p class="p-heading--6 u-sv1" style="color: #666; word-break: break-all;">{{ user.email }}</p>
              
              <div v-if="user.email.endsWith('@lemhand.com')" class="u-sv1">
                <span class="p-chip is-readonly p-chip--positive">LemHand Employee</span>
              </div>
            </div>
          </div>

          <!-- Tab Selector List -->
          <ul class="p-list">
            <li class="p-list__item" style="padding: 0;">
              <button 
                class="tab-btn" 
                :class="{ 'active-tab-btn': activeTab === 'profile' }"
                @click="activeTab = 'profile'"
              >
                <i class="tab-icon">👤</i> Profile Details
              </button>
            </li>
            <li class="p-list__item" style="padding: 0;">
              <button 
                class="tab-btn" 
                :class="{ 'active-tab-btn': activeTab === 'security' }"
                @click="activeTab = 'security'"
              >
                <i class="tab-icon">🔒</i> Security & Password
              </button>
            </li>
            <li class="p-list__item" style="padding: 0;">
              <button 
                class="tab-btn" 
                :class="{ 'active-tab-btn': activeTab === 'licenses' }"
                @click="activeTab = 'licenses'"
              >
                <i class="tab-icon">💳</i> Product Licenses
              </button>
            </li>
            <li class="p-list__item" style="padding: 0;">
              <button 
                class="tab-btn danger-tab" 
                :class="{ 'active-danger-tab': activeTab === 'danger' }"
                @click="activeTab = 'danger'"
              >
                <i class="tab-icon">⚠️</i> Danger Zone
              </button>
            </li>
          </ul>

          <div class="u-sv2">
            <button @click="handleSignOut" class="p-button--negative u-full-width">Sign Out</button>
          </div>
        </div>

        <!-- Main Account Content Panel -->
        <div class="col-9">
          <!-- Profile View -->
          <div v-if="activeTab === 'profile'" class="p-card" style="border: 1px solid #e0e0e0;">
            <div class="p-card__content">
              <h2>Profile Details</h2>
              <p>Verify or update your profile details below.</p>
              
              <hr class="u-sv2" />

              <div class="row">
                <div class="col-6">
                  <div class="form-group">
                    <label for="prof-display-name">Display Name</label>
                    <input 
                      type="text" 
                      id="prof-display-name" 
                      v-model="displayName" 
                      placeholder="e.g. John Doe"
                      class="u-sv1"
                    />
                  </div>

                  <div v-if="profileError" class="p-notification--negative u-sv1">
                    <p class="p-notification__message">{{ profileError }}</p>
                  </div>

                  <div v-if="profileSuccess" class="p-notification--positive u-sv1">
                    <p class="p-notification__message">{{ profileSuccess }}</p>
                  </div>

                  <button 
                    @click="handleUpdateProfile" 
                    class="p-button--positive" 
                    :disabled="profileLoading"
                  >
                    <span v-if="profileLoading" class="p-icon--spinner"></span>
                    Save Profile Changes
                  </button>
                </div>

                <div class="col-6" style="border-left: 1px solid #eee; padding-left: 24px;">
                  <h4>Metadata Details</h4>
                  
                  <div class="meta-field">
                    <span class="meta-label">Unique User ID (UID):</span>
                    <code class="meta-val">{{ user.uid }}</code>
                  </div>
                  
                  <div class="meta-field">
                    <span class="meta-label">Email Verified:</span>
                    <span class="meta-val">{{ user.emailVerified ? '✅ Yes' : '❌ No' }}</span>
                  </div>

                  <div class="meta-field">
                    <span class="meta-label">Account Created:</span>
                    <span class="meta-val">{{ formatDate(user.metadata.creationTime) }}</span>
                  </div>

                  <div class="meta-field">
                    <span class="meta-label">Last Sign In:</span>
                    <span class="meta-val">{{ formatDate(user.metadata.lastSignInTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Security & Password View -->
          <div v-if="activeTab === 'security'" class="p-card" style="border: 1px solid #e0e0e0;">
            <div class="p-card__content">
              <h2>Security & Password</h2>
              <p>Change your account password or trigger a password reset verification link to your email.</p>
              
              <hr class="u-sv2" />

              <div class="row">
                <div class="col-6">
                  <h3>Direct Password Change</h3>
                  <p class="p-heading--6" style="color: #666;">Provide a new password below. Make sure it has at least 6 characters.</p>
                  
                  <div class="form-group u-sv1">
                    <label for="new-pass">New Password</label>
                    <input 
                      type="password" 
                      id="new-pass" 
                      v-model="newPassword" 
                      placeholder="••••••••"
                      class="u-sv1"
                    />

                    <label for="confirm-pass">Confirm New Password</label>
                    <input 
                      type="password" 
                      id="confirm-pass" 
                      v-model="confirmPassword" 
                      placeholder="••••••••"
                      class="u-sv1"
                    />
                  </div>

                  <div v-if="passwordError" class="p-notification--negative u-sv1">
                    <p class="p-notification__message">{{ passwordError }}</p>
                  </div>

                  <div v-if="passwordSuccess" class="p-notification--positive u-sv1">
                    <p class="p-notification__message">{{ passwordSuccess }}</p>
                  </div>

                  <button 
                    @click="handleUpdatePassword" 
                    class="p-button" 
                    :disabled="passwordLoading"
                  >
                    <span v-if="passwordLoading" class="p-icon--spinner"></span>
                    Update Password
                  </button>
                </div>

                <div class="col-6" style="border-left: 1px solid #eee; padding-left: 24px;">
                  <h3>Reset via Email Link</h3>
                  <p>Alternatively, we can email you a link to securely reset your password via Firebase Account Services.</p>
                  
                  <div v-if="resetEmailSent" class="p-notification--positive u-sv1">
                    <p class="p-notification__message">Password reset email sent to <b>{{ user.email }}</b>! Please check your spam folder if you do not see it shortly.</p>
                  </div>

                  <button 
                    @click="handleSendResetEmail" 
                    class="p-button--neutral" 
                    :disabled="resetEmailLoading || resetEmailSent"
                  >
                    <span v-if="resetEmailLoading" class="p-icon--spinner"></span>
                    Send Password Reset Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Licenses View -->
          <div v-if="activeTab === 'licenses'" class="p-card" style="border: 1px solid #e0e0e0;">
            <div class="p-card__content">
              <h2>Product Licenses & Subscriptions</h2>
              <p>Check the validity and details of your LemHand software products, subscriptions, and services licenses.</p>
              
              <hr class="u-sv2" />

              <table class="u-full-width">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>License Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>LemHand Office Suite</strong>
                      <span style="display: block; font-size: 0.8rem; color: #666;">Access to Word, Sheets, and Presentations</span>
                    </td>
                    <td>Premium Personal License</td>
                    <td><span class="p-chip is-readonly p-chip--positive">Active</span></td>
                    <td>
                      <RouterLink to="/office" class="p-button--link" style="padding: 0;">Open Office</RouterLink>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>LemHand BusTracker</strong>
                      <span style="display: block; font-size: 0.8rem; color: #666;">Real-time transit tracker application</span>
                    </td>
                    <td>Lifetime Developer Account</td>
                    <td><span class="p-chip is-readonly p-chip--positive">Active</span></td>
                    <td>
                      <RouterLink to="/bustracker" class="p-button--link" style="padding: 0;">Open BusTracker</RouterLink>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>LemHand Draw</strong>
                      <span style="display: block; font-size: 0.8rem; color: #666;">Premium sketching and design app</span>
                    </td>
                    <td>Community Edition</td>
                    <td><span class="p-chip is-readonly" style="background-color: #eee; color: #333;">Free Tier</span></td>
                    <td>
                      <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="p-button--link" style="padding: 0;">Get App</a>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="u-sv2" style="background-color: #f7f9fa; border: 1px solid #e2e8f0; padding: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <h4 class="u-no-margin-bottom">Need Enterprise features?</h4>
                  <p class="u-no-margin-bottom" style="font-size: 0.9rem; color: #555;">Upgrade your team to LemHand Corporation Cloud for unlimited collaboration, custom domains, and offline rules.</p>
                </div>
                <RouterLink to="/page/enterprise" class="p-button--positive">Upgrade Now</RouterLink>
              </div>
            </div>
          </div>

          <!-- Danger Zone View -->
          <div v-if="activeTab === 'danger'" class="p-card" style="border: 1px solid #ef4444; background-color: #fdf2f2;">
            <div class="p-card__content">
              <h2 style="color: #b91c1c;">Danger Zone</h2>
              <p style="color: #7f1d1d;">These actions are permanent and cannot be undone. Please proceed with caution.</p>
              
              <hr class="u-sv2" style="border-top-color: #fca5a5;" />

              <div v-if="!showDeleteConfirm">
                <h3>Delete Account</h3>
                <p style="color: #7f1d1d; margin-bottom: 20px;">
                  Permanently erase your account, all credentials, collaborations, and cloud files stored on the LemHand server. 
                  This is irreversible.
                </p>
                <button @click="showDeleteConfirm = true" class="p-button--negative">Delete My LemHand Account</button>
              </div>

              <div v-else>
                <h3 style="color: #b91c1c;">Are you absolutely sure?</h3>
                <p style="color: #7f1d1d;">
                  To confirm account deletion, please type your email address (<b>{{ user.email }}</b>) in the verification box below.
                </p>

                <div class="form-group u-sv1">
                  <label for="delete-email" style="color: #7f1d1d;">Confirm your email address</label>
                  <input 
                    type="text" 
                    id="delete-email" 
                    v-model="deleteEmailConfirmation" 
                    :placeholder="user.email"
                    class="u-sv1"
                    style="border-color: #fca5a5;"
                  />
                </div>

                <div v-if="deleteError" class="p-notification--negative u-sv1">
                  <p class="p-notification__message">{{ deleteError }}</p>
                </div>

                <div class="row">
                  <div class="col-12" style="display: flex; gap: 10px;">
                    <button 
                      @click="handleDeleteAccount" 
                      class="p-button--negative"
                      :disabled="deleteLoading || deleteEmailConfirmation !== user.email"
                    >
                      <span v-if="deleteLoading" class="p-icon--spinner"></span>
                      Permanently Delete Account
                    </button>
                    <button @click="showDeleteConfirm = false" class="p-button--neutral">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.avatar-circle {
  background-color: #0055ff;
  color: white;
  border-radius: 50%;
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.25rem;
  font-weight: bold;
  margin: 0 auto 1rem;
}

.tab-btn {
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease-in-out;
  border-radius: 4px;
}

.tab-btn:hover {
  background-color: #f1f3f5;
  color: #000;
}

.active-tab-btn {
  background-color: #0055ff !important;
  color: white !important;
}

.tab-icon {
  margin-right: 8px;
  display: inline-block;
  text-align: center;
  width: 1.25rem;
}

.danger-tab:hover {
  background-color: #fee2e2;
  color: #b91c1c;
}

.active-danger-tab {
  background-color: #ef4444 !important;
  color: white !important;
}

.meta-field {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #666;
  font-weight: 600;
}

.meta-val {
  font-size: 0.95rem;
  color: #111;
  font-weight: 500;
  margin-top: 2px;
}

.meta-val::selection {
  background-color: #cce0ff;
}

code.meta-val {
  background-color: #f1f3f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  width: fit-content;
}
</style>
