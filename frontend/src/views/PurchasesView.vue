<template>
  <main class="l-main">
    <div class="p-strip">
      <div class="row">
        <div class="col-12">
          <h1>My Purchases</h1>
          <hr class="p-rule">
        </div>
      </div>
    </div>
    
    <div class="p-strip is-shallow" v-if="purchases.length === 0">
      <div class="row">
        <div class="col-12 u-align-text--center">
          <div class="p-notification--information">
            <div class="p-notification__content">
              <h2 class="p-notification__title">No purchases yet</h2>
              <p class="p-notification__message">You haven't bought any LemHand products or subscriptions yet.</p>
              <br>
              <RouterLink to="/products" class="p-button--positive">Explore Products</RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="p-strip is-shallow">
      <div class="row" style="display: flex; flex-wrap: wrap;">
        <div v-for="item in purchases" :key="item.id" class="col-6" style="display: flex; margin-bottom: 1rem;">
          <div class="p-card u-no-padding" style="display: flex; flex-direction: column; width: 100%;">
            <img class="p-card__image" :src="item.image" :alt="item.name" style="object-fit: cover; height: 250px; width: 100%;">
            <div class="p-card__inner" style="flex-grow: 1; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="margin-top: 0;">{{ item.name }}</h3>
                <span class="p-chip is-readonly">{{ item.status }}</span>
              </div>
              <p class="p-card__content">{{ item.description }}</p>
              <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <span class="u-sv1" style="margin-bottom: 0;"><small>Purchased: {{ item.date }}</small></span>
                <div>
                  <button class="p-button--base u-no-margin" style="margin-right: 0.5rem;">View Details</button>
                  <button class="p-button--positive u-no-margin" v-if="item.downloadable">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const purchases = ref([]);
let unsubscribePurchases = null;

const fetchPurchases = (user) => {
  if (unsubscribePurchases) unsubscribePurchases();
  
  const purchasesRef = collection(db, 'purchases');
  const q = user ? query(purchasesRef, where('userId', '==', user.uid)) : purchasesRef;
  
  unsubscribePurchases = onSnapshot(q, (snapshot) => {
    let fetchedPurchases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fallback if empty, just like the BlogView
    if (fetchedPurchases.length === 0) {
      purchases.value = [
        {
          id: 1,
          name: 'LemHand Draw',
          description: 'Professional creative tools. Designed for the modern artist. Features unlimited layers and brush customization.',
          date: 'August 1, 2026',
          status: 'Active',
          downloadable: true,
          image: '/draw_mockup_1778471229746.png'
        },
        {
          id: 2,
          name: 'LemHand Office',
          description: 'The complete productivity suite for your home and business. Includes LemWord, LemSheet, and LemPresent.',
          date: 'July 15, 2026',
          status: 'Active',
          downloadable: false,
          image: '/office_screenshot.png'
        }
      ];
    } else {
      purchases.value = fetchedPurchases;
    }
  });
};

let unsubscribeAuth = null;

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    fetchPurchases(user);
  });
});

onUnmounted(() => {
  if (unsubscribePurchases) unsubscribePurchases();
  if (unsubscribeAuth) unsubscribeAuth();
});
</script>
