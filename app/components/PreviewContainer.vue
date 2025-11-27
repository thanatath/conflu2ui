<template>
  <div class="preview-container glass">
    <div class="preview-header">
      <div class="device-label">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Desktop Preview
      </div>
      <div class="device-label">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Mobile Preview
      </div>
    </div>

    <div class="preview-content">
      <!-- Desktop Preview -->
      <div class="desktop-section">
        <div class="device-frame desktop">
          <div class="browser-bar">
            <div class="browser-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="browser-url">localhost:3000</div>
          </div>
          <iframe
            :srcdoc="htmlContent"
            sandbox="allow-scripts allow-same-origin"
            class="preview-iframe"
          ></iframe>
        </div>
      </div>

      <!-- Mobile Preview -->
      <div class="mobile-section">
        <div class="device-frame mobile">
          <div class="phone-notch"></div>
          <iframe
            :srcdoc="htmlContent"
            sandbox="allow-scripts allow-same-origin"
            class="preview-iframe"
          ></iframe>
          <div class="phone-home-bar"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  htmlContent: string;
}>();
</script>

<style scoped>
.preview-container {
  width: 100%;
  padding: 20px;
  margin: 20px 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 10px;
}

.device-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.device-label svg {
  width: 18px;
  height: 18px;
}

.preview-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* Desktop Section */
.desktop-section {
  flex: 1;
  min-width: 0;
}

.device-frame.desktop {
  width: 100%;
  height: 500px;
  background: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.browser-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #252540;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.browser-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }

.browser-url {
  flex: 1;
  padding: 5px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'Monaco', 'Consolas', monospace;
}

/* Mobile Section */
.mobile-section {
  flex-shrink: 0;
}

.device-frame.mobile {
  width: 280px;
  height: 560px;
  background: #1a1a2e;
  border-radius: 36px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  padding: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.phone-notch {
  width: 100px;
  height: 24px;
  background: #1a1a2e;
  border-radius: 0 0 16px 16px;
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.phone-home-bar {
  width: 100px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 8px auto 4px;
}

.device-frame.mobile .preview-iframe {
  flex: 1;
  border-radius: 24px;
  background: white;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.device-frame.desktop .preview-iframe {
  flex: 1;
}

/* Responsive */
@media (max-width: 1200px) {
  .preview-content {
    flex-direction: column;
    align-items: center;
  }

  .desktop-section {
    width: 100%;
    max-width: 800px;
  }

  .device-frame.desktop {
    height: 450px;
  }

  .device-frame.mobile {
    width: 260px;
    height: 520px;
  }
}
</style>
