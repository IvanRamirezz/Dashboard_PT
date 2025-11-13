// Importamos los hooks de React y la conexión con Supabase
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Componente principal
export default function TablaUsuarios() {
  // Estado para guardar los usuarios
  const [usuarios, setUsuarios] = useState([]);
  // Estado para saber si estamos cargando
  const [loading, setLoading] = useState(true);
  // Estado para manejar errores
  const [error, setError] = useState(null);

  // Función para obtener los datos desde Supabase
// Petición HTTP de tipo GET al backend de Supabase, usando la biblioteca oficial @supabase/supabase-js
const obtenerUsuarios = async () => {
  setLoading(true);
  try {
    const { data, error, status } = await supabase
      .from('Usuarios')
      .select('*')
      .order('puntaje', { ascending: false });

    console.log('[status]', status);
    if (error) throw error;

    setUsuarios(data ?? []);
    setError(null);
  } catch (e) {
    console.error('[Supabase error]', e);
    setError(`${e.code ?? ''} ${e.message ?? 'Error'}`);
    setUsuarios([]);
  } finally {
    setLoading(false);
  }
};


  // Al montar el componente, cargamos los datos automáticamente
  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // Renderizado del componente
  return (
    <div style={styles.contenedor}>
      {/* Título */}
      <h2 style={styles.titulo}>📋 Calificaciones de alumnos</h2>

      {/* Botón para actualizar la tabla */}
      <button onClick={obtenerUsuarios} style={styles.boton}>
        🔄 Actualizar tabla
      </button>

      {/* Si está cargando, mostramos mensaje */}
      {loading && <p>Cargando datos...</p>}

      {/* Si hay error, mostramos mensaje de error */}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Si ya cargó y no hay error, mostramos la tabla */}
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
              {/* Recorremos los usuarios y los mostramos en filas */}
              {usuarios.map((user, index) => (
                <tr
                  key={user.id}
                  style={index % 2 === 0 ? styles.filaPar : styles.filaImpar}
                >
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

// Objeto de estilos en línea
const styles = {
  // Estilo del contenedor general
  contenedor: {
    padding: '1rem',
    fontFamily: 'Segoe UI, sans-serif',
  },

  // Título principal
  titulo: {
    marginBottom: '0.5rem',
    fontSize: '2rem',
    color: '#1f2937',
  },

  // Botón de actualización
  boton: {
    backgroundColor: '#1d4ed8',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },

  // Contenedor de la tabla con sombra
  wrapper: {
    overflowX: 'auto',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },

  // Estilo general de la tabla
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff',
    borderRadius: '10px',
    overflow: 'hidden',
  },

  // Estilo de celdas de encabezado
  encabezado: {
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontWeight: '600',
    fontSize: '1rem',
  },

  // Fila par (blanca)
  filaPar: {
    backgroundColor: '#ffffff',
    transition: 'background-color 0.3s',
  },

  // Fila impar (gris suave)
  filaImpar: {
    backgroundColor: '#f9fafb',
    transition: 'background-color 0.3s',
  },

  // Estilo de celdas normales
  celda: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    color: '#374151',
    fontSize: '0.95rem',
    textAlign: 'left',
  }
};
