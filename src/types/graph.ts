import type { Edge, Node } from 'reactflow';

export type NodeStyle = {
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  icon?: string;
};

export type ConceptNodeData = {
  label: string;
  style: NodeStyle;
  collapsed?: boolean;
  parentId?: string;
};

export type ConceptNode = Node<ConceptNodeData, 'concept'>;
export type ConceptEdge = Edge;

export type GraphSnapshot = {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
};
