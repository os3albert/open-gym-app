import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Il preview è `wrangler dev` (stesso runtime della produzione), non `vite preview`
    baseUrl: 'http://localhost:8787',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
  },
})
