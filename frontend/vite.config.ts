import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite + React stub. The frontend is built in Wave 4.
export default defineConfig({
  plugins: [react()],
});
