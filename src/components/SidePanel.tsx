import type { ConceptNode } from '../types/graph';

type SidePanelProps = {
  node?: ConceptNode;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateStyle: (id: string, style: Partial<ConceptNode['data']['style']>) => void;
  onToggleCollapse: (id: string) => void;
};

const SidePanel = ({ node, onUpdateLabel, onUpdateStyle, onToggleCollapse }: SidePanelProps) => {
  if (!node) {
    return (
      <aside className="sidepanel">
        <h3>Propiedades</h3>
        <p className="sidepanel__empty">Selecciona un nodo para editarlo.</p>
      </aside>
    );
  }

  return (
    <aside className="sidepanel">
      <h3>Propiedades</h3>
      <label>
        Texto
        <input
          type="text"
          value={node.data.label}
          onChange={(event) => onUpdateLabel(node.id, event.target.value)}
        />
      </label>
      <label>
        Color de fondo
        <input
          type="color"
          value={node.data.style.bgColor}
          onChange={(event) => onUpdateStyle(node.id, { bgColor: event.target.value })}
        />
      </label>
      <label>
        Color de borde
        <input
          type="color"
          value={node.data.style.borderColor}
          onChange={(event) => onUpdateStyle(node.id, { borderColor: event.target.value })}
        />
      </label>
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
      <label>
        Icono
        <input
          type="text"
          placeholder="Ej: ✨"
          value={node.data.style.icon ?? ''}
          onChange={(event) => onUpdateStyle(node.id, { icon: event.target.value })}
        />
      </label>
      <label className="sidepanel__toggle">
        <input
          type="checkbox"
          checked={Boolean(node.data.collapsed)}
          onChange={() => onToggleCollapse(node.id)}
        />
        Colapsar rama
      </label>
    </aside>
  );
};

export default SidePanel;
