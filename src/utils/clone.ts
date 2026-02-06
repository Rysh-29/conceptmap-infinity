import type { ConceptEdge, ConceptNode, GraphSnapshot } from '../types/graph';

const canStructuredClone = typeof structuredClone === 'function';

function deepClone<T>(value: T): T {
  if (canStructuredClone) {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneGraph(nodes: ConceptNode[], edges: ConceptEdge[]): GraphSnapshot {
  return {
    nodes: deepClone(nodes),
    edges: deepClone(edges),
  };
}
