<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const heroConfig = ref({
  badge: "Featured",
  title: "Building the Future of Software",
  description: "Discover LemHand's premium ecosystem of web and Android applications designed for modern living. From real-time transit to creative tools.",
  buttonText: "Explore our Products",
  buttonLink: "/products",
  image: "/hero_background_1778471167979.png",
});

let unsubscribeHero = null

onMounted(() => {
  const heroRef = doc(db, 'settings', 'homepage')
  unsubscribeHero = onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data) {
        heroConfig.value = {
          ...heroConfig.value,
          ...data,
          image: data.image && !data.image.includes('placehold.co') ? data.image : heroConfig.value.image
        }
      }
    }
  })
});

onUnmounted(() => {
  if (unsubscribeHero) unsubscribeHero()
})
</script>

<template>
  <main class="min-h-screen bg-base-100">
    <!-- Hero Section -->
    <div class="hero min-h-[70vh] relative overflow-hidden bg-base-200">
      <div class="absolute inset-0 z-0">
        <img src="/hero_background_1778471167979.png" class="w-full h-full object-cover opacity-60 mix-blend-overlay" alt="Hero background" />
        <div class="absolute inset-0 bg-gradient-to-r from-base-100/90 to-transparent"></div>
      </div>
      <div class="hero-content flex-col lg:flex-row-reverse w-full max-w-7xl relative z-10 px-8 py-20">
        <div class="lg:w-1/2 flex justify-center perspective-1000">
           <img :src="heroConfig.image" class="max-w-sm md:max-w-md rounded-2xl shadow-2xl transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500 border border-white/10" alt="Tech Abstract" />
        </div>
        <div class="lg:w-1/2">
          <div v-if="heroConfig.badge" class="badge badge-primary badge-lg mb-6 font-bold shadow-lg shadow-primary/30 py-4 px-6">{{ heroConfig.badge }}</div>
          <h1 class="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-tight mb-6">
            {{ heroConfig.title }}
          </h1>
          <p class="py-6 text-xl md:text-2xl font-light text-base-content/80 max-w-xl">
            {{ heroConfig.description }}
          </p>
          <div class="flex flex-wrap gap-4 mt-4">
            <RouterLink :to="heroConfig.buttonLink" class="btn btn-primary btn-lg rounded-full shadow-lg shadow-primary/40 px-8 hover:scale-105 transition-transform">{{ heroConfig.buttonText }}</RouterLink>
            <RouterLink to="/bustracker" class="btn btn-outline btn-lg rounded-full px-8 hover:scale-105 transition-transform bg-base-100">Try BusTracker</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Showcase -->
    <section class="py-24 px-8 max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold mb-4">Our Ecosystem</h2>
        <p class="text-xl text-base-content/70 max-w-2xl mx-auto">Seamlessly integrated applications designed for peak performance and elegant user experiences.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        <!-- BusTracker -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200 group">
          <figure class="px-4 pt-4 relative overflow-hidden h-64">
            <img src="/bustracker_screenshot.png" alt="BusTracker" class="rounded-xl object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute top-6 right-6 badge badge-accent badge-lg shadow-sm">Hot</div>
          </figure>
          <div class="card-body">
            <h3 class="card-title text-2xl">BusTracker <span class="badge badge-sm badge-outline">Web & Android</span></h3>
            <p class="text-base-content/70">Never miss your ride. Real-time transit accuracy with sleek interactive maps and offline schedules.</p>
            <div class="card-actions justify-end mt-4">
              <RouterLink to="/bustracker" class="btn btn-primary btn-sm rounded-full">Launch App <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></RouterLink>
            </div>
          </div>
        </div>

        <!-- Quizzy -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200 group">
          <figure class="px-4 pt-4 overflow-hidden h-64">
            <img src="/quizzy_screenshot.png" alt="Quizzy" class="rounded-xl object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <h3 class="card-title text-2xl">Quizzy <span class="badge badge-sm badge-outline">Entertainment</span></h3>
            <p class="text-base-content/70">Engaging multiplayer online trivia. Challenge friends in real-time with vibrant, dynamic question cards.</p>
            <div class="card-actions justify-end mt-4">
              <a href="https://quizzy-online.web.app" target="_blank" class="btn btn-primary btn-sm rounded-full">Play Now <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
            </div>
          </div>
        </div>

        <!-- LemHand Office -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200 group">
          <figure class="px-4 pt-4 overflow-hidden h-64">
            <img src="/office_screenshot.png" alt="LemHand Office" class="rounded-xl object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <h3 class="card-title text-2xl">LemHand Office <span class="badge badge-sm badge-outline">Business</span></h3>
            <p class="text-base-content/70">The complete productivity suite for your home and business. Documents, sheets, and presentations.</p>
            <div class="card-actions justify-end mt-4">
              <RouterLink to="/office" class="btn btn-primary btn-sm rounded-full">Launch Suite <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></RouterLink>
            </div>
          </div>
        </div>

        <!-- LemHand Internet -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200 group lg:col-span-1 md:col-span-2">
          <figure class="px-4 pt-4 overflow-hidden h-64">
            <img src="/internet_screenshot.png" alt="LemHand Internet" class="rounded-xl object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <h3 class="card-title text-2xl">LemHand Internet</h3>
            <p class="text-base-content/70">Experience the web without limits. Privacy-first browser built for speed and security.</p>
            <div class="card-actions justify-end mt-4">
              <RouterLink to="/page/internet" class="btn btn-primary btn-sm rounded-full">Download <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></RouterLink>
            </div>
          </div>
        </div>

        <!-- LemHand Draw -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200 group lg:col-span-2 md:col-span-1">
          <figure class="px-4 pt-4 overflow-hidden h-64">
            <img src="/draw_mockup_1778471229746.png" alt="LemHand Draw" class="rounded-xl object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <h3 class="card-title text-2xl">LemHand Draw</h3>
            <p class="text-base-content/70">Professional creative tools. Designed for the modern artist with an expansive digital canvas and dynamic brushes.</p>
            <div class="card-actions justify-end mt-4">
              <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="btn btn-primary btn-sm rounded-full">Get App <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
            </div>
          </div>
        </div>

      </div>
    </section>
  </main>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
.rotate-y-\[-10deg\] {
  transform: rotateY(-10deg);
}
.rotate-x-\[5deg\] {
  transform: rotateX(5deg);
}
.hover\:rotate-0:hover {
  transform: rotateY(0) rotateX(0) !important;
}
</style>
