<script setup></script>

<template>
  <main>
    <section class="ms-hero" style="background-color: #0356cb">
      <!--<img
        src=""
        alt="BusTracker Background"
        class="ms-hero-bg"
        style="object-fit: cover"
      />-->
      <div class="ms-hero-content">
        <div class="ms-hero-badge">New</div>
        <h1 class="ms-hero-title">BusTracker</h1>
        <p class="ms-hero-desc">
          Transform your daily commute. Real-time accuracy, intelligent alerts,
          and offline schedules powered by LemHand.
        </p>
        <div style="display: flex; gap: 15px">
          <a
            href="https://bus.lemhand.com"
            target="_blank"
            class="ms-btn-primary"
            style="background-color: #000; color: #fff"
            >Launch Web App</a
          >
          <a href="#" class="ms-link" style="padding: 10px 0; color: white"
            >See features</a
          >
        </div>
      </div>
    </section>

    <section style="padding: 80px 5%; max-width: 1200px; margin: 0 auto">
      <div style="text-align: center; margin-bottom: 60px">
        <h2 style="font-size: 2.5rem; font-weight: 600; margin-bottom: 15px">
          Everything you need to navigate the city
        </h2>
        <p
          style="
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
            color: #666;
          "
        >
          BusTracker is designed to give you peace of mind. Whether you're
          heading to work, school, or exploring a new city, we've got you
          covered.
        </p>
      </div>

      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
        "
      >
        <div>
          <div style="font-size: 2rem; color: #ffb900; margin-bottom: 15px">
            ◉
          </div>
          <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 10px">
            Real-Time Tracking
          </h3>
          <p style="color: #666; line-height: 1.6">
            Know exactly where your bus is with live GPS updates.
          </p>
        </div>

        <div>
          <div style="font-size: 2rem; color: #ffb900; margin-bottom: 15px">
            🗺️
          </div>
          <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 10px">
            Live Routes
          </h3>
          <p style="color: #666; line-height: 1.6">
            View complete route paths and upcoming stops instantly.
          </p>
        </div>

        <div>
          <div style="font-size: 2rem; color: #ffb900; margin-bottom: 15px">
            ⚡
          </div>
          <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 10px">
            Easy Navigation
          </h3>
          <p style="color: #666; line-height: 1.6">
            Simple, intuitive interface designed for commuters.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
