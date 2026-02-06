import type { ConceptNode } from '../types/graph';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from './defaults';

export type GraphBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export function getGraphBounds(nodes: ConceptNode[], fallbackWidth = DEFAULT_NODE_WIDTH, fallbackHeight = DEFAULT_NODE_HEIGHT): GraphBounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: fallbackWidth,
      maxY: fallbackHeight,
      width: fallbackWidth,
      height: fallbackHeight,
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const width = node.width ?? fallbackWidth;
    const height = node.height ?? fallbackHeight;
    const x = node.position.x;
    const y = node.position.y;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
