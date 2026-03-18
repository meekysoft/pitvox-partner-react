import { defineConfig } from 'vite'
import { copyFileSync } from 'fs'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    lib: {
      entry: 'src/index.js',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@tanstack/react-query', 'react-router-dom'],
    },
  },
  plugins: [
    {
      name: 'copy-styles',
      closeBundle() {
        copyFileSync('src/styles.css', 'dist/styles.css')
      },
    },
  ],
})
