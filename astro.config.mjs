// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://ivanramirezz.github.io',
  base: '/Dashboard_PT/',
  output: 'server',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
