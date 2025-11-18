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
        const idxApeMat = headers.findIndex((h) => h === 'apellido_materno');
        const idxApePat = headers.findIndex((h) => h === 'apellido_paterno');
        const idxBoleta = headers.findIndex((h) => h === 'boleta');
        const idxGrupo  = headers.findIndex((h) => h === 'grupo');

      const parsed = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(',');

          return {
            nombre:           cols[idxNombre]?.trim()   || '',
            apellidoMaterno:  cols[idxApeMat]?.trim()   || '',
            apellidoPaterno:  cols[idxApePat]?.trim()   || '',
            boleta:           cols[idxBoleta]?.trim()   || '',
            grupo:            cols[idxGrupo]?.trim()    || '',
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

  // --- ENVIAR CSV A SUPABASE: CREA GRUPOS NUEVOS + ALUMNOS (SIN BOLETAS REPETIDAS) ---
  const handleUpload = async () => {
    if (!file) return alert('Selecciona un archivo primero.');
    if (rows.length === 0) {
      return alert('El archivo no tiene filas válidas (Nombre, Boleta, Grupo).');
    }

    setLoading(true);
    try {
      // 1) Obtener nombres de grupo únicos del CSV
      const nombresGruposCSV = Array.from(
        new Set(
          rows
            .map((r) => r.grupo?.trim())
            .filter((g) => g && g.length > 0)
        )
      );

      if (nombresGruposCSV.length === 0) {
        alert('No se encontraron grupos en el CSV.');
        setLoading(false);
        return;
      }

      // 2) Traer grupos existentes con esos nombres
      const { data: gruposExistentes, error: gruposError } = await supabase
        .from('Grupos')
        .select('id, Nombre')
        .in('Nombre', nombresGruposCSV);

      if (gruposError) throw gruposError;

      const mapaGrupos = new Map();
      (gruposExistentes ?? []).forEach((g) => {
        mapaGrupos.set(g.Nombre.trim().toLowerCase(), g.id);
      });

      // 3) Detectar qué grupos del CSV NO existen aún
      const gruposFaltantes = nombresGruposCSV.filter(
        (nombre) => !mapaGrupos.has(nombre.trim().toLowerCase())
      );

      // 4) Insertar grupos faltantes
      if (gruposFaltantes.length > 0) {
        const nuevosGruposPayload = gruposFaltantes.map((nombre) => ({
          Nombre: nombre,
          Profesor_id: null,
        }));

        const { data: gruposInsertados, error: insertGruposError } = await supabase
          .from('Grupos')
          .insert(nuevosGruposPayload)
          .select('id, Nombre');

        if (insertGruposError) throw insertGruposError;

        (gruposInsertados ?? []).forEach((g) => {
          mapaGrupos.set(g.Nombre.trim().toLowerCase(), g.id);
        });
      }

      // 5) Obtener boletas del CSV (únicas)
      const boletasCSV = Array.from(
        new Set(
          rows
            .map((r) => r.boleta?.trim())
            .filter((b) => b && b.length > 0)
        )
      );

      // 6) Traer boletas ya existentes en Usuarios
      const { data: alumnosExistentes, error: alumnosExistentesError } = await supabase
        .from('Usuarios')
        .select('Boleta')
        .in('Boleta', boletasCSV);

      if (alumnosExistentesError) throw alumnosExistentesError;

      const boletasYaRegistradas = new Set(
        (alumnosExistentes ?? [])
          .map((a) => a.Boleta?.trim())
          .filter(Boolean)
      );

      // 7) Construir arreglo de alumnos a insertar en Usuarios,
      //    saltando boletas que ya existen o duplicadas en el propio CSV
      const alumnosAInsertar = [];
      const boletasUsadasEnCSV = new Set();
      const boletasSaltadasPorDuplicado = new Set();
      const boletasSaltadasPorExistente = new Set();

      for (const r of rows) {
        if (!r.nombre || !r.boleta || !r.grupo) continue;

        const boleta = r.boleta.trim();
        const keyGrupo = r.grupo.trim().toLowerCase();
        const grupoId = mapaGrupos.get(keyGrupo);

        if (!grupoId) continue;

        // Duplicado dentro del propio CSV
        if (boletasUsadasEnCSV.has(boleta)) {
          boletasSaltadasPorDuplicado.add(boleta);
          continue;
        }

        // Ya existe en la base
        if (boletasYaRegistradas.has(boleta)) {
          boletasSaltadasPorExistente.add(boleta);
          continue;
        }

        boletasUsadasEnCSV.add(boleta);

        alumnosAInsertar.push({
          Nombre: r.nombre,
          Apellido_Paterno: r.apellidoPaterno || null,
          Apellido_Materno: r.apellidoMaterno || null,
          Boleta: boleta,
          Grupo_id: grupoId,
          // Contrasena_Hash: null,
          // Rol_id: null,
        });
      }

      if (alumnosAInsertar.length === 0) {
        let msg = 'No se pudo generar ningún alumno para insertar.';
        if (boletasSaltadasPorExistente.size > 0) {
          msg +=
            '\nBoletas ya registradas que se omitieron: ' +
            Array.from(boletasSaltadasPorExistente).join(', ');
        }
        if (boletasSaltadasPorDuplicado.size > 0) {
          msg +=
            '\nBoletas duplicadas dentro del CSV que se omitieron: ' +
            Array.from(boletasSaltadasPorDuplicado).join(', ');
        }
        alert(msg);
        setLoading(false);
        return;
      }

      // 8) Insertar alumnos en Usuarios
      const { error: insertAlumnosError } = await supabase
        .from('Usuarios')
        .insert(alumnosAInsertar);

      if (insertAlumnosError) throw insertAlumnosError;

      let mensaje = `✅ Se insertaron ${alumnosAInsertar.length} alumnos nuevos.`;
      if (boletasSaltadasPorExistente.size > 0) {
        mensaje +=
          '\n(Omitidas boletas ya registradas: ' +
          Array.from(boletasSaltadasPorExistente).join(', ') +
          ')';
      }
      if (boletasSaltadasPorDuplicado.size > 0) {
        mensaje +=
          '\n(Omitidas boletas duplicadas en el CSV: ' +
          Array.from(boletasSaltadasPorDuplicado).join(', ') +
          ')';
      }

      alert(mensaje);
      clearFile();
    } catch (e) {
      console.error(e);
      alert(`❌ Error al guardar en Supabase: ${e.message ?? e}`);
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
                </tr>
                </thead>
                <tbody>
                {rows.map((r, i) => {
                    const nombreCompleto = [
                    r.nombre,
                    r.apellidoPaterno,
                    r.apellidoMaterno,
                    ]
                    .filter(Boolean)        // quita undefined / strings vacías
                    .join(' ');

                    return (
                    <tr key={i}>
                        <td>{nombreCompleto}</td>
                        <td>{r.boleta}</td>
                        <td>{r.grupo}</td>
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
