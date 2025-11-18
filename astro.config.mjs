// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://ivanramirezz.github.io',
  base: '/Dashboard_PT/',
  output: 'server',
  adapter: node({
    mode: 'standalone', // o 'middleware'
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
