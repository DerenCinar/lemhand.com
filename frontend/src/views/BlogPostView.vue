<template>
  <main class="l-main">
    <div v-if="loading" class="p-strip">
      <div class="row">
        <div class="col-12 u-align-text--center">
          <i class="p-icon--spinner u-animation--spin"></i>
        </div>
      </div>
    </div>
    
    <div v-else-if="post" class="animate-fade-in">
      <!-- Header -->
      <div class="p-strip--suru">
        <div class="row">
          <div class="col-8 col-start-large-3 u-align-text--center">
            <div class="u-sv2">
              <RouterLink to="/blog" class="p-button--base">&larr; Back to Blog</RouterLink>
            </div>
            <span class="p-chip is-readonly u-sv1">Article</span>
            <h1 class="p-heading--1">{{ post.title }}</h1>
            <p class="p-heading--4 u-sv2">{{ post.date }}</p>
          </div>
        </div>
      </div>
      
      <!-- Image -->
      <div class="row u-sv3" v-if="post.image">
        <div class="col-8 col-start-large-3">
          <img :src="post.image" :alt="post.title" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
        </div>
      </div>

      <!-- Content -->
      <div class="p-strip is-shallow">
        <div class="row">
          <div class="col-8 col-start-large-3">
            <p class="p-heading--3 u-sv3" style="font-weight: 300;">{{ post.excerpt }}</p>
            <hr class="p-rule">
            <div v-html="formattedContent"></div>
            
            <div class="u-sv4" style="border-top: 1px solid #e5e7eb; padding-top: 2rem;">
              <h3 class="p-heading--4">Share this article</h3>
              <button class="p-button--neutral">Twitter</button>
              <button class="p-button--neutral">LinkedIn</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="p-strip">
      <div class="row">
        <div class="col-12 u-align-text--center">
          <h2>Post not found</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <RouterLink to="/blog" class="p-button--positive">Back to Blog</RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const route = useRoute();
const post = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const id = route.params.id;
    // We check if it's the fallback post ID 1 first, as handled in BlogView
    if (id === '1') {
      post.value = {
        id: '1',
        title: 'Introducing LemHand Internet 2.0',
        excerpt: 'A completely rebuilt browsing experience focused on speed and absolute privacy.',
        content: 'We are incredibly excited to announce LemHand Internet 2.0. This major release represents over a year of dedicated engineering to completely rebuild our core browsing experience from the ground up.\n\n### Speed Like Never Before\nOur new proprietary rendering engine ensures that pages load faster than ever, taking full advantage of modern hardware acceleration.\n\n### Absolute Privacy\nWe believe privacy is a fundamental human right. LemHand Internet 2.0 includes state-of-the-art tracker blocking, fingerprinting protection, and automatic HTTPS upgrading for every site you visit.\n\n### Seamless Synchronization\nYour bookmarks, history, and tabs sync securely across all your devices using end-to-end encryption. You hold the keys, not us.',
        image: '/internet_screenshot.png',
        date: new Date().toLocaleDateString()
      };
      loading.value = false;
      return;
    }

    const docRef = doc(db, 'blogs', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      post.value = {
        id: docSnap.id,
        ...data,
        image: data.image && data.image.includes('placehold.co') ? '/internet_screenshot.png' : data.image,
        date: data.date || data.createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
      };
    }
  } catch (error) {
    console.error("Error fetching blog post:", error);
  } finally {
    loading.value = false;
  }
});

const formattedContent = computed(() => {
  if (!post.value || !post.value.content) return '';
  // Basic markdown-like parsing to HTML
  let content = post.value.content;
  content = content.replace(/### (.*)/g, '<h3 class="p-heading--3 u-sv3">$1</h3>');
  content = content.replace(/## (.*)/g, '<h2 class="p-heading--2 u-sv4">$1</h2>');
  content = content.replace(/\n\n/g, '</p><p>');
  return '<p>' + content + '</p>';
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
