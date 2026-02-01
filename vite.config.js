import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Custom domain deploy (e.g., https://blackbridgemindset.com) should use root paths.
  base: '/',
  plugins: [react()],
})
