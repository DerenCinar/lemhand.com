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
  <main class="min-h-[70vh] max-w-4xl mx-auto px-8 py-20">
    <h1 class="text-4xl md:text-5xl font-bold mb-6 text-base-content">{{ pageData.title }}</h1>
    <div class="w-16 h-1.5 bg-primary mb-10 rounded-full"></div>
    <p class="text-lg md:text-xl leading-relaxed text-base-content/80 mb-10">
      {{ pageData.text }}
    </p>
    <RouterLink to="/" class="btn btn-outline btn-primary rounded-full px-8 hover:scale-105 transition-transform">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
      Return to Homepage
    </RouterLink>
  </main>
</template>
