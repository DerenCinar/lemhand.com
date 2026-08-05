<script setup>
import { ref, onMounted } from "vue";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

// Form State
const reporterName = ref("");
const reporterEmail = ref("");
const title = ref("");
const category = ref("General Site / Other");
const severity = ref("Medium");
const steps = ref("");
const expected = ref("");
const actual = ref("");
const systemInfo = ref("");

// Status State
const loading = ref(false);
const error = ref("");
const success = ref(false);
const ticketId = ref("");

// Categories list
const categories = [
  "LemHand Office - Word",
  "LemHand Office - Sheets",
  "LemHand Office - Slides",
  "LemHand BusTracker",
  "LemHand Blog",
  "LAS / Account Services",
  "General Site / Other"
];

// Severity list
const severities = ["Low", "Medium", "High", "Critical"];

onMounted(() => {
  // Capture User Agent info
  const info = [];
  info.push(`User Agent: ${navigator.userAgent}`);
  info.push(`Language: ${navigator.language}`);
  info.push(`Platform: ${navigator.platform}`);
  info.push(`Screen Resolution: ${window.screen.width}x${window.screen.height}`);
  systemInfo.value = info.join("\n");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      reporterEmail.value = user.email || "";
      reporterName.value = user.displayName || user.email.split("@")[0] || "";
    }
  });
});

const handleSubmit = async () => {
  error.value = "";
  if (!title.value.trim()) {
    error.value = "Please provide a descriptive title for the bug.";
    return;
  }
  if (!reporterEmail.value.trim()) {
    error.value = "Please provide your email address so we can contact you.";
    return;
  }
  if (!actual.value.trim()) {
    error.value = "Please describe the actual behavior or problem you encountered.";
    return;
  }

  loading.value = true;
  try {
    const reportData = {
      title: title.value.trim(),
      reporterName: reporterName.value.trim(),
      reporterEmail: reporterEmail.value.trim(),
      category: category.value,
      severity: severity.value,
      steps: steps.value.trim(),
      expected: expected.value.trim(),
      actual: actual.value.trim(),
      systemInfo: systemInfo.value.trim(),
      status: "Open",
      createdAt: new Date().toISOString(),
      userId: auth.currentUser ? auth.currentUser.uid : null
    };

    const docRef = await addDoc(collection(db, "bugs"), reportData);
    ticketId.value = `LH-BUG-${docRef.id.substring(0, 6).toUpperCase()}`;
    success.value = true;
    
    // Clear form
    title.value = "";
    steps.value = "";
    expected.value = "";
    actual.value = "";
  } catch (err) {
    error.value = "Failed to submit bug report: " + err.message;
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  success.value = false;
  ticketId.value = "";
  error.value = "";
  
  // Keep the user/system info pre-fills
  if (auth.currentUser) {
    reporterEmail.value = auth.currentUser.email || "";
    reporterName.value = auth.currentUser.displayName || auth.currentUser.email.split("@")[0] || "";
  } else {
    reporterEmail.value = "";
    reporterName.value = "";
  }
};
</script>

<template>
  <main class="l-main">
    <!-- Header Strip -->
    <div class="p-strip is-deep is-paper">
      <div class="row">
        <div class="col-8">
          <span class="p-chip is-readonly p-chip--negative u-sv1">Bug Tracker</span>
          <h1>Report a Bug</h1>
          <p class="p-heading--4">
            Help us improve LemHand! Submitting this form creates a developer ticket. Our staff will review it, verify code changes, and update you.
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="p-strip" style="min-height: 60vh;">
      <div class="row">
        <div class="col-8">
          <!-- Success Screen -->
          <div v-if="success" class="p-card u-align-text--center" style="border: 2px solid #0e9f6e; background-color: #f6fdfa; padding: 40px 20px;">
            <div class="p-card__content">
              <span style="font-size: 3.5rem; display: block; margin-bottom: 10px;">🎉</span>
              <h2 style="color: #0e9f6e;">Report Submitted Successfully!</h2>
              <p class="p-heading--5">Thank you for reporting this issue. Your help makes LemHand better for everyone.</p>
              
              <div class="u-sv2" style="background-color: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 4px; display: inline-block; min-width: 250px;">
                <span style="font-size: 0.8rem; text-transform: uppercase; color: #718096; display: block;">Ticket Reference ID</span>
                <strong style="font-size: 1.25rem; font-family: monospace; color: #1a202c;">{{ ticketId }}</strong>
              </div>

              <p class="u-sv3" style="font-size: 0.9rem; color: #4a5568;">
                Our engineering team has been notified. You can track this ticket or file another bug below.
              </p>

              <button @click="handleReset" class="p-button--positive u-sv2">Submit Another Report</button>
            </div>
          </div>

          <!-- Bug Submission Form -->
          <div v-else class="p-card" style="border: 1px solid #e2e8f0;">
            <div class="p-card__content">
              <h2>Submit a Developer Ticket</h2>
              <p class="u-sv1">Please provide as much information as possible to help us reproduce and fix the bug.</p>

              <hr class="u-sv2" />

              <div class="row">
                <!-- Reporter details -->
                <div class="col-6">
                  <div class="form-group">
                    <label for="reporter-name">Your Name</label>
                    <input 
                      type="text" 
                      id="reporter-name" 
                      v-model="reporterName" 
                      placeholder="e.g. John Doe"
                      class="u-sv1"
                    />
                  </div>
                </div>

                <div class="col-6">
                  <div class="form-group">
                    <label for="reporter-email">Email Address <span style="color: red;">*</span></label>
                    <input 
                      type="email" 
                      id="reporter-email" 
                      v-model="reporterEmail" 
                      placeholder="john.doe@example.com"
                      required
                      class="u-sv1"
                    />
                  </div>
                </div>
              </div>

              <div class="row">
                <!-- Category and Severity -->
                <div class="col-6">
                  <div class="form-group">
                    <label for="bug-category">Product / Category</label>
                    <select id="bug-category" v-model="category" class="u-sv1">
                      <option v-for="cat in categories" :key="cat" :value="cat">
                        {{ cat }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="col-6">
                  <div class="form-group">
                    <label for="bug-severity">Severity Level</label>
                    <select id="bug-severity" v-model="severity" class="u-sv1">
                      <option v-for="sev in severities" :key="sev" :value="sev">
                        {{ sev }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Ticket details -->
              <div class="form-group">
                <label for="bug-title">Bug Summary / Title <span style="color: red;">*</span></label>
                <input 
                  type="text" 
                  id="bug-title" 
                  v-model="title" 
                  placeholder="e.g. 'Pasting spreadsheets in LemWord crashes browser tab'"
                  required
                  class="u-sv1"
                />
              </div>

              <div class="form-group">
                <label for="bug-actual">Describe the Bug / Actual Behavior <span style="color: red;">*</span></label>
                <textarea 
                  id="bug-actual" 
                  v-model="actual" 
                  rows="3" 
                  placeholder="What is happening? Describe the symptoms clearly."
                  required
                  class="u-sv1"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="bug-expected">Expected Behavior</label>
                <textarea 
                  id="bug-expected" 
                  v-model="expected" 
                  rows="2" 
                  placeholder="What did you expect to happen instead?"
                  class="u-sv1"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="bug-steps">Steps to Reproduce</label>
                <textarea 
                  id="bug-steps" 
                  v-model="steps" 
                  rows="3" 
                  placeholder="1. Open LemWord&#10;2. Insert 5x5 table&#10;3. Double click cell..."
                  class="u-sv1"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="bug-system">Detected System Info (Editable)</label>
                <textarea 
                  id="bug-system" 
                  v-model="systemInfo" 
                  rows="4" 
                  class="u-sv1"
                  style="font-family: monospace; font-size: 0.8rem; background-color: #fafafa;"
                ></textarea>
              </div>

              <!-- Error Display -->
              <div v-if="error" class="p-notification--negative u-sv2">
                <p class="p-notification__message">{{ error }}</p>
              </div>

              <hr class="u-sv2" />

              <div class="row">
                <div class="col-12 u-align-text--right">
                  <button 
                    @click="handleSubmit" 
                    class="p-button--negative"
                    :disabled="loading"
                  >
                    <span v-if="loading" class="p-icon--spinner"></span>
                    {{ loading ? 'Submitting ticket...' : 'Submit Bug Report' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / Tips -->
        <div class="col-4">
          <div class="p-card" style="border: 1px solid #e2e8f0; background-color: #f7f9fa;">
            <div class="p-card__content">
              <h3>Writing effective bug reports</h3>
              <p style="font-size: 0.9rem;">To help developers resolve bugs as fast as possible:</p>
              
              <ul class="p-list" style="font-size: 0.9rem; padding-left: 10px;">
                <li class="p-list__item" style="border-bottom: none; padding: 4px 0;">
                  🎯 <strong>Be specific</strong> - state exactly what action triggers the bug.
                </li>
                <li class="p-list__item" style="border-bottom: none; padding: 4px 0;">
                  🔄 <strong>List reproduction steps</strong> - help the engineer match your environment and flow.
                </li>
                <li class="p-list__item" style="border-bottom: none; padding: 4px 0;">
                  💻 <strong>Keep system info intact</strong> - browser versions, device types and resolutions matter.
                </li>
              </ul>
              
              <hr class="u-sv2" />

              <h4>Security Notice</h4>
              <p style="font-size: 0.85rem; color: #666;">
                Please do not submit any sensitive information (passwords, payment credentials, personal private data) in the description fields. All tickets are reviewed by our product engineering staff.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
