// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://ivanramirezz.github.io/Dashboard_PT',
  base: '/Dashboard_PT/',
  vite: {
    plugins: [tailwindcss()],
  },
});
