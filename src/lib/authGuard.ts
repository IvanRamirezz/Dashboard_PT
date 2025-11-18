// src/lib/authGuard.ts
import type { AstroGlobal } from "astro";
import { supabase } from "./supabase";

export async function requireAuth(Astro: AstroGlobal) {
  const { cookies, redirect } = Astro;
  const base = import.meta.env.BASE_URL; // p.ej. "/Dashboard_PT/"

  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  // Si no hay cookies → devolvemos un redirect (Response)
  if (!accessToken || !refreshToken) {
    return redirect(base);  // /Dashboard_PT/
  }

  const { data, error } = await supabase.auth.setSession({
    refresh_token: refreshToken.value,
    access_token: accessToken.value,
  });

  if (error || !data.session) {
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });
    return redirect(base);
  }

  // Si todo bien, devolvemos el usuario
  return { user: data.user };
}
