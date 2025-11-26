import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TablaCalificacionesPorPractica() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busquedaBoleta, setBusquedaBoleta] = useState('');
  const [practicaSeleccionada, setPracticaSeleccionada] = useState(1);

  // 🔹 Estado para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);
  const [calificacionInput, setCalificacionInput] = useState('');
  const [guardando, setGuardando] = useState(false);

  const obtenerResultadosPorPractica = async (practicaId) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('Resultados')
        .select(`
          id,
          Calificacion,
          Respuestas_json,
          Usuario_id,
          usuario:Usuario_id (
            id,
            Nombre,
            Apellido_Paterno,
            Apellido_Materno,
            Boleta
          )
        `)
        .eq('Practica_id', practicaId);

      if (error) throw error;

      setResultados(data ?? []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message ?? 'Error al cargar resultados');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerResultadosPorPractica(practicaSeleccionada);
  }, []);

  useEffect(() => {
    obtenerResultadosPorPractica(practicaSeleccionada);
  }, [practicaSeleccionada]);

  // 🔹 Abrir modal con un resultado
  const manejarClickCalificar = (resultado) => {
    setResultadoSeleccionado(resultado);
    setCalificacionInput(
      resultado.Calificacion != null ? String(resultado.Calificacion) : ''
    );
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setResultadoSeleccionado(null);
    setCalificacionInput('');
  };

  // 🔹 Guardar calificación en Supabase (solo BD, luego recargar)
// ...todo tu import y hooks igual que antes...

  // 🔹 Guardar calificación en Supabase (solo BD, luego recargar)
  const guardarCalificacion = async () => {
    if (!resultadoSeleccionado) return;

    const valor = Number(calificacionInput);
    if (Number.isNaN(valor) || valor < 0 || valor > 100) {
      alert('La calificación debe ser un número entre 0 y 100');
      return;
    }

    try {
      setGuardando(true);

      const { data, error, status } = await supabase
        .from('Resultados')
        .update({ Calificacion: valor })
        .eq('id', resultadoSeleccionado.id)
        .select('id, Calificacion');

      console.log('UPDATE status:', status);
      console.log('UPDATE data:', data);
      console.log('UPDATE error:', error);

      if (error) throw error;

      // Si no devolvió filas, es que no encontró ese id
      if (!data || data.length === 0) {
        alert(
          'No se encontró el registro a actualizar. Revisa el ID y las RLS policies.'
        );
        return;
      }

      // 🔁 Recargar desde Supabase para que la tabla siempre refleje la BD
      await obtenerResultadosPorPractica(practicaSeleccionada);

      // 🔚 Cerrar y limpiar
      cerrarModal();
    } catch (e) {
      console.error(e);
      alert(`Error al guardar calificación: ${e.message ?? e}`);
    } finally {
      setGuardando(false);
    }
  };


  const resultadosFiltrados = resultados.filter((r) =>
    r.usuario?.Boleta?.toLowerCase().includes(busquedaBoleta.toLowerCase())
  );

  // Preguntas del resultado seleccionado
  const preguntas =
    resultadoSeleccionado?.Respuestas_json?.preguntas ?? [];

  return (
    <div style={styles.contenedor}>
      <h2 style={styles.titulo}>📋 Calificaciones por práctica</h2>

      {/* Filtros */}
      <div style={styles.filtrosRow}>
        <div style={styles.filtroItem}>
          <label style={styles.label}>Número de boleta:</label>
          <input
            type="text"
            placeholder="Buscar por boleta..."
            value={busquedaBoleta}
            onChange={(e) => setBusquedaBoleta(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.filtroItem}>
          <label style={styles.label}>Práctica:</label>
          <select
            value={practicaSeleccionada}
            onChange={(e) =>
              setPracticaSeleccionada(Number(e.target.value))
            }
            style={styles.select}
          >
            <option value={1}>Práctica 1</option>
            <option value={2}>Práctica 2</option>
            <option value={3}>Práctica 3</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => obtenerResultadosPorPractica(practicaSeleccionada)}
        style={styles.boton}
      >
        🔄 Actualizar alumnos
      </button>

      {loading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && (
        <div style={styles.wrapper}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.encabezado}>Alumno</th>
                <th style={styles.encabezado}>Boleta</th>
                <th style={styles.encabezado}>Práctica</th>
                <th style={styles.encabezado}>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFiltrados.map((res, index) => {
                const u = res.usuario;
                return (
                  <tr
                    key={res.id}
                    style={
                      index % 2 === 0 ? styles.filaPar : styles.filaImpar
                    }
                  >
                    <td style={styles.celda}>
                      {u?.Nombre} {u?.Apellido_Paterno}{' '}
                      {u?.Apellido_Materno}
                    </td>
                    <td style={styles.celda}>{u?.Boleta}</td>
                    <td style={styles.celda}>
                      {`Práctica ${practicaSeleccionada}`}
                    </td>
                    <td style={styles.celda}>
                      {res.Calificacion != null ? (
                        <strong>{res.Calificacion}</strong>
                      ) : (
                        <button
                          style={styles.botonCalificar}
                          onClick={() => manejarClickCalificar(res)}
                        >
                          Calificar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {resultadosFiltrados.length === 0 && (
                <tr>
                  <td style={styles.celda} colSpan={4}>
                    Nadie ha realizado aún esta práctica.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔹 MODAL DE CALIFICACIÓN */}
      {modalAbierto && resultadoSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitulo}>
                Calificar –{' '}
                {resultadoSeleccionado.usuario?.Nombre}{' '}
                {resultadoSeleccionado.usuario?.Apellido_Paterno}{' '}
                {resultadoSeleccionado.usuario?.Apellido_Materno}
              </h3>
              <button onClick={cerrarModal} style={styles.modalClose}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {preguntas.length === 0 && (
                <p style={{ color: '#6b7280' }}>
                  No hay respuestas registradas para esta práctica.
                </p>
              )}

              {preguntas.map((p, i) => (
                <div key={p.id ?? i} style={styles.preguntaCard}>
                  <div style={styles.preguntaHeader}>
                    <span style={styles.preguntaBadge}>
                      {p.tipo === 'multiple'
                        ? 'Opción múltiple'
                        : 'Pregunta abierta'}
                    </span>
                    <p style={styles.textoPregunta}>
                      <strong>Pregunta {i + 1}:</strong> {p.pregunta}
                    </p>
                  </div>

                  <div style={styles.preguntaContenido}>
                    <p>
                      <strong>Respuesta del alumno:</strong>{' '}
                      {p.respuesta_usuario || '—'}
                    </p>
                    {p.respuesta_correcta && (
                      <p>
                        <strong>Respuesta correcta:</strong>{' '}
                        {p.respuesta_correcta}
                      </p>
                    )}
                    {typeof p.correcta === 'boolean' && (
                      <p>
                        <strong>¿Correcta?:</strong>{' '}
                        {p.correcta ? '✅ Sí' : '❌ No'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalFooter}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: '180px' }}>
                  <label style={styles.label}>
                    Calificación (0–100):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calificacionInput}
                    onChange={(e) => setCalificacionInput(e.target.value)}
                    style={styles.inputCalificacion}
                  />
                </div>
                <button
                  style={styles.botonGuardar}
                  onClick={guardarCalificacion}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : '💾 Guardar calificación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: {
    padding: '0.5rem',
    fontFamily: 'Segoe UI, sans-serif',
  },
  titulo: {
    marginTop: '-0.75rem',
    marginBottom: '1.75rem',
    fontSize: '1.8rem',
    color: '#1f2937',
  },
  filtrosRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-end',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  filtroItem: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '220px',
  },
  label: {
    fontSize: '0.9rem',
    marginBottom: '0.3rem',
    color: '#4b5563',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: 'white',
  },
  boton: {
    backgroundColor: '#1d4ed8',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  wrapper: {
    overflowX: 'auto',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  encabezado: {
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontWeight: '600',
    fontSize: '1rem',
  },
  filaPar: {
    backgroundColor: '#ffffff',
    transition: 'background-color 0.3s',
  },
  filaImpar: {
    backgroundColor: '#f9fafb',
    transition: 'background-color 0.3s',
  },
  celda: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    color: '#374151',
    fontSize: '0.95rem',
    textAlign: 'left',
  },
  botonCalificar: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.9rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },

  // 🔹 Estilos del modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    width: 'min(900px, 96vw)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(15,23,42,0.35)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitulo: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#111827',
  },
  modalClose: {
    border: 'none',
    background: 'transparent',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalBody: {
    padding: '1rem 1.5rem',
    overflowY: 'auto',
  },
  modalFooter: {
    padding: '0.9rem 1.5rem 1.3rem',
    borderTop: '1px solid #e5e7eb',
  },
  preguntaCard: {
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '0.85rem 1rem',
    marginBottom: '0.75rem',
    backgroundColor: '#f9fafb',
  },
  preguntaHeader: {
    marginBottom: '0.3rem',
  },
  preguntaBadge: {
    display: 'inline-block',
    fontSize: '0.7rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  textoPregunta: {
    margin: '0.35rem 0 0',
    fontSize: '0.95rem',
    color: '#111827',
  },
  preguntaContenido: {
    fontSize: '0.9rem',
    color: '#111827',
    marginTop: '0.25rem',
  },
  inputCalificacion: {
    padding: '0.45rem 0.7rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  botonGuardar: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.5rem 1.2rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
};
