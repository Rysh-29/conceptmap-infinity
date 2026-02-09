import { useState, useRef, useEffect } from 'react';

type TopBarProps = {
  docId: string;
  docList: { id: string; name: string }[];
  onNew: () => void;
  onRename: () => void;
  onSave: () => void;
  onDocSwitch: (id: string) => void;
  onExport: (format: 'json' | 'pdf-a4') => void;
  onExportPoster: (format: 'A3' | 'A4') => void;
  onExportSingle: () => void;
  onExportAndUpload: () => void;
};

const TopBar = (props: TopBarProps) => {
  const {
    docId,
    docList,
    onNew,
    onRename,
    onSave,
    onDocSwitch,
    onExport,
    onExportPoster,
    onExportSingle,
    onExportAndUpload,
  } = props;

  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="topbar">
      {/* Grupo: Documentos */}
      <div className="topbar-group">
        <select value={docId} onChange={(e) => onDocSwitch(e.target.value)}>
          {docList.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={onNew}>
          Nuevo
        </button>
        <button type="button" className="btn-secondary" onClick={onRename}>
          Renombrar
        </button>
      </div>

      {/* Grupo: Guardar */}
      <div className="topbar-group">
        <button type="button" className="btn-primary" onClick={onSave}>
          Guardar
        </button>
      </div>

      {/* Grupo: Exportar */}
      <div className="topbar-group">
        <div className="export-dropdown" ref={dropdownRef}>
          <button type="button" className="btn-secondary" onClick={() => setIsExportOpen(!isExportOpen)}>
            Exportar
          </button>
          {isExportOpen && (
            <div className="export-dropdown-panel">
              <button type="button" onClick={() => { onExport('json'); setIsExportOpen(false); }}>
                Exportar JSON
              </button>
              <button type="button" onClick={() => { onExport('pdf-a4'); setIsExportOpen(false); }}>
                Exportar PDF A4
              </button>
              <button type="button" onClick={() => { onExportPoster('A3'); setIsExportOpen(false); }}>
                Exportar PDF A3
              </button>
              <button type="button" onClick={() => { onExportSingle(); setIsExportOpen(false); }}>
                Exportar PDF Single
              </button>
              <button type="button" onClick={() => { onExportAndUpload(); setIsExportOpen(false); }}>
                Exportar y subir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
