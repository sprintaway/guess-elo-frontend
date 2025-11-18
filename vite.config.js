// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return 'stockfish/[name][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
    // Ensure WASM files aren't processed
    assetsInlineLimit: 0,
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    fs: {
      strict: false,
    },
  },
  assetsInclude: ['**/*.wasm'],
})