import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/server';    // 👈 ADAPTADOR CORRECTO PARA VERCEL
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: '/',

  output: 'server',          // SSR necesario para Supabase
  adapter: vercel(),         // 👈 YA NO USAR node()

  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
