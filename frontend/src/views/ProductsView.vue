<script setup></script>

<template>
  <main class="l-main">
    <!-- Header Section -->
    <div class="p-strip">
      <div class="row u-align-text--center">
        <div class="col-12">
          <h1>All LemHand Products</h1>
          <p class="p-heading--4">Discover the powerful tools that shape the future of your digital life.</p>
        </div>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="p-strip">
      <div class="row">
        
        <!-- LemHand Internet -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img class="p-card__image" src="/internet_screenshot.png" alt="LemHand Internet">
            <div class="p-card__inner">
              <span class="p-chip is-readonly is-inline u-sv1">Browser</span>
              <h3>LemHand Internet</h3>
              <p class="p-card__content">Experience the web without limits. Privacy-first browser built for speed and security. Protects you from trackers automatically.</p>
              <div class="p-card__footer">
                <RouterLink to="/page/internet" class="p-button">Download now</RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- BusTracker -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img class="p-card__image" src="/bustracker_screenshot.png" alt="BusTracker">
            <div class="p-card__inner">
              <span class="p-chip is-readonly is-inline u-sv1">Mobility</span>
              <h3>BusTracker</h3>
              <p class="p-card__content">Never miss your ride. Real-time accuracy, offline schedules, and live transit maps all in one place.</p>
              <div class="p-card__footer">
                <RouterLink to="/bustracker" class="p-button">Launch Web App</RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- LemHand Draw -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img class="p-card__image" src="/draw_mockup_1778471229746.png" alt="LemHand Draw">
            <div class="p-card__inner">
              <span class="p-chip is-readonly is-inline u-sv1">Creative</span>
              <h3>LemHand Draw</h3>
              <p class="p-card__content">Professional creative tools. Designed for the modern artist. Features unlimited layers and brush customization.</p>
              <div class="p-card__footer">
                <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="p-button">Get the app</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row u-sv2">
        <!-- LemHand Office -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img class="p-card__image" src="/office_screenshot.png" alt="LemHand Office">
            <div class="p-card__inner">
              <span class="p-chip is-readonly is-inline u-sv1">Productivity</span>
              <h3>LemHand Office</h3>
              <p class="p-card__content">The complete productivity suite for your home and business. Includes LemWord, LemSheet, and LemPresent.</p>
              <div class="p-card__footer">
                <RouterLink to="/office" class="p-button">Launch Office Suite</RouterLink>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quizzy -->
        <div class="col-4">
          <div class="p-card u-no-padding">
            <img class="p-card__image" src="/quizzy_screenshot.png" alt="Quizzy">
            <div class="p-card__inner">
              <span class="p-chip is-readonly is-inline u-sv1">Education</span>
              <h3>Quizzy</h3>
              <p class="p-card__content">Test your knowledge with our online quiz platform. Create, share, and compete in educational challenges.</p>
              <div class="p-card__footer">
                <a href="https://quizzy-online.web.app" target="_blank" class="p-button">Play now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enterprise Banner -->
    <div class="p-strip--highlighted">
      <div class="row u-align-text--center">
        <div class="col-12">
          <h2>Looking for business solutions?</h2>
          <p class="p-heading--4">LemHand Enterprise offers dedicated support, advanced security features, and bulk licensing to supercharge your organization.</p>
          <div class="u-sv2">
            <RouterLink to="/page/enterprise" class="p-button">Contact Sales</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
