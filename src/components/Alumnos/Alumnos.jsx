import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TablaAlumnosPorGrupo() {
  const [alumnos, setAlumnos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Traer lista de grupos
  const obtenerGrupos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Grupos')
        .select('id, Nombre')
        .order('Nombre', { ascending: true });

      if (error) throw error;

      setGrupos(data ?? []);
      // Si no hay grupo seleccionado todavía, elegir el primero
      if (!grupoSeleccionado && data && data.length > 0) {
        setGrupoSeleccionado(data[0].id);
      }

      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message ?? 'Error al cargar grupos');
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  // Traer alumnos de un grupo
  const obtenerAlumnosPorGrupo = async (grupoId) => {
    if (!grupoId) return;

    try {
      setLoading(true);

const { data, error } = await supabase
  .from('Usuarios')
  .select(`
    id,
    Nombre,
    Apellido_Paterno,
    Apellido_Materno,
    Boleta,
    Grupo_id
  `)
  .eq('Grupo_id', grupoId)
  .order('Nombre', { ascending: true });


      if (error) throw error;

      setAlumnos(data ?? []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message ?? 'Error al cargar alumnos');
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar grupos al inicio
  useEffect(() => {
    obtenerGrupos();
  }, []);

  // Cada vez que cambie el grupo seleccionado, cargar sus alumnos
  useEffect(() => {
    if (grupoSeleccionado) {
      obtenerAlumnosPorGrupo(grupoSeleccionado);
    }
  }, [grupoSeleccionado]);

  return (
    <div style={styles.contenedor}>
      <h2 style={styles.titulo}>📋 Datos de alumnos</h2>

      {/* Filtros */}
      <div style={styles.filtrosRow}>
        <div style={styles.filtroItem}>
          <label style={styles.label}>Grupo:</label>
          <select
            value={grupoSeleccionado ?? ''}
            onChange={(e) => setGrupoSeleccionado(Number(e.target.value))}
            style={styles.select}
          >
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.Nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => obtenerAlumnosPorGrupo(grupoSeleccionado)}
        style={styles.boton}
        disabled={!grupoSeleccionado}
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
                <th style={styles.encabezado}>Grupo</th>
              </tr>
            </thead>
<tbody>
  {alumnos.map((alumno, index) => {
    const grupo = grupos.find((g) => g.id === alumno.Grupo_id);

    return (
      <tr
        key={alumno.id}
        style={index % 2 === 0 ? styles.filaPar : styles.filaImpar}
      >
        <td style={styles.celda}>
          {alumno.Nombre} {alumno.Apellido_Paterno} {alumno.Apellido_Materno}
        </td>
        <td style={styles.celda}>{alumno.Boleta}</td>
        <td style={styles.celda}>{grupo?.Nombre ?? 'Sin grupo'}</td>
      </tr>
    );
  })}

  {alumnos.length === 0 && (
    <tr>
      <td style={styles.celda} colSpan={3}>
        No hay alumnos registrados en este grupo.
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
    backgroundColor: '#f1f59',
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
};
