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
  <main class="min-h-screen bg-base-100 py-20 px-8 max-w-7xl mx-auto">
    <div class="mb-16">
      <h1 class="text-4xl md:text-5xl font-extrabold mb-4 text-base-content">LemHand Newsroom</h1>
      <p class="text-xl text-base-content/70">The latest updates, releases, and insights from our team.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <article v-for="post in posts" :key="post.id" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200">
        <figure class="overflow-hidden h-56">
          <img :src="post.image" :alt="post.title" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
        </figure>
        <div class="card-body">
          <p class="text-sm font-bold text-primary mb-2">{{ post.date || new Date().toLocaleDateString() }}</p>
          <h2 class="card-title text-2xl leading-tight">{{ post.title }}</h2>
          <p class="text-base-content/70 flex-grow mt-2">{{ post.excerpt }}</p>
          <div class="card-actions justify-end mt-4">
            <a href="#" class="link link-primary font-bold hover:underline inline-flex items-center gap-1">Read More <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
          </div>
        </div>
      </article>
    </div>
  </main>
</template>
