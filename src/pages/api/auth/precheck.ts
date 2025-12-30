import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY, // SOLO server
  { auth: { persistSession: false } }
);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const boleta = String(body.boleta ?? "").trim();

    if (!email || !boleta) {
      return new Response(
        JSON.stringify({ email_exists: false, boleta_exists: false }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1) Boleta en Usuarios (rápido)
    const { data: boletaRow, error: boletaErr } = await supabaseAdmin
      .from("Usuarios")
      .select("id")
      .eq("Boleta", boleta)
      .maybeSingle();

    if (boletaErr) {
      return new Response(
        JSON.stringify({ error: boletaErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) Email en Auth (intento rápido consultando auth.users)
    let email_exists = false;

    const { data: authRow, error: authRowErr } = await supabaseAdmin
      .schema("auth")
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!authRowErr) {
      email_exists = !!authRow;
    } else {
      // 3) Fallback: listUsers (más lento, pero funciona si auth.users no es accesible)
      const perPage = 200; // sube/baja si quieres
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const users = data?.users ?? [];
        email_exists = users.some((u) => (u.email ?? "").toLowerCase() === email);

        if (email_exists) break;
        if (users.length < perPage) break; // ya no hay más páginas
      }
    }

    return new Response(
      JSON.stringify({
        email_exists,
        boleta_exists: !!boletaRow,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
