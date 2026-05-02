<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

const posts = ref([])
let unsubscribeBlogs = null

onMounted(() => {
  const blogsRef = collection(db, 'blogs')
  const q = query(blogsRef, orderBy('createdAt', 'desc'))
  
  unsubscribeBlogs = onSnapshot(q, (snapshot) => {
    posts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Fallback if empty
    if (posts.value.length === 0) {
      posts.value = [
        {
          id: 1,
          title: 'Introducing LemHand Internet 2.0',
          excerpt: 'A completely rebuilt browsing experience focused on speed and absolute privacy.',
          image: 'https://placehold.co/800x400/0071e3/fff?text=Browser+Update',
          date: new Date().toLocaleDateString()
        }
      ]
    }
  })
})

onUnmounted(() => {
  if (unsubscribeBlogs) unsubscribeBlogs()
})
</script>

<template>
  <main class="page-container" style="padding: 40px 5%; max-width: 1600px; margin: 0 auto;">
    <div style="margin-bottom: 40px;">
      <h1 style="font-size: 2.5rem; font-weight: 600; margin-bottom: 10px;">LemHand Newsroom</h1>
      <p style="font-size: 1.1rem; color: #666;">The latest updates, releases, and insights from our team.</p>
    </div>

    <div class="ms-product-grid" style="padding: 0;">
      <article v-for="post in posts" :key="post.id" class="ms-card">
        <img :src="post.image" :alt="post.title" class="ms-card-img">
        <div class="ms-card-body">
          <p style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">{{ post.date }}</p>
          <h2 class="ms-card-title" style="font-size: 1.3rem;">{{ post.title }}</h2>
          <p class="ms-card-text" style="font-size: 0.95rem;">{{ post.excerpt }}</p>
          <a href="#" class="ms-link">Read More</a>
        </div>
      </article>
    </div>
  </main>
</template>
