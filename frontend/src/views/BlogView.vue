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
          image: '/internet_screenshot.png',
          date: new Date().toLocaleDateString()
        }
      ]
    } else {
      posts.value = posts.value.map(post => ({
        ...post,
        image: post.image && post.image.includes('placehold.co') ? '/internet_screenshot.png' : post.image
      }))
    }
  })
})

onUnmounted(() => {
  if (unsubscribeBlogs) unsubscribeBlogs()
})
</script>

<template>
  <main class="l-main">
    <!-- Header -->
    <div class="p-strip">
      <div class="row">
        <div class="col-12">
          <h1>LemHand Newsroom</h1>
          <p class="p-heading--4">The latest updates, releases, and insights from our team.</p>
        </div>
      </div>
    </div>

    <!-- Blog Posts Grid -->
    <div class="p-strip">
      <div class="row">
        <div v-for="post in posts" :key="post.id" class="col-4">
          <div class="p-card u-no-padding">
            <img class="p-card__image" :src="post.image" :alt="post.title">
            <div class="p-card__inner">
              <p class="u-sv1"><small>{{ post.date || new Date().toLocaleDateString() }}</small></p>
              <h3>{{ post.title }}</h3>
              <p class="p-card__content">{{ post.excerpt }}</p>
              <div class="p-card__footer">
                <a href="#" class="p-button">Read More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
