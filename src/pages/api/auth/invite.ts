// src/pages/api/grupos/cargar.ts
import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

// Cliente ADMIN (usa service_role, SOLO backend)
const supabaseAdmin = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL as string,
  import.meta.env.SUPABASE_SERVICE_ROLE as string
);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const rows = body.rows as Array<{
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      boleta: string;
      grupo: string;
      email: string;
    }>;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se recibieron filas válidas." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1) Sacamos nombres de grupo únicos
    const nombresGrupos = Array.from(
      new Set(
        rows
          .map((r) => r.grupo?.trim())
          .filter((g) => g && g.length > 0)
      )
    );

    if (nombresGrupos.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron grupos en el CSV." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) Traer grupos existentes
    const { data: gruposExistentes, error: gruposError } = await supabaseAdmin
      .from("Grupos")
      .select("id, Nombre")
      .in("Nombre", nombresGrupos);

    if (gruposError) throw gruposError;

    const mapaGrupos = new Map<string, number>();
    (gruposExistentes ?? []).forEach((g) => {
      mapaGrupos.set(g.Nombre.trim().toLowerCase(), g.id);
    });

    // 3) Insertar grupos que falten
    const gruposFaltantes = nombresGrupos.filter(
      (nombre) => !mapaGrupos.has(nombre.trim().toLowerCase())
    );

    if (gruposFaltantes.length > 0) {
      const payloadGrupos = gruposFaltantes.map((nombre) => ({
        Nombre: nombre,
        Profesor_id: null,
      }));

      const { data: nuevosGrupos, error: insertGruposError } = await supabaseAdmin
        .from("Grupos")
        .insert(payloadGrupos)
        .select("id, Nombre");

      if (insertGruposError) throw insertGruposError;

      (nuevosGrupos ?? []).forEach((g) => {
        mapaGrupos.set(g.Nombre.trim().toLowerCase(), g.id);
      });
    }

    // 4) Boletas únicas del CSV
    const boletasCSV = Array.from(
      new Set(
        rows
          .map((r) => r.boleta?.trim())
          .filter((b) => b && b.length > 0)
      )
    );

    // 5) Boletas ya existentes en Usuarios
    const { data: alumnosExistentes, error: alumnosError } = await supabaseAdmin
      .from("Usuarios")
      .select("Boleta")
      .in("Boleta", boletasCSV);

    if (alumnosError) throw alumnosError;

    const boletasYaRegistradas = new Set(
      (alumnosExistentes ?? [])
        .map((a) => a.Boleta?.trim())
        .filter(Boolean)
    );

    // 6) Construir lista de alumnos nuevos + lista de invites
    const alumnosAInsertar: any[] = [];
    const invites: { email: string; boleta: string; grupoId: number }[] = [];

    const boletasUsadasEnCSV = new Set<string>();
    const boletasDuplicadasCSV = new Set<string>();

    for (const r of rows) {
      if (!r.nombre || !r.boleta || !r.grupo) continue;

      const boleta = r.boleta.trim();
      const keyGrupo = r.grupo.trim().toLowerCase();
      const grupoId = mapaGrupos.get(keyGrupo);
      const email = r.email?.trim();

      if (!grupoId) continue;

      if (boletasUsadasEnCSV.has(boleta)) {
        boletasDuplicadasCSV.add(boleta);
        continue;
      }

      if (boletasYaRegistradas.has(boleta)) {
        continue;
      }

      boletasUsadasEnCSV.add(boleta);

      alumnosAInsertar.push({
        Nombre: r.nombre,
        Apellido_Paterno: r.apellidoPaterno || null,
        Apellido_Materno: r.apellidoMaterno || null,
        Boleta: boleta,
        Grupo_id: grupoId,
        Rol_id: 1, // alumno
        //Email: email || null, // si en tu tabla tienes esta columna
      });

      if (email) {
        invites.push({ email, boleta, grupoId });
      }
    }

    if (alumnosAInsertar.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No se pudo generar ningún alumno nuevo para insertar.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7) Insertar alumnos en Usuarios
    const { error: insertAlumnosError } = await supabaseAdmin
      .from("Usuarios")
      .insert(alumnosAInsertar);

    if (insertAlumnosError) throw insertAlumnosError;

    // 8) Enviar invitaciones por correo
    for (const invite of invites) {
      try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(invite.email, {
          data: {
            boleta: invite.boleta,
            grupo_id: invite.grupoId,
            rol_id: 1,
          },
        });
      } catch (e) {
        console.error("Error enviando invite a", invite.email, e);
      }
    }

    const mensaje = `✅ Se insertaron ${alumnosAInsertar.length} alumnos nuevos y se enviaron invitaciones a ${invites.length} correos.`;

    return new Response(
      JSON.stringify({ message: mensaje }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("❌ Error en /api/grupos/cargar:", e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Error inesperado" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
