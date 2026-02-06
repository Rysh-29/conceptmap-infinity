import { describe, expect, it } from 'vitest';
import { applyCollapse } from '../collapse';
import type { ConceptEdge, ConceptNode } from '../../types/graph';

const makeNode = (id: string, collapsed = false): ConceptNode => ({
  id,
  type: 'concept',
  position: { x: 0, y: 0 },
  data: {
    label: id,
    style: {
      bgColor: '#fff',
      borderColor: '#000',
      borderWidth: 2,
    },
    collapsed,
  },
});

const makeEdge = (id: string, source: string, target: string): ConceptEdge => ({
  id,
  source,
  target,
});

describe('applyCollapse', () => {
  it('hides descendants of collapsed nodes', () => {
    const nodes = [makeNode('A'), makeNode('B', true), makeNode('C'), makeNode('D')];
    const edges = [
      makeEdge('e1', 'A', 'B'),
      makeEdge('e2', 'B', 'C'),
      makeEdge('e3', 'A', 'D'),
    ];

    const result = applyCollapse(nodes, edges);
    const hiddenNodes = result.nodes.filter((node) => node.hidden).map((node) => node.id);
    const hiddenEdges = result.edges.filter((edge) => edge.hidden).map((edge) => edge.id);

    expect(hiddenNodes).toEqual(['C']);
    expect(hiddenEdges).toEqual(['e2']);
  });

  it('hides entire subtree for collapsed root', () => {
    const nodes = [makeNode('A', true), makeNode('B'), makeNode('C')];
    const edges = [makeEdge('e1', 'A', 'B'), makeEdge('e2', 'B', 'C')];

    const result = applyCollapse(nodes, edges);
    const hiddenNodes = result.nodes.filter((node) => node.hidden).map((node) => node.id);

    expect(hiddenNodes.sort()).toEqual(['B', 'C']);
  });
});
