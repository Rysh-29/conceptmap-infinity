import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { ConceptNodeData } from '../types/graph';
import { useGraphStore } from '../store/graphStore';

const ConceptNode = ({ id, data, selected }: NodeProps<ConceptNodeData>) => {
  const updateLabel = useGraphStore((state) => state.updateNodeLabel);
  const toggleCollapse = useGraphStore((state) => state.toggleCollapse);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commit = () => {
    const next = draft.trim() || 'Idea';
    setIsEditing(false);
    if (next !== data.label) {
      updateLabel(id, next);
    }
  };

  return (
    <div
      className={`concept-node ${selected ? 'selected' : ''}`}
      style={{
        background: data.style.bgColor,
        borderColor: data.style.borderColor,
        borderWidth: data.style.borderWidth,
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Left} />

      <div className="concept-node__header">
        {data.style.icon ? <span className="concept-node__icon">{data.style.icon}</span> : null}
        {isEditing ? (
          <input
            ref={inputRef}
            className="concept-node__input nodrag"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
            }}
          />
        ) : (
          <div className="concept-node__label">{data.label}</div>
        )}
      </div>

      <button
        className="concept-node__collapse nodrag"
        type="button"
        onClick={() => toggleCollapse(id)}
        title={data.collapsed ? 'Expandir rama' : 'Colapsar rama'}
      >
        {data.collapsed ? '+' : '–'}
      </button>

      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ConceptNode);
