
// With `output: 'static'` configured:
export const prerender = false;

import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();

    const nombre = formData.get("nombre")?.toString().trim();
    const apellidoPaterno = formData.get("apellidoPaterno")?.toString().trim();
    const apellidoMaterno = formData.get("apellidoMaterno")?.toString().trim() || null;
    const boleta = formData.get("boleta")?.toString().trim();
    const grupoNombre = formData.get("grupo")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const passwordConfirm = formData.get("passwordConfirm")?.toString();

    if (!nombre || !apellidoPaterno || !boleta || !grupoNombre || !email || !password) {
      return new Response("Faltan campos obligatorios", { status: 400 });
    }

    if (password !== passwordConfirm) {
      return redirect(`/Registro?password_mismatch=1&email=${encodeURIComponent(email)}&boleta=${encodeURIComponent(boleta)}`);
    }

    // ✅ 0) Validar si la BOLETA ya existe (antes de crear Auth)
    const { data: boletaExistente, error: boletaCheckError } = await supabase
      .from("Usuarios")
      .select("id")
      .eq("Boleta", boleta)
      .maybeSingle();

    if (boletaCheckError) {
      return new Response(`Error validando boleta: ${boletaCheckError.message}`, { status: 500 });
    }

    if (boletaExistente) {
      return redirect(`/Registro?boleta_exists=1&email=${encodeURIComponent(email)}&boleta=${encodeURIComponent(boleta)}`);
    }

    // ============================
    // 1) Crear usuario en Auth
    // ============================
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // ✅ Si el correo ya existe, regresa pintando el input
      const msg = (authError.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return redirect(`/Registro?email_exists=1&email=${encodeURIComponent(email)}&boleta=${encodeURIComponent(boleta)}`);
      }
      return new Response(`Auth error: ${authError.message}`, { status: 500 });
    }

    const user = authData.user;
    if (!user) {
      return new Response("User creation failed", { status: 500 });
    }

    // ============================
    // 2) Buscar el grupo por nombre
    // ============================
    const { data: grupo, error: grupoError } = await supabase
      .from("Grupos")
      .select("id")
      .eq("Nombre", grupoNombre)
      .maybeSingle();

    if (grupoError) {
      return new Response(`Error buscando grupo: ${grupoError.message}`, { status: 500 });
    }

    if (!grupo) {
      return new Response(`El grupo '${grupoNombre}' no existe`, { status: 400 });
    }

    // ============================
    // 3) Insertar en tabla Usuarios
    // ============================
    const { error: insertError } = await supabase.from("Usuarios").insert({
      Nombre: nombre,
      Apellido_Paterno: apellidoPaterno,
      Apellido_Materno: apellidoMaterno,
      Boleta: boleta,
      Grupo_id: grupo.id,
      Rol_id: 1,
      auth_uid: user.id,
    });

    if (insertError) {
      // ✅ Si tienes UNIQUE en Boleta, esto también lo cubre
      const m = (insertError.message || "").toLowerCase();
      if (m.includes("boleta") || m.includes("duplicate") || m.includes("unique")) {
        return redirect(`/Registro?boleta_exists=1&email=${encodeURIComponent(email)}&boleta=${encodeURIComponent(boleta)}`);
      }
      return new Response(`DB error: ${insertError.message}`, { status: 500 });
    }

    return redirect("/Exitoso");
  } catch (e: any) {
    console.error(e);
    return new Response(`Unexpected error: ${e.message}`, { status: 500 });
  }
};
