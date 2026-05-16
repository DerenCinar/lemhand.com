<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const heroConfig = ref({
  badge: "Featured",
  title: "Building the Future of Software",
  description:
    "Discover LemHand's premium ecosystem of web and Android applications designed for modern living. From real-time transit to creative tools.",
  buttonText: "Explore our Products",
  buttonLink: "/products",
  button2Text: "Visit BusTracker",
  button2Link: "/bustracker",
  image: "/hero_background_1778471167979.png",
});

let unsubscribeHero = null;

onMounted(() => {
  const heroRef = doc(db, "settings", "homepage");
  unsubscribeHero = onSnapshot(heroRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data) {
        heroConfig.value = {
          ...heroConfig.value,
          ...data,
          image:
            data.image && !data.image.includes("placehold.co")
              ? data.image
              : heroConfig.value.image,
        };
      }
    }
  });
});

onUnmounted(() => {
  if (unsubscribeHero) unsubscribeHero();
});
</script>

<template>
  <main class="l-main">
    <!-- Hero Section -->
    <div class="p-strip is-deep is-paper">
      <div class="row">
        <div class="col-8">
          <span
            v-if="heroConfig.badge"
            class="p-chip is-readonly is-inline u-sv1 p-chip--positive"
            >{{ heroConfig.badge }}</span
          >
          <h1>{{ heroConfig.title }}</h1>
          <p class="p-heading--4">
            {{ heroConfig.description }}
          </p>
          <div class="u-sv2" style="display: flex; gap: 10px;">
            <RouterLink :to="heroConfig.buttonLink" class="p-button">{{
              heroConfig.buttonText
            }}</RouterLink>
            <RouterLink 
              v-if="heroConfig.button2Text && heroConfig.button2Link && heroConfig.button2Link.startsWith('/')" 
              :to="heroConfig.button2Link" 
              class="p-button--positive"
            >{{ heroConfig.button2Text }}</RouterLink>
            <a 
              v-else-if="heroConfig.button2Text && heroConfig.button2Link" 
              :href="heroConfig.button2Link" 
              target="_blank" 
              class="p-button--positive"
            >{{ heroConfig.button2Text }}</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Showcase -->
    <div class="p-strip">
      <div class="row">
        <div class="col-12">
          <h2>Our Ecosystem</h2>
          <p>
            Seamlessly integrated applications designed for peak performance and
            elegant user experiences.
          </p>
        </div>
      </div>

      <div class="row">
        <!-- BusTracker -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img
              class="p-card__image"
              src="/bustracker_screenshot.png"
              alt="BusTracker"
            />
            <div class="p-card__inner">
              <h3>BusTracker</h3>
              <p>
                Never miss your ride. Real-time transit accuracy with sleek
                interactive maps and offline schedules.
              </p>
              <RouterLink to="/bustracker" class="p-button"
                >Launch App</RouterLink
              >
            </div>
          </div>
        </div>

        <!-- Quizzy -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img
              class="p-card__image"
              src="/quizzy_screenshot.png"
              alt="Quizzy"
            />
            <div class="p-card__inner">
              <h3>Quizzy</h3>
              <p>
                Engaging multiplayer online trivia. Challenge friends in
                real-time with vibrant, dynamic question cards.
              </p>
              <a
                href="https://quizzy-online.web.app"
                target="_blank"
                class="p-button"
                >Play Now</a
              >
            </div>
          </div>
        </div>

        <!-- LemHand Office -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img
              class="p-card__image"
              src="/office_screenshot.png"
              alt="LemHand Office"
            />
            <div class="p-card__inner">
              <h3>LemHand Office</h3>
              <p>
                The complete productivity suite for your home and business.
                Documents, sheets, and presentations.
              </p>
              <RouterLink to="/office" class="p-button"
                >Launch Suite</RouterLink
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Card -->
    <div class="p-strip--highlighted">
      <div class="row">
        <div class="col-12">
          <div class="p-card">
            <h3>We'd love to see your feedback!</h3>
            <p class="p-card__content">
              LemHand is a work in progress. We are always looking for ways to
              improve our products and services. If you have any suggestions or
              feedback, please let us know. We would love to hear from you.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
