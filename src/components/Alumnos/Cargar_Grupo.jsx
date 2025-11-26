import { useRef, useState } from 'react';
import '../../styles/Style_Grupo.css';

export default function CargaGrupo() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);        // filas del CSV (con email incluido)
  const [showPreview, setShowPreview] = useState(false); // control del modal
  const inputRef = useRef(null);

  const onBrowse = () => inputRef.current?.click();

  const clearFile = () => {
    setFile(null);
    setRows([]);
    setShowPreview(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // --- PARSEAR CSV ---
  const parseCSV = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setRows([]);
        setShowPreview(false);
        return;
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().toLowerCase());

      const idxNombre   = headers.findIndex((h) => h === 'nombre');
      const idxApeMat   = headers.findIndex((h) => h === 'apellido_materno');
      const idxApePat   = headers.findIndex((h) => h === 'apellido_paterno');
      const idxBoleta   = headers.findIndex((h) => h === 'boleta');
      const idxGrupo    = headers.findIndex((h) => h === 'grupo');
      const idxEmail    = headers.findIndex((h) => h === 'email' || h === 'correo');

      const parsed = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(',');

          const nombre          = idxNombre >= 0 ? (cols[idxNombre]?.trim() || '') : '';
          const apellidoMaterno = idxApeMat >= 0 ? (cols[idxApeMat]?.trim() || '') : '';
          const apellidoPaterno = idxApePat >= 0 ? (cols[idxApePat]?.trim() || '') : '';
          const boleta          = idxBoleta >= 0 ? (cols[idxBoleta]?.trim() || '') : '';
          const grupo           = idxGrupo  >= 0 ? (cols[idxGrupo]?.trim()  || '') : '';
          const email           = idxEmail  >= 0 ? (cols[idxEmail]?.trim()  || '') : '';

          return {
            nombre,
            apellidoMaterno,
            apellidoPaterno,
            boleta,
            grupo,
            email,
          };
        })
        .filter((r) => r.nombre || r.boleta || r.grupo || r.email);

      setRows(parsed);
      setShowPreview(parsed.length > 0); // abrir modal si hay filas
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleFile = (f) => {
    setFile(f);
    setRows([]);   // limpiar vista previa anterior
    setShowPreview(false);
    parseCSV(f);   // generar nueva vista previa
  };

  const onChoose = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // --- ENVIAR FILAS AL BACKEND ---
  const handleUpload = async () => {
    if (!file) {
      alert('Selecciona un archivo primero.');
      return;
    }
    if (rows.length === 0) {
      alert('El archivo no tiene filas válidas.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      // leemos texto crudo por si el servidor no responde JSON perfecto
      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error('Respuesta no JSON del servidor:', rawText);
      }

      if (!res.ok) {
        console.error('Status:', res.status, 'Body:', data || rawText);
        throw new Error(
          (data && data.error) || `Error al procesar el archivo (status ${res.status})`
        );
      }

      alert(data.message || 'Alumnos cargados correctamente.');
      clearFile();
    } catch (e) {
      console.error(e);
      alert(`❌ Error al guardar en el servidor: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="upload-container">
      <header className="upload-header">
        <h1>Carga del grupo</h1>
        <p>
          Sube un archivo CSV con datos de los alumnos
          (nombre, apellidos, boleta, grupo y correo) para registrarlos.
        </p>
      </header>

      <div
        className={`upload-box ${dragOver ? 'drag-over' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Icono personalizado */}
        <div className="upload-icon">
          <img
            src="/assets/enviar.png"
            alt="Subir"
            width="64"
            height="64"
          />
        </div>

        <p className="upload-text">
          {file ? <strong>{file.name}</strong> : 'Arrastra y suelta el archivo aquí'}
        </p>

        <input
          type="file"
          ref={inputRef}
          onChange={onChoose}
          accept=".csv"
          hidden
        />

        {/* Botón dinámico: seleccionar / quitar archivo */}
        {!file ? (
          <button
            type="button"
            className="upload-btn secondary"
            onClick={onBrowse}
            disabled={loading}
          >
            Seleccionar archivo
          </button>
        ) : (
          <button
            type="button"
            className="upload-btn danger"
            onClick={clearFile}
            disabled={loading}
          >
            Quitar archivo
          </button>
        )}
      </div>

      {/* Modal de vista previa */}
      {showPreview && rows.length > 0 && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Vista previa del archivo</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <table className="csv-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Boleta</th>
                    <th>Grupo</th>
                    <th>Correo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const nombreCompleto = [
                      r.nombre,
                      r.apellidoPaterno,
                      r.apellidoMaterno,
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <tr key={i}>
                        <td>{nombreCompleto}</td>
                        <td>{r.boleta}</td>
                        <td>{r.grupo}</td>
                        <td>{r.email}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="upload-btn primary"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar archivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
