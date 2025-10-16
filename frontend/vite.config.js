import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from the project root so we can import Hardhat artifacts
      allow: [path.resolve(__dirname, '..')]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
