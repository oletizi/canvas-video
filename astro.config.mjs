// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'server', // Enable server-side rendering
  adapter: node({
    mode: 'standalone'
  }),
  build: {
    format: 'directory'
  },
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname
      }
    }
  }
});