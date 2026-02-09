import type { ConceptNode } from '../types/graph';

type SidePanelProps = {
  node?: ConceptNode;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateStyle: (id: string, style: Partial<ConceptNode['data']['style']>) => void;
  onToggleCollapse: (id: string) => void;
  onResetAppData: () => void;
};

const SidePanel = (props: SidePanelProps) => {
  const { node, onUpdateLabel, onUpdateStyle, onToggleCollapse } = props;

  // Estado Vacío: No hay nodo seleccionado
  if (!node) {
    return (
      <aside className="sidepanel sidepanel--empty">
        <div className="sidepanel__empty-icon">
          {/* Icono placeholder: SVG */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5ZM5 5H19V19H5V5Z" fill="#E0E0E0"/>
            <path d="M9.5 7.5L11.5 11.5L9.5 15.5" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.5 7.5L12.5 11.5L14.5 15.5" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h4>Selecciona un nodo</h4>
        <p>Haz clic en un nodo del lienzo para ver y editar sus propiedades.</p>
      </aside>
    );
  }

  // Vista con Nodo Seleccionado
  return (
    <aside className="sidepanel">
      <h3>Propiedades</h3>
      
      {/* Campo Principal: Texto */}
      <div className="form-field">
        <label>
          Texto
          <input
            type="text"
            value={node.data.label}
            onChange={(event) => onUpdateLabel(node.id, event.target.value)}
          />
        </label>
      </div>

      {/* Sección: Apariencia */}
      <div className="sidepanel-section">
        <h4>Apariencia</h4>
        <div className="form-field">
          <label>
            Color de fondo
            <input
              type="color"
              value={node.data.style.bgColor}
              onChange={(event) => onUpdateStyle(node.id, { bgColor: event.target.value })}
            />
          </label>
        </div>
        <div className="form-field">
          <label>
            Color de borde
            <input
              type="color"
              value={node.data.style.borderColor}
              onChange={(event) => onUpdateStyle(node.id, { borderColor: event.target.value })}
            />
          </label>
        </div>
        <div className="form-field">
          <label>
            Grosor de borde
            <input
              type="range"
              min={1}
              max={6}
              value={node.data.style.borderWidth}
              onChange={(event) => onUpdateStyle(node.id, { borderWidth: Number(event.target.value) })}
            />
          </label>
        </div>
        <div className="form-field">
          <label>
            Icono
            <input
              type="text"
              placeholder="Ej: ✨"
              value={node.data.style.icon ?? ''}
              onChange={(event) => onUpdateStyle(node.id, { icon: event.target.value })}
            />
          </label>
        </div>
      </div>

      {/* Sección: Estructura */}
      <div className="sidepanel-section">
        <h4>Estructura</h4>
        <label className="form-field-checkbox">
          <input
            type="checkbox"
            checked={Boolean(node.data.collapsed)}
            onChange={() => onToggleCollapse(node.id)}
          />
          <span className="custom-checkbox"></span>
          Colapsar rama
        </label>
      </div>
    </aside>
  );
};

export default SidePanel;