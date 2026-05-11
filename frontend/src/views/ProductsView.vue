<script setup>
</script>

<template>
  <main class="min-h-screen bg-base-100">
    <!-- Header Section -->
    <div class="bg-base-200 py-20 px-8 text-center border-b border-base-300">
      <h1 class="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">All LemHand Products</h1>
      <p class="text-xl max-w-2xl mx-auto text-base-content/70">Discover the powerful tools that shape the future of your digital life.</p>
    </div>

    <!-- Product Grid -->
    <section class="py-16 px-8 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        
        <!-- LemHand Internet -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200">
          <figure class="px-4 pt-4 overflow-hidden h-56">
            <img src="/internet_screenshot.png" alt="LemHand Internet" class="rounded-xl object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <div class="badge badge-info text-white font-bold mb-2">Browser</div>
            <h3 class="card-title text-2xl">LemHand Internet</h3>
            <p class="text-base-content/70 flex-grow">Experience the web without limits. Privacy-first browser built for speed and security. Protects you from trackers automatically.</p>
            <div class="card-actions justify-end mt-4">
              <RouterLink to="/page/internet" class="link link-primary font-bold hover:underline inline-flex items-center gap-1">Download now <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></RouterLink>
            </div>
          </div>
        </div>

        <!-- BusTracker -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200">
          <figure class="px-4 pt-4 overflow-hidden h-56">
            <img src="/bustracker_screenshot.png" alt="BusTracker" class="rounded-xl object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <div class="badge badge-warning text-black font-bold mb-2">Mobility</div>
            <h3 class="card-title text-2xl">BusTracker</h3>
            <p class="text-base-content/70 flex-grow">Never miss your ride. Real-time accuracy, offline schedules, and live transit maps all in one place.</p>
            <div class="card-actions justify-end mt-4">
              <RouterLink to="/bustracker" class="link link-primary font-bold hover:underline inline-flex items-center gap-1">Launch Web App <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></RouterLink>
            </div>
          </div>
        </div>

        <!-- LemHand Draw -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200">
          <figure class="px-4 pt-4 overflow-hidden h-56">
            <img src="/draw_mockup_1778471229746.png" alt="LemHand Draw" class="rounded-xl object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <div class="badge badge-error text-white font-bold mb-2">Creative</div>
            <h3 class="card-title text-2xl">LemHand Draw</h3>
            <p class="text-base-content/70 flex-grow">Professional creative tools. Designed for the modern artist. Features unlimited layers and brush customization.</p>
            <div class="card-actions justify-end mt-4">
              <a href="https://drive.google.com/drive/folders/1Sf-zlXAhgixnsCynqq0EsUE8HMdXxA7G?usp=sharing" target="_blank" class="link link-primary font-bold hover:underline inline-flex items-center gap-1">Get the app <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
            </div>
          </div>
        </div>

        <!-- LemHand Office -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200">
          <figure class="px-4 pt-4 overflow-hidden h-56">
            <img src="/office_screenshot.png" alt="LemHand Office" class="rounded-xl object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <div class="badge badge-success text-white font-bold mb-2">Productivity</div>
            <h3 class="card-title text-2xl">LemHand Office</h3>
            <p class="text-base-content/70 flex-grow">The complete productivity suite for your home and business. Includes LemWord, LemSheet, and LemPresent.</p>
            <div class="card-actions justify-end mt-4">
              <RouterLink to="/office" class="link link-primary font-bold hover:underline inline-flex items-center gap-1">Launch Office Suite <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></RouterLink>
            </div>
          </div>
        </div>
        
        <!-- Quizzy -->
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200">
          <figure class="px-4 pt-4 overflow-hidden h-56">
            <img src="/quizzy_screenshot.png" alt="Quizzy" class="rounded-xl object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
          </figure>
          <div class="card-body">
            <div class="badge badge-secondary text-white font-bold mb-2">Education</div>
            <h3 class="card-title text-2xl">Quizzy</h3>
            <p class="text-base-content/70 flex-grow">Test your knowledge with our online quiz platform. Create, share, and compete in educational challenges.</p>
            <div class="card-actions justify-end mt-4">
              <a href="https://quizzy-online.web.app" target="_blank" class="link link-primary font-bold hover:underline inline-flex items-center gap-1">Play now <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></a>
            </div>
          </div>
        </div>

      </div>
    </section>
    
    <!-- Enterprise Banner -->
    <section class="bg-gradient-to-r from-primary/10 to-accent/10 py-20 px-8 mt-10 text-center">
      <div class="max-w-3xl mx-auto bg-base-100/60 backdrop-blur-sm p-10 rounded-3xl border border-base-200 shadow-xl">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 text-base-content">Looking for business solutions?</h2>
        <p class="text-xl mb-8 text-base-content/80">LemHand Enterprise offers dedicated support, advanced security features, and bulk licensing to supercharge your organization.</p>
        <RouterLink to="/page/enterprise" class="btn btn-primary btn-lg rounded-full px-10 hover:scale-105 transition-transform shadow-lg shadow-primary/30">Contact Sales</RouterLink>
      </div>
    </section>
  </main>
</template>
