<script setup>
</script>

<template>
  <main>
    <div style="background-color: var(--footer-bg); padding: 40px 5%; text-align: center; border-bottom: 1px solid var(--border-color);">
      <h1 style="font-size: 2.5rem; font-weight: 600; margin-bottom: 10px;">All LemHand Products</h1>
      <p style="font-size: 1.1rem; max-width: 600px; margin: 0 auto;">Discover the powerful tools that shape the future of your digital life.</p>
    </div>

    <section class="ms-product-grid" style="padding-top: 60px;">
      
      <div class="ms-card">
        <img src="https://placehold.co/600x400/00a4ef/fff?text=Internet" class="ms-card-img" alt="LemHand Internet">
        <div class="ms-card-body">
          <div class="ms-hero-badge" style="background-color: #00a4ef; color: white;">Browser</div>
          <h3 class="ms-card-title">LemHand Internet</h3>
          <p class="ms-card-text">Experience the web without limits. Privacy-first browser built for speed and security. Protects you from trackers automatically.</p>
          <RouterLink to="/page/internet" class="ms-link">Download now</RouterLink>
        </div>
      </div>

      <div class="ms-card">
        <img src="https://placehold.co/600x400/ffb900/000?text=BusTracker" class="ms-card-img" alt="BusTracker">
        <div class="ms-card-body">
          <div class="ms-hero-badge" style="background-color: #ffb900; color: black;">Mobility</div>
          <h3 class="ms-card-title">BusTracker</h3>
          <p class="ms-card-text">Never miss your ride. Real-time accuracy, offline schedules, and live transit maps all in one place.</p>
          <RouterLink to="/bustracker" class="ms-link">Launch Web App</RouterLink>
        </div>
      </div>

      <div class="ms-card">
        <img src="https://placehold.co/600x400/f25022/fff?text=Draw" class="ms-card-img" alt="LemHand Draw">
        <div class="ms-card-body">
          <div class="ms-hero-badge" style="background-color: #f25022; color: white;">Creative</div>
          <h3 class="ms-card-title">LemHand Draw</h3>
          <p class="ms-card-text">Professional creative tools. Designed for the modern artist. Features unlimited layers and brush customization.</p>
          <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="ms-link">Get the app</a>
        </div>
      </div>

      <div class="ms-card">
        <img src="https://placehold.co/600x400/7fba00/fff?text=Office" class="ms-card-img" alt="LemHand Office">
        <div class="ms-card-body">
          <div class="ms-hero-badge" style="background-color: #7fba00; color: white;">Productivity</div>
          <h3 class="ms-card-title">LemHand Office</h3>
          <p class="ms-card-text">The complete productivity suite for your home and business. Includes LemWord, LemSheet, and LemPresent.</p>
          <RouterLink to="/office" class="ms-link">Launch Office Suite</RouterLink>
        </div>
      </div>
      
      <div class="ms-card">
        <img src="https://placehold.co/600x400/bd10e0/fff?text=Quizzy" class="ms-card-img" alt="Quizzy">
        <div class="ms-card-body">
          <div class="ms-hero-badge" style="background-color: #bd10e0; color: white;">Education</div>
          <h3 class="ms-card-title">Quizzy</h3>
          <p class="ms-card-text">Test your knowledge with our online quiz platform. Create, share, and compete in educational challenges.</p>
          <a href="https://quizzy-online.web.app" target="_blank" class="ms-link">Play now</a>
        </div>
      </div>

    </section>
    
    <section style="background-color: #e6f0f9; padding: 60px 5%; margin-top: 40px; text-align: center;">
      <h2 style="font-size: 2rem; font-weight: 600; margin-bottom: 20px;">Looking for business solutions?</h2>
      <p style="font-size: 1.1rem; margin-bottom: 30px;">LemHand Enterprise offers dedicated support, advanced security features, and bulk licensing.</p>
      <RouterLink to="/page/enterprise" class="ms-btn-primary">Contact Sales</RouterLink>
    </section>
  </main>
</template>
