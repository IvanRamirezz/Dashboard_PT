// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: 'https://IvanRamirezz.github.io',
  base: 'Dashboard_PT',
  vite: {
    plugins: [tailwindcss()],
  },
});
