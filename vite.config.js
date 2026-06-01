import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Cloudflare Pages SPA fallback plugin.
 *
 * The classic approach (public/_redirects with `/* /index.html 200`) triggers a
 * false-positive "Infinite loop detected" validation error in Cloudflare's
 * Workers + Static Assets system (which Pages now uses under the hood).
 *
 * The reliable workaround: copy index.html → 404.html in the build output.
 * Cloudflare Pages automatically serves 404.html for any unmatched route,
 * which delivers the SPA shell so React Router can take over client-side.
 * This is the approach Cloudflare itself recommends in their docs and uses
 * no _redirects file at all.
 */
function spa404Fallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const src = resolve(dist, 'index.html')
      const dst = resolve(dist, '404.html')
      if (existsSync(src)) {
        copyFileSync(src, dst)
        console.log('  ✓ Copied index.html → 404.html (SPA fallback)')
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), spa404Fallback()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api calls to the Express backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
