import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Make sure assets are copied to stockfish folder
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return 'stockfish/[name][extname]'
          }
          return 'assets/[name].[hash][extname]'
        },
      },
    },
    assetsInlineLimit: 0, // Don't inline wasm
  },
  assetsInclude: ['**/*.wasm'],
})
