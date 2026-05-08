<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore'
import { useRoute } from 'vue-router'

const route = useRoute()
const formId = route.params.id

const formTitle = ref('Loading...')
const formFields = ref([])
const formResponse = ref({})
const isLoading = ref(true)
const isSubmitting = ref(false)
const submitStatus = ref('')
const formNotFound = ref(false)

const getFieldValue = (field) => {
  return formResponse.value[field.label] || ''
}

const setFieldValue = (field, value) => {
  formResponse.value[field.label] = value
}

const addCheckboxValue = (field) => {
  if (!formResponse.value[field.label]) {
    formResponse.value[field.label] = []
  }
  return formResponse.value[field.label]
}

onMounted(() => {
  const docRef = doc(db, 'office', formId)
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    isLoading.value = false
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      formTitle.value = data.title || 'Untitled Form'
      formFields.value = data.formFields || []
    } else {
      formNotFound.value = true
    }
  }, (error) => {
    console.error('Error loading form:', error)
    isLoading.value = false
    formNotFound.value = true
  })

  return () => unsubscribe()
})

const validateForm = () => {
  for (const field of formFields.value) {
    if (field.required) {
      const value = formResponse.value[field.label]
      if (!value || (Array.isArray(value) && value.length === 0) || value.trim() === '') {
        submitStatus.value = `${field.label} is required`
        setTimeout(() => { submitStatus.value = '' }, 3000)
        return false
      }
    }
  }
  return true
}

const submitForm = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  submitStatus.value = 'Submitting...'

  try {
    await setDoc(doc(db, 'office', formId), {
      formResponses: arrayUnion(formResponse.value)
    }, { merge: true })

    submitStatus.value = 'Thank you! Your response has been recorded.'
    formResponse.value = {}
    
    setTimeout(() => {
      submitStatus.value = ''
    }, 5000)
  } catch (error) {
    console.error('Error submitting form:', error)
    submitStatus.value = 'Error submitting form. Please try again.'
    setTimeout(() => { submitStatus.value = '' }, 3000)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh; background-color: #f3f2f1; overflow: hidden;">
    
    <!-- Loading State -->
    <div v-if="isLoading" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #f3f2f1; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <svg width="120" height="150" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="100" rx="4" fill="white" stroke="#7b2cbf" stroke-width="4"/>
        <path class="doc-line doc-line-1" d="M 25 35 L 75 35" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
        <path class="doc-line doc-line-2" d="M 25 50 L 75 50" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
        <path class="doc-line doc-line-3" d="M 25 65 L 60 65" stroke="#ccc" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <div style="position: absolute; bottom: 40px; display: flex; flex-direction: column; align-items: center; color: #7b2cbf; font-weight: bold; font-size: 1.2rem;">
        LemHand Office
        <span style="font-size: 0.9rem; font-weight: normal; margin-top: 5px;">Loading form...</span>
      </div>
    </div>

    <!-- Form Not Found -->
    <div v-else-if="formNotFound" style="display: flex; flex-direction: column; height: 100vh; background: #f3f2f1; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: white; border-radius: 8px; padding: 40px; text-align: center; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="font-size: 64px; margin-bottom: 20px;">📋</div>
        <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">Form Not Found</h2>
        <p style="color: #666; margin: 0;">The form you're looking for doesn't exist or has been deleted.</p>
      </div>
    </div>

    <!-- Form View -->
    <template v-else>
      <!-- Top Header -->
      <div style="background-color: #7b2cbf; color: white; padding: 4px 15px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; font-size: 12px; height: 32px;">
        <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1;">
          <RouterLink to="/office" style="color: white; text-decoration: none; font-weight: bold; font-size: 14px;">F</RouterLink>
          <div style="width: 1px; height: 16px; background: rgba(255,255,255,0.3);"></div>
          <span style="font-weight: 600;">{{ formTitle }}</span>
          <span style="font-size: 10px; opacity: 0.7; margin-left: 10px;">Form Response</span>
        </div>
      </div>

      <!-- Form Editor Area -->
      <div style="flex-grow: 1; overflow-y: auto; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; background: #e1dfdd; position: relative;">
        
        <div class="form-page-container" style="width: 816px; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); margin-bottom: 40px;">
          <div style="padding: 20px; background: white; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #7b2cbf;">{{ formTitle }}</h2>
            <p style="margin: 0; color: #666; font-size: 12px;">Please complete all required fields and submit</p>
          </div>

          <!-- Status Message -->
          <div v-if="submitStatus" :style="{ 
            background: submitStatus.includes('Error') ? '#fee' : submitStatus.includes('Thank') ? '#efe' : '#eef',
            color: submitStatus.includes('Error') ? '#c33' : submitStatus.includes('Thank') ? '#3a3' : '#33c',
            padding: '12px 16px',
            margin: '0 20px 20px 20px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500'
          }">
            {{ submitStatus }}
          </div>

          <!-- Form Fields -->
          <form @submit.prevent="submitForm" style="padding: 0 20px 20px 20px; display: flex; flex-direction: column; gap: 20px;">
            
            <template v-for="field in formFields" :key="field.id">
              
              <!-- Short Text, Email, Phone, Number -->
              <div v-if="['text', 'email', 'phone', 'number'].includes(field.type)">
                <label :for="`field-${field.id}`" style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <input
                  :id="`field-${field.id}`"
                  :type="field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text'"
                  :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}...`"
                  :value="getFieldValue(field)"
                  @input="setFieldValue(field, $event.target.value)"
                  :required="field.required"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s;"
                  @focus="$event.target.style.borderColor = '#7b2cbf'"
                  @blur="$event.target.style.borderColor = '#ddd'"
                />
              </div>

              <!-- Long Text / Textarea -->
              <div v-else-if="field.type === 'textarea'">
                <label :for="`field-${field.id}`" style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <textarea
                  :id="`field-${field.id}`"
                  :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}...`"
                  :value="getFieldValue(field)"
                  @input="setFieldValue(field, $event.target.value)"
                  :required="field.required"
                  rows="4"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none; font-family: inherit; transition: border-color 0.2s; resize: vertical;"
                  @focus="$event.target.style.borderColor = '#7b2cbf'"
                  @blur="$event.target.style.borderColor = '#ddd'"
                ></textarea>
              </div>

              <!-- Date -->
              <div v-else-if="field.type === 'date'">
                <label :for="`field-${field.id}`" style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <input
                  :id="`field-${field.id}`"
                  type="date"
                  :value="getFieldValue(field)"
                  @input="setFieldValue(field, $event.target.value)"
                  :required="field.required"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s; cursor: pointer;"
                  @focus="$event.target.style.borderColor = '#7b2cbf'"
                  @blur="$event.target.style.borderColor = '#ddd'"
                />
              </div>

              <!-- Dropdown / Select -->
              <div v-else-if="field.type === 'select'">
                <label :for="`field-${field.id}`" style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <select
                  :id="`field-${field.id}`"
                  :value="getFieldValue(field)"
                  @input="setFieldValue(field, $event.target.value)"
                  :required="field.required"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s; cursor: pointer; background: white;"
                  @focus="$event.target.style.borderColor = '#7b2cbf'"
                  @blur="$event.target.style.borderColor = '#ddd'"
                >
                  <option value="">-- Select an option --</option>
                  <option v-for="(opt, idx) in field.options" :key="idx" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <!-- Radio Buttons -->
              <div v-else-if="field.type === 'radio'">
                <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label v-for="(opt, idx) in field.options" :key="idx" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 400; color: #555;">
                    <input
                      type="radio"
                      :name="`field-${field.id}`"
                      :value="opt"
                      :checked="getFieldValue(field) === opt"
                      @input="setFieldValue(field, opt)"
                      style="cursor: pointer; accent-color: #7b2cbf;"
                    />
                    {{ opt }}
                  </label>
                </div>
              </div>

              <!-- Checkboxes -->
              <div v-else-if="field.type === 'checkbox'">
                <label style="display: block; font-weight: 600; margin-bottom: 12px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label v-for="(opt, idx) in field.options" :key="idx" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 400; color: #555;">
                    <input
                      type="checkbox"
                      :value="opt"
                      :checked="(addCheckboxValue(field)).includes(opt)"
                      @input="(e) => {
                        const arr = addCheckboxValue(field);
                        if (e.target.checked) {
                          arr.push(opt);
                        } else {
                          arr.splice(arr.indexOf(opt), 1);
                        }
                      }"
                      style="cursor: pointer; accent-color: #7b2cbf;"
                    />
                    {{ opt }}
                  </label>
                </div>
              </div>

              <!-- File Upload -->
              <div v-else-if="field.type === 'file'">
                <label :for="`field-${field.id}`" style="display: block; font-weight: 600; margin-bottom: 8px; color: #333;">
                  {{ field.label }}
                  <span v-if="field.required" style="color: #d13438;">*</span>
                </label>
                <input
                  :id="`field-${field.id}`"
                  type="file"
                  @input="setFieldValue(field, $event.target.files[0]?.name || '')"
                  :required="field.required"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none;"
                />
              </div>

            </template>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isSubmitting"
              style="background: linear-gradient(135deg, #7b2cbf 0%, #c239b3 100%); color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: opacity 0.2s;"
              :style="{ opacity: isSubmitting ? 0.6 : 1 }"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit Response' }}
            </button>

          </form>
        </div>
      </div>

      <!-- Status Bar -->
      <div style="background: #7b2cbf; color: white; height: 24px; padding: 0 15px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
        <div>{{ formFields.length }} fields</div>
        <div>LemCloud Connected</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form-page-container {
  width: 816px;
  background: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Loading Lines */
.doc-line { stroke-dasharray: 50; stroke-dashoffset: 50; animation: draw-line 1.5s infinite ease-in-out alternate; }
.doc-line-1 { animation-delay: 0s; }
.doc-line-2 { animation-delay: 0.2s; }
.doc-line-3 { animation-delay: 0.4s; }
@keyframes draw-line { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
</style>
