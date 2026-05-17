<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <main class="l-main">
    <div class="p-strip">
      <div class="row" style="display: flex; justify-content: center">
        <div class="col-4">
          <div class="p-card">
            <div class="p-card__content u-align-text--center">
              <img src="/404.png" alt="404" width="400px" />
              <h2>Do'h!</h2>
              <p class="u-sv2">Where'd that page go?</p>

              <div class="u-sv2">
                <router-link to="/">
                  <button class="p-button--positive">Return to Home</button>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.not-found-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  background: var(--bg-color);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  z-index: 10;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 10px;
}

.error-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 20px;
}

.error-text {
  font-size: 1.1rem;
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 40px;
  line-height: 1.6;
}

.home-button {
  background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  box-shadow: 0 10px 20px -5px rgba(58, 123, 213, 0.5);
}

.home-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -5px rgba(58, 123, 213, 0.6);
}

.home-button:active {
  transform: translateY(0);
}

/* Background Blobs */
.blob {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(0, 210, 255, 0.15) 0%,
    rgba(58, 123, 213, 0) 70%
  );
  border-radius: 50%;
  filter: blur(40px);
  z-index: 1;
}

.blob-1 {
  top: -100px;
  right: -100px;
  animation: moveBlob1 20s infinite alternate;
}

.blob-2 {
  bottom: -150px;
  left: -100px;
  background: radial-gradient(
    circle,
    rgba(58, 123, 213, 0.15) 0%,
    rgba(0, 210, 255, 0) 70%
  );
  animation: moveBlob2 25s infinite alternate;
}

@keyframes moveBlob1 {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-100px, 100px);
  }
}

@keyframes moveBlob2 {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(150px, -50px);
  }
}
</style>
