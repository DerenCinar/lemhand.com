<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const pageData = computed(() => {
  const id = route.params.id
  const contentMap = {
    'sitemap': { title: 'Sitemap', text: 'Complete directory of LemHand Corporation pages and services.' },
    'contact': { title: 'Contact LemHand', text: 'Get in touch with our enterprise sales and support teams. Email us at support@lemhand.com.' },
    'privacy': { title: 'Privacy Policy', text: 'At LemHand, your privacy is our priority. We do not track you across the web.' },
    'terms': { title: 'Terms of Use', text: 'By using LemHand software, you agree to our standard end-user license agreement.' },
    'trademarks': { title: 'Trademarks', text: 'LemHand, BusTracker, Quizzy, and LemHand Draw are registered trademarks of LemHand Corporation.' },
    'safety': { title: 'Safety & Eco', text: 'We are committed to building sustainable and safe digital environments for all users.' },
    'ads': { title: 'About our ads', text: 'LemHand does not serve targeted third-party advertisements in our core products.' },
    'internet': { title: 'LemHand Internet', text: 'The ultimate privacy-first browser. Download link coming soon.' },
    'office': { title: 'LemHand Office', text: 'The complete productivity suite. Available for Enterprise customers.' },
    'games': { title: 'LemGames', text: 'Immersive entertainment experiences for everyone. Available soon.' },
    'enterprise': { title: 'Enterprise Solutions', text: 'Scale your business with LemHand Enterprise. Contact sales for a demo.' }
  }
  
  return contentMap[id] || { title: 'Page Content', text: 'This information will be available soon.' }
})
</script>

<template>
  <main class="page-container" style="padding: 80px 5%; max-width: 800px; margin: 0 auto; min-height: 70vh;">
    <h1 style="font-size: 3rem; font-weight: 600; margin-bottom: 20px;">{{ pageData.title }}</h1>
    <div style="width: 50px; height: 4px; background-color: var(--ms-blue); margin-bottom: 30px;"></div>
    <p style="font-size: 1.2rem; line-height: 1.8; color: var(--text-color); opacity: 0.8;">
      {{ pageData.text }}
    </p>
    <br>
    <router-link to="/" class="ms-link">Return to Homepage</router-link>
  </main>
</template>
