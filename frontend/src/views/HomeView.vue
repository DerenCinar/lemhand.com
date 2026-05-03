<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const heroConfig = ref({
  badge: "Featured",
  title: "LemHand Products",
  description: "Discover the ultimate tools for your digital life.",
  buttonText: "See more",
  buttonLink: "/products",
  image: "https://placehold.co/800x600/0067b8/fff?text=LemHand+Surface",
});

let unsubscribeHero = null

onMounted(() => {
  const heroRef = doc(db, 'settings', 'homepage')
  unsubscribeHero = onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      heroConfig.value = docSnap.data()
    }
  })
});

onUnmounted(() => {
  if (unsubscribeHero) unsubscribeHero()
})
</script>

<template>
  <main>
    <section class="ms-hero">
      <img :src="heroConfig.image" alt="Hero Background" class="ms-hero-bg" />
      <div class="ms-hero-content">
        <div v-if="heroConfig.badge" class="ms-hero-badge">
          {{ heroConfig.badge }}
        </div>
        <h1 class="ms-hero-title">{{ heroConfig.title }}</h1>
        <p class="ms-hero-desc">{{ heroConfig.description }}</p>
        <a :href="heroConfig.buttonLink" class="ms-btn-primary">{{
          heroConfig.buttonText
        }}</a>
      </div>
    </section>

    <section class="ms-product-grid">
      <div class="ms-card">
        <img
          src="https://placehold.co/600x400/00a4ef/fff?text=Internet"
          class="ms-card-img"
          alt="LemHand Internet"
        />
        <div class="ms-card-body">
          <h3 class="ms-card-title">LemHand Internet</h3>
          <p class="ms-card-text">
            Experience the web without limits. Privacy-first browser built for
            speed.
          </p>
          <RouterLink to="/page/internet" class="ms-link">Download now</RouterLink>
        </div>
      </div>

      <div class="ms-card">
        <img
          src="https://placehold.co/600x400/ffb900/000?text=BusTracker"
          class="ms-card-img"
          alt="BusTracker"
        />
        <div class="ms-card-body">
          <h3 class="ms-card-title">BusTracker</h3>
          <p class="ms-card-text">
            Never miss your ride. Real-time accuracy and offline schedules.
          </p>
          <RouterLink to="/bustracker" class="ms-link">Launch Web App</RouterLink>
        </div>
      </div>

      <div class="ms-card">
        <img
          src="https://placehold.co/600x400/f25022/fff?text=Draw"
          class="ms-card-img"
          alt="LemHand Draw"
        />
        <div class="ms-card-body">
          <h3 class="ms-card-title">LemHand Draw</h3>
          <p class="ms-card-text">
            Professional creative tools. Designed for the modern artist.
          </p>
          <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="ms-link">Get the app</a>
        </div>
      </div>

      <div class="ms-card">
        <img
          src="https://placehold.co/600x400/7fba00/fff?text=Office"
          class="ms-card-img"
          alt="LemHand Office"
        />
        <div class="ms-card-body">
          <h3 class="ms-card-title">LemHand Office</h3>
          <p class="ms-card-text">
            The complete productivity suite for your home and business.
          </p>
          <RouterLink to="/office" class="ms-link">Launch Office Suite</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>
