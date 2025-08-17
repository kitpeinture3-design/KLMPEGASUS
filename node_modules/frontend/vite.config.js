import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // permet l'accès depuis localhost et ton réseau local si besoin
    port: 3000
  },
  resolve: {
    alias: {
      '@': '/src' // permet d'importer facilement depuis src
    }
  }
});
