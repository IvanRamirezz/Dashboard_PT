import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import '../../styles/Style_Grupo.css';

export default function CargaGrupo() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);        // filas del CSV
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

      const idxNombre = headers.findIndex((h) => h === 'nombre');
      const idxBoleta = headers.findIndex((h) => h === 'boleta');
      const idxGrupo  = headers.findIndex((h) => h === 'grupo');

      const parsed = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(',');
          return {
            nombre: cols[idxNombre]?.trim() || '',
            boleta: cols[idxBoleta]?.trim() || '',
            grupo:  cols[idxGrupo]?.trim()  || '',
          };
        })
        .filter((r) => r.nombre || r.boleta || r.grupo);

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

  const handleUpload = async () => {
    if (!file) return alert('Selecciona un archivo primero.');
    setLoading(true);
    try {
      const path = `grupos/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('grupos').upload(path, file);
      if (error) throw error;
      alert(`✅ Archivo cargado correctamente: ${file.name}`);
      clearFile();
    } catch (e) {
      alert(`❌ Error al cargar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="upload-container">
      <header className="upload-header">
        <h1>Carga del grupo</h1>
        <p>Sube un archivo CSV con datos de los alumnos para registrar los alumnos.</p>
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
            src="/Dashboard_PT/assets/enviar.png"
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
          accept=".csv,.xlsx,.xls"
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

      {/* 👇 Se quitó el botón "Cargar" que estaba aquí */}

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
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.nombre}</td>
                      <td>{r.boleta}</td>
                      <td>{r.grupo}</td>
                    </tr>
                  ))}
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
