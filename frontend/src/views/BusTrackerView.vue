<script setup>
import { ref } from "vue";

// The showAndroidSection ref is no longer strictly needed as we are integrating
// the Android features directly into the new layout, but kept for future use if needed.
const showAndroidSection = ref(true);
</script>

<template>
  <main class="l-main">
    <!-- Hero Section -->
    <div class="p-strip is-deep is-dark" style="background-color: #0356cb">
      <div class="row u-vertically-center">
        <div class="col-6">
          <span class="p-chip is-readonly is-inline u-sv1">New</span>
          <h1>BusTracker</h1>
          <p class="p-heading--3">Your ultimate VTA companion.</p>
          <p class="p-heading--4">
            Track buses, plan trips, and view schedules with ease.
          </p>
          <div class="u-sv3">
            <a
              href="https://play.google.com/store/apps/details?id=com.lemhand.bustracker"
              target="_blank"
              class="p-button--positive u-no-margin--bottom"
              style="margin-right: 1rem"
            >
              Download on Play Store
            </a>
            <a
              href="https://bus.lemhand.com"
              target="_blank"
              class="p-button u-no-margin--bottom"
            >
              Try now on web
            </a>
          </div>
        </div>
        <div class="col-6 u-align-text--center">
          <img
            src="/BusTracker_Images/1.png"
            alt="BusTracker App Hero"
            style="max-height: 500px; object-fit: contain"
          />
        </div>
      </div>
    </div>

    <!-- Feature: Live Tracking -->
    <div class="p-strip">
      <div class="row u-vertically-center">
        <div class="col-6">
          <h2>Live Bus Tracking</h2>
          <p class="p-heading--4">
            Track the exact location of VTA buses in real-time.
          </p>
          <p>
            Never miss a bus again. Watch your bus move on the map and know
            exactly when it will arrive at your stop. Stay updated with
            real-time accuracy and intelligent alerts for your daily commute.
          </p>
        </div>
        <div class="col-6 u-align-text--center">
          <img
            src="/BusTracker_Images/6.png"
            alt="Live Tracking Feature"
            style="max-height: 450px; object-fit: contain"
          />
        </div>
      </div>
    </div>

    <!-- Feature: Trip Planner & Departures -->
    <div class="p-strip is-shallow is-muted">
      <div class="row u-vertically-center">
        <div class="col-6 u-align-text--center">
          <img
            src="/BusTracker_Images/2.png"
            alt="Trip Planner Feature"
            style="max-height: 450px; object-fit: contain"
          />
        </div>
        <div class="col-6">
          <h2>Plan Your Journey</h2>
          <p class="p-heading--4">
            Built-in trip planner with live bus locations.
          </p>
          <p>
            Show departure times and schedules for the VTA so you can plan your
            day perfectly. Get step-by-step navigation for your entire trip,
            from your front door to your destination.
          </p>
        </div>
      </div>
    </div>

    <!-- Feature: Bus Fleet Info -->
    <div class="p-strip">
      <div class="row u-vertically-center">
        <div class="col-6">
          <h2>Detailed Bus Fleet Info</h2>
          <p class="p-heading--4">
            Show model information, fleet numbers and images of VTA buses.
          </p>
          <p>
            Are you a transit enthusiast or just curious about your ride? Search
            buses by fleet number, route, or model information to see detailed
            specifications and photos of the exact bus you're riding.
          </p>
        </div>
        <div class="col-6 u-align-text--center">
          <img
            src="/BusTracker_Images/5.png"
            alt="Bus Information Feature"
            style="max-height: 450px; object-fit: contain"
          />
        </div>
      </div>
    </div>

    <!-- Feature: Native Android & Offline -->
    <div class="p-strip is-shallow is-muted">
      <div class="row u-vertically-center">
        <div class="col-6 u-align-text--center">
          <img
            src="/BusTracker_Images/7.png"
            alt="Offline App Feature"
            style="max-height: 450px; object-fit: contain"
          />
        </div>
        <div class="col-6">
          <h2>Always Available</h2>
          <p class="p-heading--4">
            Native Android app with built-in offline schedules.
          </p>
          <p>
            No signal? No problem. Access offline schedules so you always know
            when the next bus is coming. Enjoy a fast, smooth native Android
            experience with everything you need right in your pocket.
          </p>
        </div>
      </div>
    </div>
    <div class="p-strip">
      <div class="row u-vertically-center">
        <div class="col-6">
          <h2>See Real Time Departures at Each Stop</h2>
          <p class="p-heading--4">See upcoming departures at each stop</p>
          <p>
            Tap any stop to view upcoming departures for all routes serving that
            location. Get real-time estimates so you always know when the next
            bus is arriving.
          </p>
        </div>
        <div class="col-6 u-align-text--center">
          <img
            src="/BusTracker_Images/4.png"
            alt="Bus Information Feature"
            style="max-height: 450px; object-fit: contain"
          />
        </div>
      </div>
    </div>
    <!-- CTA Section -->
    <div class="p-strip is-deep is-dark" style="background-color: #0356cb">
      <div class="row u-align-text--center">
        <div class="col-12">
          <h2>Help Test the Android App!</h2>
          <p class="p-heading--4">
            Be the first to try the latest features and improvements in
            BusTracker!
          </p>
        </div>
      </div>

      <div class="row u-sv3">
        <div class="col-4">
          <a
            href="https://groups.google.com/g/bustracker-testers?pli=1"
            target="_blank"
            class="p-card"
            style="
              display: block;
              text-decoration: none;
              height: 100%;
              color: inherit;
            "
          >
            <div class="u-align-text--center u-sv1">
              <span class="p-heading--1" style="color: #66ccff">1</span>
            </div>
            <h3 class="p-card__title">Join the Google Group</h3>
            <p class="p-card__content">Required for beta access</p>
          </a>
        </div>
        <div class="col-4">
          <a
            href="https://play.google.com/apps/testing/com.lemhand.bustracker"
            target="_blank"
            class="p-card"
            style="
              display: block;
              text-decoration: none;
              height: 100%;
              color: inherit;
            "
          >
            <div class="u-align-text--center u-sv1">
              <span class="p-heading--1" style="color: #66ccff">2</span>
            </div>
            <h3 class="p-card__title">Opt-In as a Tester</h3>
            <p class="p-card__content">Register your Google account</p>
          </a>
        </div>
        <div class="col-4">
          <a
            href="https://play.google.com/store/apps/details?id=com.lemhand.bustracker"
            target="_blank"
            class="p-card"
            style="
              display: block;
              text-decoration: none;
              height: 100%;
              color: inherit;
            "
          >
            <div class="u-align-text--center u-sv1">
              <span class="p-heading--1" style="color: #66ccff">3</span>
            </div>
            <h3 class="p-card__title">Download from Play Store</h3>
            <p class="p-card__content">Install the app on your device</p>
          </a>
        </div>
      </div>

      <div class="row u-align-text--center u-sv3">
        <div class="col-12">
          <p class="p-heading--5" style="margin-bottom: 1rem">
            If you are on Web, you can press Start Tracking to use the web
            version
          </p>
          <a
            href="https://bus.lemhand.com"
            target="_blank"
            class="p-button--positive"
          >
            Start Tracking
          </a>
        </div>
      </div>
    </div>
  </main>
</template>
