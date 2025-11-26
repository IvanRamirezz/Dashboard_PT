import type { APIContext } from "astro";
import { supabase } from "../lib/supabase";

const ROL_PROFESOR = 2; // Ajusta si tu ID del profesor es diferente

// 🔐 Verifica sesión
export async function requireAuth(Astro: APIContext) {
  const access = Astro.cookies.get("sb-access-token");
  const refresh = Astro.cookies.get("sb-refresh-token");

  if (!access || !refresh) {
    return Astro.redirect("/signin");
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: access.value,
    refresh_token: refresh.value,
  });

  if (error || !data.session) {
    Astro.cookies.delete("sb-access-token", { path: "/" });
    Astro.cookies.delete("sb-refresh-token", { path: "/" });
    return Astro.redirect("/signin");
  }

  return { user: data.session.user };
}

// 🔐 SOLO PROFESORES PUEDEN ENTRAR
export async function requireProfessor(Astro: APIContext) {
  const session = await requireAuth(Astro);

  if (session instanceof Response) return session;

  const user = session.user;

  const { data, error } = await supabase
    .from("Usuarios")
    .select("Rol_id")
    .eq("auth_uid", user.id)
    .maybeSingle();

  if (error || !data) {
    return Astro.redirect("/signin");
  }

  if (data.Rol_id !== ROL_PROFESOR) {
    return Astro.redirect("/no-autorizado"); // puedes crear esta página
  }

  return { user };
}
