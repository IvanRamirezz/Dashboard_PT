import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';   // 👈 CAMBIO IMPORTANTE
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: '/',

  output: 'server',        // seguimos usando SSR
  adapter: vercel(),       // usa el adapter serverless de Vercel

  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
