<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const pageData = computed(() => {
  const id = route.params.id
  const contentMap = {
    'sitemap': { 
      title: 'Sitemap', 
      text: 'Explore the LemHand Corporation digital ecosystem. Find links to all our major products and services, from BusTracker mobility solutions to our enterprise software suite including LemHand Office and LemHand Draw. If you are looking for specific corporate governance documents, please navigate to our legal section.' 
    },
    'contact': { 
      title: 'Contact LemHand', 
      text: 'Get in touch with our enterprise sales, media, and technical support teams. For customer support regarding BusTracker or LemHand Software, please email support@lemhand.com. For business inquiries and enterprise deployment requests, contact sales@lemhand.com.' 
    },
    'privacy': { 
      title: 'Privacy Policy', 
      text: 'At LemHand, your privacy is our priority. We believe that privacy is a fundamental human right. Our products, from LemHand Internet to BusTracker, are designed to minimize data collection and process information locally on your device whenever possible. We do not sell your personal data to third-party brokers.' 
    },
    'terms': { 
      title: 'Terms of Use', 
      text: 'By accessing or using LemHand software, services, or hardware, you agree to our standard end-user license agreement. These terms govern the use of our intellectual property and detail the acceptable use policy for our online services such as Quizzy and LemGames.' 
    },
    'trademarks': { 
      title: 'Trademarks', 
      text: 'LemHand®, BusTracker®, Quizzy®, LemGames™, LemHand Draw™, and LemHand Office™ are registered trademarks or trademarks of LemHand Corporation in the United States and/or other countries. The absence of a product or service name or logo from this list does not constitute a waiver of LemHand’s trademark or other intellectual property rights concerning that name or logo.' 
    },
    'safety': { 
      title: 'Safety & Eco', 
      text: 'LemHand is committed to building sustainable and safe digital environments for all users. We are actively working towards becoming a carbon-neutral company by 2030 through renewable energy investments for our data centers and prioritizing eco-friendly packaging for any physical media.' 
    },
    'ads': { 
      title: 'About our ads', 
      text: 'LemHand does not serve targeted third-party advertisements in our core productivity software (LemHand Office, LemHand Draw) or our flagship mobility app (BusTracker). Any promotional content displayed within our ecosystem is strictly limited to our own first-party services and products.' 
    },
    'internet': { 
      title: 'LemHand Internet', 
      text: 'The ultimate privacy-first browser built on a modern rendering engine. Experience lightning-fast page loads, built-in tracker blocking, and seamless synchronization across all your devices. The upcoming version 2.0 will feature an entirely redesigned interface tailored for modern computing.' 
    },
    'games': { 
      title: 'LemGames', 
      text: 'Immersive entertainment experiences for everyone. From casual puzzle games to competitive multiplayer environments, LemGames is pushing the boundaries of web-based interactive entertainment.' 
    },
    'enterprise': { 
      title: 'Enterprise Solutions', 
      text: 'Scale your business with LemHand Enterprise. We offer dedicated support, advanced security administration features, and bulk licensing for our entire software suite. Our deployment experts will work directly with your IT department to ensure a smooth transition.' 
    }
  }
  
  return contentMap[id] || { title: 'Page Not Found', text: 'The information you are looking for does not exist or has been moved.' }
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
