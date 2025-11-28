// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['@/assets/css/main.css'],

  nitro: {
    prerender: {
      autoSubfolderIndex: false
    }
  },

  ssr: true,

  runtimeConfig: {
    // Private keys (server-side only)
    aiProviderApiUrl: process.env.AI_PROVIDER_API_URL || 'https://api.z.ai/api/paas/v4/chat/completions',
    aiProviderApiToken: process.env.AI_PROVIDER_API_TOKEN || '',
    aiProviderModel: process.env.AI_PROVIDER_MODEL || 'GLM-4.6',
    aiProviderProxyUrl: process.env.AI_PROVIDER_PROXY_URL || '', // Optional: http://user:pass@proxy:port

    // Public keys (exposed to client)
    public: {
      appName: 'Conflu2UI'
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  build: {
    transpile: ['@vue/repl']
  },

  vite: {
    optimizeDeps: {
      exclude: ['@vue/repl']
    }
  }
})
