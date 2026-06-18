import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 1420,
    strictPort: true,
    // Tauri expects this exact URL
    host: '0.0.0.0'
  },
  clearScreen: false
});
