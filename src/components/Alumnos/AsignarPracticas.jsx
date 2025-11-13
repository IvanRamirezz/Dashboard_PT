import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Mapea opción del select -> fila real en BD
const PRACTICA_MAP = {
  'practica-1': { id: 1, titulo: 'Multimodo y monomodo' },
  'practica-2': { id: 2, titulo: 'Principios de uso en OTDR' },
  'practica-3': { id: 3, titulo: 'Principios de fibra optica' },
};

function generarCodigo(len = 6) {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums   = '23456789';
  const pool   = letras + nums;
  let out = '';
  for (let i = 0; i < len; i++) out += pool[Math.floor(Math.random() * pool.length)];
  return out;
}

export default function AsignarPracticas() {
  const [opt, setOpt] = useState('practica-1');
  const meta = useMemo(() => PRACTICA_MAP[opt], [opt]);

  const [codigo, setCodigo] = useState('');   // valor mostrado en el input
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Lee el Codigo actual desde Supabase cuando cambia la práctica
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from('Practicas')   // ⚠️ nombre exacto de la tabla
          .select('Codigo')    // ⚠️ columna exacta (respeta mayúsculas si las usaste)
          .eq('id', meta.id)
          .maybeSingle();

        if (error) throw error;
        if (!alive) return;
        setCodigo(data?.Codigo ?? '');
      } catch (e) {
        console.error('[Leer Codigo]', e);
        if (!alive) return;
        setCodigo('');
        setErr(e.message || 'Error al leer el código');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [meta.id]);

  const onGenerar = () => {
    setCodigo(generarCodigo(6));
  };

  const onAsignar = async () => {
    if (!meta?.id) return;
    const nuevoCodigo = (codigo || generarCodigo(6)).trim();
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from('Practicas')              // ⚠️ tabla exacta
        .update({ Codigo: nuevoCodigo })// ⚠️ columna exacta
        .eq('id', meta.id)
        .select();

      if (error) throw error;
      setCodigo(nuevoCodigo);
      alert(`✅ Código actualizado:\n• ${meta.titulo}\n• Código: ${nuevoCodigo}\n\nid: ${data?.[0]?.id ?? meta.id}`);
    } catch (e) {
      console.error('[UPDATE Codigo]', e);
      setErr(e.message || 'No se pudo actualizar');
      alert(`❌ ${e.message || 'No se pudo actualizar'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="asignar-wrap">
      <header className="asignar-head">
        <h1>Asignación de práctica <small>(Generación de código)</small></h1>
        <p className="asignar-desc">
          En esta sección puedes generar un código único y asignar una práctica específica a tu grupo de alumnos.
        </p>
      </header>

      <div className="asignar-card">
        {/* Selección de práctica */}
        <div className="asignar-row">
          <label htmlFor="practica-select" className="asignar-label">
            Selecciona la práctica a realizar
          </label>
          <select
            id="practica-select"
            className="asignar-input"
            value={opt}
            onChange={(e) => setOpt(e.target.value)}
            disabled={loading}
          >
            <option value="practica-1">Práctica 1</option>
            <option value="practica-2">Práctica 2</option>
            <option value="practica-3">Práctica 3</option>
          </select>
        </div>

        {/* Código de práctica */}
        <div className="asignar-row">
          <label htmlFor="codigo-input" className="asignar-label">Código de la práctica</label>
          <div className="asignar-code-row">
            <input
              id="codigo-input"
              className="asignar-input asignar-code"
              type="text"
              value={codigo || ''}
              readOnly
            />
            <button
              className="asignar-btn secundario"
              type="button"
              onClick={onGenerar}
              disabled={loading}
            >
              {loading ? '...' : 'Generar código'}
            </button>
          </div>
        </div>

        {/* Botón principal */}
        <div className="asignar-actions">
          <button
            className="asignar-btn primario"
            type="button"
            onClick={onAsignar}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Asignar'}
          </button>
        </div>

        {err && (
          <p style={{ color: 'crimson', marginTop: '0.5rem' }}>
            {err}
          </p>
        )}
      </div>
    </section>
  );
}
