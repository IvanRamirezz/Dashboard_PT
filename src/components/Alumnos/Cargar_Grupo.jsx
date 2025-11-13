import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CargaGrupo() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const onBrowse = () => inputRef.current?.click();

  const onChoose = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
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
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return alert('Selecciona un archivo primero.');
    setLoading(true);
    try {
      const path = `grupos/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('grupos').upload(path, file);
      if (error) throw error;
      alert(`✅ Archivo cargado correctamente: ${file.name}`);
      setFile(null);
      inputRef.current.value = '';
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
            <img src="/Dashboard_PT/assets/enviar.png" alt="Subir" width="64" height="64" />
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

        <button
          type="button"
          className="upload-btn secondary"
          onClick={onBrowse}
          disabled={loading}
        >
          Seleccionar archivo
        </button>
      </div>

      <button
        type="button"
        className="upload-btn primary"
        onClick={handleUpload}
        disabled={loading || !file}
      >
        {loading ? 'Cargando...' : 'Cargar'}
      </button>
    </section>
  );
}
