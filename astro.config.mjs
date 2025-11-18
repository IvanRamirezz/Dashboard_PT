import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: '/',

  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),

  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
