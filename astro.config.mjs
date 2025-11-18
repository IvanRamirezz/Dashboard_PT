// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ivanramirezz.github.io',
  base: '/Dashboard_PT/',
  vite: {
    plugins: [tailwindcss()],
  },
    integrations: [react()],
});
