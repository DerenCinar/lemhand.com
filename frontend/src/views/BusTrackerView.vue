<script setup>
import { ref } from "vue";

const showAndroidSection = ref(false);
</script>

<template>
  <main class="l-main">
    <!-- Hero Section -->
    <div class="p-strip is-deep is-dark" style="background-color: #0356cb">
      <div class="row">
        <div class="col-8">
          <span class="p-chip is-readonly is-inline u-sv1">New</span>
          <h1>BusTracker</h1>
          <p class="p-heading--4">
            Transform your daily commute. Real-time accuracy, intelligent
            alerts, and offline schedules powered by LemHand.
          </p>
          <div class="u-sv2">
            <a href="https://bus.lemhand.com" target="_blank" class="p-button"
              >Launch Web App</a
            >
            <a href="#features" class="p-button">See features</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="p-strip">
      <div class="row u-align-text--center">
        <div class="col-12">
          <h2>Everything you need to navigate the city</h2>
          <p>
            BusTracker is designed to give you peace of mind. Whether you're
            heading to work, school, or exploring a new city, we've got you
            covered.
          </p>
        </div>
      </div>

      <div class="row">
        <div class="col-4">
          <div class="p-card">
            <div class="u-align-text--center u-sv2">
              <span style="font-size: 2rem; color: #ffb900">◉</span>
            </div>
            <h3 class="p-card__title">Real-Time Tracking</h3>
            <p class="p-card__content">
              Know exactly where your bus is with live GPS updates.
            </p>
          </div>
        </div>

        <div class="col-4">
          <div class="p-card">
            <div class="u-align-text--center u-sv2">
              <span style="font-size: 2rem; color: #ffb900">🗺️</span>
            </div>
            <h3 class="p-card__title">Live Routes</h3>
            <p class="p-card__content">
              View complete route paths and upcoming stops instantly.
            </p>
          </div>
        </div>

        <div class="col-4">
          <div class="p-card">
            <div class="u-align-text--center u-sv2">
              <span style="font-size: 2rem; color: #ffb900">⚡</span>
            </div>
            <h3 class="p-card__title">Easy Navigation</h3>
            <p class="p-card__content">
              Simple, intuitive interface designed for commuters.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Android Release Section (Hidden by default) -->
    <div v-if="showAndroidSection" class="p-strip--highlighted">
      <div class="row">
        <div class="col-12 u-align-text--center">
          <h2>Coming to Android</h2>
          <p class="p-heading--4">
            We are bringing BusTracker to the Google Play Store!
          </p>
          <p>
            Get ready for a native experience with background notifications,
            home screen widgets, and full offline support.
          </p>

          <!-- Screenshots -->
          <div class="row u-sv2">
            <div class="col-4">
              <div class="p-card u-no-padding">
                <img
                  class="p-card__image"
                  src="https://placehold.co/300x600?text=Screenshot+1"
                  alt="Screenshot 1"
                />
              </div>
            </div>
            <div class="col-4">
              <div class="p-card u-no-padding">
                <img
                  class="p-card__image"
                  src="https://placehold.co/300x600?text=Screenshot+2"
                  alt="Screenshot 2"
                />
              </div>
            </div>
            <div class="col-4">
              <div class="p-card u-no-padding">
                <img
                  class="p-card__image"
                  src="https://placehold.co/300x600?text=Screenshot+3"
                  alt="Screenshot 3"
                />
              </div>
            </div>
          </div>

          <div class="u-sv2">
            <button class="p-button" disabled>Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
