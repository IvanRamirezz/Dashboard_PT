import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TablaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtenerUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('puntaje', { ascending: false });

    if (error) {
      setError(error.message);
      setUsuarios([]);
    } else {
      setError(null);
      setUsuarios(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  return (
    <div style={styles.contenedor}>
      <h2 style={styles.titulo}>📋 Calificaciones de alumnos</h2>
      <button onClick={obtenerUsuarios} style={styles.boton}>🔄 Actualizar tabla</button>

      {loading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && (
        <div style={styles.wrapper}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.encabezado}>Nombre</th>
                <th style={styles.encabezado}>Puntaje</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user, index) => (
                <tr key={user.id} style={index % 2 === 0 ? styles.filaPar : styles.filaImpar}>
                  <td style={styles.celda}>{user.nombre}</td>
                  <td style={styles.celda}>{user.puntaje}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: {
    padding: '1rem',
    fontFamily: 'Segoe UI, sans-serif',
  },
  titulo: {
    marginBottom: '0.5rem',
    fontSize: '1.5rem',
    color: '#1f2937',
  },
  boton: {
    backgroundColor: '#1d4ed8',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
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
  }
};
