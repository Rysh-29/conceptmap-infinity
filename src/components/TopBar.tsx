import type { DocumentSummary } from '../store/graphStore';

type TopBarProps = {
  documents: DocumentSummary[];
  currentId?: string;
  onSelectDocument: (id: string) => void;
  onNew: () => void;
  onRename: () => void;
  onSave: () => void;
  onExportJson: () => void;
  onExportPoster: (size: 'A4' | 'A3') => void;
  onExportSingle: () => void;
  onExportAndUpload: () => void;
};

const TopBar = ({
  documents,
  currentId,
  onSelectDocument,
  onNew,
  onRename,
  onSave,
  onExportJson,
  onExportPoster,
  onExportSingle,
  onExportAndUpload,
}: TopBarProps) => {
  const formatDate = (value: string) => new Date(value).toLocaleDateString();

  return (
    <div className="topbar">
      <div className="topbar__left">
        <span className="brand">ConceptMap Infinity</span>
        <select
          className="topbar__select"
          value={currentId ?? ''}
          onChange={(event) => onSelectDocument(event.target.value)}
        >
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} — {formatDate(doc.updatedAt)}
            </option>
          ))}
        </select>
      </div>
      <div className="topbar__actions">
        <button type="button" onClick={onNew}>
          Nuevo
        </button>
        <button type="button" onClick={onRename}>
          Renombrar
        </button>
        <button type="button" onClick={onSave}>
          Guardar
        </button>
        <button type="button" onClick={onExportJson}>
          Exportar JSON
        </button>
        <button type="button" onClick={() => onExportPoster('A4')}>
          Exportar PDF A4
        </button>
        <button type="button" onClick={() => onExportPoster('A3')}>
          Exportar PDF A3
        </button>
        <button type="button" onClick={onExportSingle}>
          Exportar PDF Single
        </button>
        <button type="button" onClick={onExportAndUpload}>
          Exportar y subir
        </button>
      </div>
    </div>
  );
};

export default TopBar;
