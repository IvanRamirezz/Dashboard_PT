// With `output: 'static'` configured:
export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    // Puedes también redirigir con otro error si quieres
    return new Response("Email and password are required", { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Supabase suele mandar "Invalid login credentials" para credenciales incorrectas
    const msg = (error.message || "").toLowerCase();
    const isInvalidCreds =
      msg.includes("invalid login credentials") ||
      msg.includes("invalid") ||
      error.status === 400 ||
      error.status === 401;

    if (isInvalidCreds) {
      // ⬇️ CAMBIA "/login" por tu ruta real del login
      return redirect("/?error=invalid");
    }

    // Para otros errores (red, configuración, etc.)
    return redirect("/?error=unexpected");
  }

  const { access_token, refresh_token } = data.session;

  cookies.set("sb-access-token", access_token, { path: "/" });
  cookies.set("sb-refresh-token", refresh_token, { path: "/" });

  return redirect("/Dashboard");
};
