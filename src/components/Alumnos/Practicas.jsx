import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TablaCalificacionesPorPractica() {
  const [resultados, setResultados] = useState([]); // ← ahora esta es la lista base
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busquedaBoleta, setBusquedaBoleta] = useState('');
  const [practicaSeleccionada, setPracticaSeleccionada] = useState(1);

  // Trae SOLO alumnos que tienen registro en Resultados para esa práctica
  const obtenerResultadosPorPractica = async (practicaId) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('Resultados')
        .select(`
          id,
          Calificacion,
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

  // cargar al inicio
  useEffect(() => {
    obtenerResultadosPorPractica(practicaSeleccionada);
  }, []);

  // cada vez que cambie la práctica
  useEffect(() => {
    obtenerResultadosPorPractica(practicaSeleccionada);
  }, [practicaSeleccionada]);

  const manejarClickCalificar = (resultado) => {
    // Aquí abres modal / navegas / etc.
    console.log(
      `Calificar práctica ${practicaSeleccionada} para el usuario`,
      resultado.usuario
    );
  };

  // Filtrar por boleta
  const resultadosFiltrados = resultados.filter((r) =>
    r.usuario?.Boleta?.toLowerCase().includes(busquedaBoleta.toLowerCase())
  );

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
                        res.Calificacion
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
    </div>
  );
}

// mismos estilos que ya tenías (copiados de tu componente anterior)
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
};
