// src/pages/api/auth/register.ts
export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

// ✅ Cliente ADMIN (solo servidor)
const supabaseAdmin = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
);

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();

    const nombre = formData.get("nombre")?.toString().trim() ?? "";
    const apellidoPaterno = formData.get("apellidoPaterno")?.toString().trim() ?? "";
    const apellidoMaterno = formData.get("apellidoMaterno")?.toString().trim() || null;

    const email = (formData.get("email")?.toString().trim() ?? "").toLowerCase();
    const password = formData.get("password")?.toString() ?? "";
    const passwordConfirm = formData.get("passwordConfirm")?.toString() ?? "";

    // Validaciones básicas
    if (!nombre || !apellidoPaterno || !email || !password) {
      return new Response("Faltan campos obligatorios", { status: 400 });
    }

    if (password !== passwordConfirm) {
      return redirect(`/Registro-Profe?type=password`);
    }

    // ✅ 0) PRECHECK server-side: validar si el email ya existe en Auth
    const perPage = 200;
    let emailExists = false;

    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        return new Response(`Error validando correo: ${error.message}`, { status: 500 });
      }

      const users = data?.users ?? [];
      emailExists = users.some((u) => (u.email ?? "").toLowerCase() === email);

      if (emailExists) break;
      if (users.length < perPage) break; // ya no hay más páginas
    }

    if (emailExists) {
      return redirect(`/Registro-Profe?type=email&value=${encodeURIComponent(email)}`);
    }

    // 1) Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      const msg = (authError.message || "").toLowerCase();

      if (msg.includes("rate limit")) {
        return redirect(`/Registro-Profe?type=rate&value=${encodeURIComponent(email)}`);
      }

      // por si el provider sí regresa "exists"
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return redirect(`/Registro-Profe?type=email&value=${encodeURIComponent(email)}`);
      }

      return new Response(`Auth error: ${authError.message}`, { status: 500 });
    }

    const user = authData.user;
    if (!user) {
      return new Response("User creation failed", { status: 500 });
    }

    // 2) Insertar en Usuarios (⚠️ esto solo funciona si Boleta/Grupo_id NO son NOT NULL)
    const { error: insertError } = await supabase.from("Usuarios").insert({
      Nombre: nombre,
      Apellido_Paterno: apellidoPaterno,
      Apellido_Materno: apellidoMaterno,
      Rol_id: 1,
      auth_uid: user.id,
    });

    if (insertError) {
      return new Response(`DB error: ${insertError.message}`, { status: 500 });
    }

    // 3) Redirect a login
    return redirect("/signin");
  } catch (e: any) {
    console.error(e);
    return new Response(`Unexpected error: ${e.message}`, { status: 500 });
  }
};
