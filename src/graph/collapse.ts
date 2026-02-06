import type { ConceptEdge, ConceptNode } from '../types/graph';

export function getDescendants(rootId: string, edges: ConceptEdge[]): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const descendants = new Set<string>();
  const stack = [...(adjacency.get(rootId) ?? [])];

  while (stack.length > 0) {
    const next = stack.pop();
    if (!next || descendants.has(next)) {
      continue;
    }
    descendants.add(next);
    const children = adjacency.get(next);
    if (children) {
      for (const child of children) {
        if (!descendants.has(child)) {
          stack.push(child);
        }
      }
    }
  }

  return descendants;
}

export function applyCollapse(nodes: ConceptNode[], edges: ConceptEdge[]): { nodes: ConceptNode[]; edges: ConceptEdge[] } {
  const collapsedIds = nodes.filter((node) => node.data.collapsed).map((node) => node.id);
  const hiddenNodes = new Set<string>();

  for (const collapsedId of collapsedIds) {
    const descendants = getDescendants(collapsedId, edges);
    descendants.forEach((id) => hiddenNodes.add(id));
  }

  const nextNodes = nodes.map((node) => ({
    ...node,
    hidden: hiddenNodes.has(node.id),
  }));

  const nextEdges = edges.map((edge) => ({
    ...edge,
    hidden: hiddenNodes.has(edge.source) || hiddenNodes.has(edge.target),
  }));

  return { nodes: nextNodes, edges: nextEdges };
}
