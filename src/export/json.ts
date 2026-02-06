import { MarkerType } from 'reactflow';
import type { ConceptEdge, ConceptNode } from '../types/graph';
import { DEFAULT_BORDER_COLOR, DEFAULT_BORDER_WIDTH, DEFAULT_NODE_COLOR } from '../graph/defaults';
import type { ExportMap } from '../types/schema';
import { SCHEMA_VERSION } from '../types/schema';

export function buildExportMap(params: {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}): ExportMap {
  const { id, name, createdAt, updatedAt, nodes, edges } = params;

  return {
    id,
    version: SCHEMA_VERSION,
    metadata: {
      id,
      name,
      createdAt,
      updatedAt,
    },
    nodes: nodes.map((node) => ({
      id: node.id,
      type: 'concept',
      position: node.position,
      data: {
        label: node.data.label,
        style: {
          bgColor: node.data.style.bgColor,
          borderColor: node.data.style.borderColor,
          borderWidth: node.data.style.borderWidth,
          icon: node.data.style.icon,
        },
        collapsed: node.data.collapsed,
        parentId: node.data.parentId,
      },
      width: node.width ?? undefined,
      height: node.height ?? undefined,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
    })),
  };
}

export function hydrateFromExportMap(doc: ExportMap): { nodes: ConceptNode[]; edges: ConceptEdge[]; metadata: ExportMap['metadata'] } {
  const nodes: ConceptNode[] = doc.nodes.map((node) => ({
    id: node.id,
    type: 'concept',
    position: node.position,
    data: {
      label: node.data.label,
      style: {
        bgColor: node.data.style?.bgColor ?? DEFAULT_NODE_COLOR,
        borderColor: node.data.style?.borderColor ?? DEFAULT_BORDER_COLOR,
        borderWidth: node.data.style?.borderWidth ?? DEFAULT_BORDER_WIDTH,
        icon: node.data.style?.icon ?? '',
      },
      collapsed: node.data.collapsed,
      parentId: node.data.parentId,
    },
    width: node.width ?? undefined,
    height: node.height ?? undefined,
  }));

  const edges: ConceptEdge[] = doc.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type ?? 'default',
    markerEnd: { type: MarkerType.ArrowClosed },
  }));

  return {
    nodes,
    edges,
    metadata: doc.metadata,
  };
}
