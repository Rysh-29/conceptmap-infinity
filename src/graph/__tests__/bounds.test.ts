import { describe, expect, it } from 'vitest';
import { getGraphBounds } from '../bounds';
import type { ConceptNode } from '../../types/graph';

const makeNode = (id: string, x: number, y: number, width: number, height: number): ConceptNode => ({
  id,
  type: 'concept',
  position: { x, y },
  width,
  height,
  data: {
    label: id,
    style: {
      bgColor: '#fff',
      borderColor: '#000',
      borderWidth: 2,
    },
  },
});

describe('getGraphBounds', () => {
  it('computes bounding box for nodes', () => {
    const nodes = [makeNode('A', 10, 20, 100, 50), makeNode('B', 200, 60, 80, 90)];
    const bounds = getGraphBounds(nodes);

    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(20);
    expect(bounds.maxX).toBe(280);
    expect(bounds.maxY).toBe(150);
    expect(bounds.width).toBe(270);
    expect(bounds.height).toBe(130);
  });
});
