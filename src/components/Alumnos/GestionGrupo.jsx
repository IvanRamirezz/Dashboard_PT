import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AltaGrupo() {
  const [grupos, setGrupos] = useState([]);
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const obtenerGrupos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("Grupos")
        .select("id, Nombre")
        .order("Nombre", { ascending: true });

      if (error) throw error;

      setGrupos(data ?? []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message ?? "Error al cargar grupos");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerGrupos();
  }, []);

  const existe = useMemo(() => {
    const v = nuevoGrupo.trim().toLowerCase();
    if (!v) return false;
    return grupos.some((g) => (g.Nombre ?? "").trim().toLowerCase() === v);
  }, [nuevoGrupo, grupos]);

  const limpiarMensajes = () => {
    setError(null);
    setOk(null);
  };

  const darDeAlta = async () => {
    const nombre = nuevoGrupo.trim();
    limpiarMensajes();

    if (!nombre) {
      setError("Escribe un grupo para continuar.");
      return;
    }

    if (existe) {
      setError("Ese grupo ya existe.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("Grupos")
        .insert([{ Nombre: nombre }]);

      if (error) throw error;

      setOk("Grupo dado de alta ✅");
      setNuevoGrupo("");
      await obtenerGrupos();
    } catch (e) {
      console.error(e);
      setError(e.message ?? "Error al dar de alta el grupo");
    } finally {
      setSaving(false);
    }
  };

  const darDeBaja = async () => {
    const nombre = nuevoGrupo.trim();
    limpiarMensajes();

    if (!nombre) {
      setError("Escribe el grupo que deseas dar de baja.");
      return;
    }

    if (!existe) {
      setError("Ese grupo no existe.");
      return;
    }

    const confirmacion = window.confirm(`¿Seguro que deseas dar de baja el grupo "${nombre}"?`);
    if (!confirmacion) return;

    try {
      setDeleting(true);

      // ✅ Baja por Nombre (ajústalo si manejas ID)
      const { error } = await supabase
        .from("Grupos")
        .delete()
        .eq("Nombre", nombre);

      if (error) throw error;

      setOk("Grupo dado de baja ✅");
      setNuevoGrupo("");
      await obtenerGrupos();
    } catch (e) {
      console.error(e);
      setError(e.message ?? "Error al dar de baja el grupo");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ width: "min(720px, 90vw)", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: "2.2rem", margin: "0 0 12px" }}>
        Gestión del grupo
      </h2>

      <p style={{ textAlign: "center", color: "#444", margin: "0 0 18px" }}>
        Ingresa el grupo que deseas dar de alta o de baja.
      </p>

      <label style={{ fontSize: "18px", color: "#444" }}>Grupo:</label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: "12px",
          marginTop: "8px",
          alignItems: "center",
        }}
      >
        <input
          value={nuevoGrupo}
          onChange={(e) => setNuevoGrupo(e.target.value)}
          placeholder="Ej. 3IM13"
          style={{
            height: "42px",
            border: "1px solid #cfcfcf",
            borderRadius: "10px",
            padding: "0 14px",
            fontSize: "18px",
            outline: "none",
            background: "white",
          }}
        />

        <button
          onClick={darDeAlta}
          disabled={saving || deleting}
          style={{
            height: "42px",
            padding: "0 18px",
            border: 0,
            borderRadius: "12px",
            background: "#1849b5",
            color: "white",
            fontWeight: 700,
            cursor: saving || deleting ? "default" : "pointer",
            whiteSpace: "nowrap",
            opacity: saving || deleting ? 0.8 : 1,
          }}
        >
          {saving ? "Guardando…" : "Dar de alta"}
        </button>

        <button
          onClick={darDeBaja}
          disabled={saving || deleting}
          style={{
            height: "42px",
            padding: "0 18px",
            border: 0,
            borderRadius: "12px",
            background: "#d92d20",
            color: "white",
            fontWeight: 700,
            cursor: saving || deleting ? "default" : "pointer",
            whiteSpace: "nowrap",
            opacity: saving || deleting ? 0.8 : 1,
          }}
        >
          {deleting ? "Eliminando…" : "Dar de baja"}
        </button>
      </div>

      <div style={{ minHeight: "20px", marginTop: "10px" }}>
        {loading && <small>Cargando grupos…</small>}
        {error && <small style={{ color: "#b42318" }}>Error: {error}</small>}
        {ok && <small style={{ color: "#067647" }}>{ok}</small>}
      </div>

      {!loading && grupos.length > 0 && (
        <div style={{ marginTop: "14px", fontSize: "13px", color: "#666" }}>
          <strong>Grupos existentes:</strong> {grupos.map((g) => g.Nombre).join(", ")}
        </div>
      )}
    </div>
  );
}
