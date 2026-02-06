import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from 'reactflow';
import { nanoid } from 'nanoid';
import type { ConceptEdge, ConceptNode, GraphSnapshot } from '../types/graph';
import type { ExportMap } from '../types/schema';
import { DEFAULT_BORDER_COLOR, DEFAULT_BORDER_WIDTH, DEFAULT_NODE_COLOR, DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../graph/defaults';
import { cloneGraph } from '../utils/clone';
import { buildExportMap, hydrateFromExportMap } from '../export/json';
import { saveMap } from '../persistence/db';

export type DocumentSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type GraphStore = {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  metadata: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  documents: DocumentSummary[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  history: {
    past: GraphSnapshot[];
    future: GraphSnapshot[];
  };
  dragging: boolean;
  dragSnapshot?: GraphSnapshot;
  isReady: boolean;

  setDocuments: (docs: DocumentSummary[]) => void;
  loadDocument: (doc: ExportMap) => void;
  newDocument: (name?: string) => void;
  renameDocument: (name: string) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  selectFromSelection: (nodeIds: string[], edgeIds: string[]) => void;

  addNodeAt: (position: { x: number; y: number }) => void;
  addChildNode: (parentId: string) => void;
  addSiblingNode: (nodeId: string) => void;

  updateNodeLabel: (id: string, label: string) => void;
  updateNodeStyle: (id: string, style: Partial<ConceptNode['data']['style']>) => void;
  toggleCollapse: (id: string) => void;

  removeSelection: () => void;

  undo: () => void;
  redo: () => void;

  startDrag: () => void;
  endDrag: () => void;

  saveCurrentDocument: () => Promise<ExportMap | null>;
};

const HISTORY_LIMIT = 120;

const createNode = (position: { x: number; y: number }, parentId?: string): ConceptNode => ({
  id: nanoid(),
  type: 'concept',
  position,
  data: {
    label: 'Idea',
    style: {
      bgColor: DEFAULT_NODE_COLOR,
      borderColor: DEFAULT_BORDER_COLOR,
      borderWidth: DEFAULT_BORDER_WIDTH,
    },
    parentId,
  },
});

const createEdge = (source: string, target: string): ConceptEdge => ({
  id: nanoid(),
  source,
  target,
  type: 'default',
  markerEnd: { type: MarkerType.ArrowClosed },
});

function withHistory(state: GraphStore, snapshot: GraphSnapshot) {
  const past = [...state.history.past, snapshot];
  if (past.length > HISTORY_LIMIT) {
    past.shift();
  }
  return {
    past,
    future: [],
  };
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  metadata: {
    id: '',
    name: 'ConceptMap Infinity',
    createdAt: '',
    updatedAt: '',
  },
  documents: [],
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  history: {
    past: [],
    future: [],
  },
  dragging: false,
  dragSnapshot: undefined,
  isReady: false,

  setDocuments: (docs) => set({ documents: docs }),

  loadDocument: (doc) => {
    const { nodes, edges, metadata } = hydrateFromExportMap(doc);
    set({
      nodes,
      edges,
      metadata,
      history: { past: [], future: [] },
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      dragging: false,
      dragSnapshot: undefined,
      isReady: true,
    });
  },

  newDocument: (name) => {
    const now = new Date().toISOString();
    const id = nanoid();
    const dateStamp = now.slice(0, 10);
    const displayName = name?.trim() || `Mapa ${dateStamp}`;
    const rootNode = { ...createNode({ x: 0, y: 0 }), selected: true };
    set((state) => ({
      nodes: [rootNode],
      edges: [],
      metadata: {
        id,
        name: displayName,
        createdAt: now,
        updatedAt: now,
      },
      history: { past: [], future: [] },
      documents: [{ id, name: displayName, createdAt: now, updatedAt: now }, ...state.documents],
      selectedNodeId: rootNode.id,
      selectedEdgeId: undefined,
      dragging: false,
      dragSnapshot: undefined,
      isReady: true,
    }));
  },

  renameDocument: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => ({
      metadata: {
        ...state.metadata,
        name: trimmed,
      },
      documents: state.documents.map((doc) => (doc.id === state.metadata.id ? { ...doc, name: trimmed } : doc)),
    }));
  },

  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes) as ConceptNode[];
      const shouldRecord = !state.dragging && changes.some((change) => change.type !== 'select');
      return {
        nodes: nextNodes,
        history: shouldRecord ? withHistory(state, cloneGraph(state.nodes, state.edges)) : state.history,
      };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const nextEdges = applyEdgeChanges(changes, state.edges) as ConceptEdge[];
      const shouldRecord = changes.some((change) => change.type !== 'select');
      return {
        edges: nextEdges,
        history: shouldRecord ? withHistory(state, cloneGraph(state.nodes, state.edges)) : state.history,
      };
    });
  },

  onConnect: (connection) => {
    set((state) => {
      const snapshot = cloneGraph(state.nodes, state.edges);
      const nextEdges = addEdge(
        {
          ...connection,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        state.edges,
      ) as ConceptEdge[];

      let nextNodes = state.nodes;
      if (connection.target && connection.source) {
        const sourceId = connection.source;
        const targetId = connection.target;
        nextNodes = state.nodes.map((node) =>
          node.id === targetId && !node.data.parentId
            ? { ...node, data: { ...node.data, parentId: sourceId } }
            : node,
        );
      }

      return {
        nodes: nextNodes,
        edges: nextEdges,
        history: withHistory(state, snapshot),
      };
    });
  },

  selectFromSelection: (nodeIds, edgeIds) => {
    set({
      selectedNodeId: nodeIds[0],
      selectedEdgeId: edgeIds[0],
    });
  },

  addNodeAt: (position) => {
    set((state) => {
      const snapshot = cloneGraph(state.nodes, state.edges);
      const newNode = { ...createNode(position), selected: true };
      const nextNodes = state.nodes.map((node) => ({ ...node, selected: false }));
      return {
        nodes: [...nextNodes, newNode],
        history: withHistory(state, snapshot),
        selectedNodeId: newNode.id,
        selectedEdgeId: undefined,
      };
    });
  },

  addChildNode: (parentId) => {
    set((state) => {
      const parent = state.nodes.find((node) => node.id === parentId);
      if (!parent) return state;
      const snapshot = cloneGraph(state.nodes, state.edges);
      const children = state.edges.filter((edge) => edge.source === parentId).map((edge) => edge.target);
      const childNodes = state.nodes.filter((node) => children.includes(node.id));
      const maxY = childNodes.length
        ? Math.max(...childNodes.map((node) => node.position.y))
        : parent.position.y;
      const position = {
        x: parent.position.x + DEFAULT_NODE_WIDTH + 120,
        y: maxY + (childNodes.length ? DEFAULT_NODE_HEIGHT + 40 : 0),
      };
      const newNode = { ...createNode(position, parentId), selected: true };
      const nextNodes = state.nodes.map((node) => ({ ...node, selected: false }));
      const newEdge = createEdge(parentId, newNode.id);

      return {
        nodes: [...nextNodes, newNode],
        edges: [...state.edges, newEdge],
        history: withHistory(state, snapshot),
        selectedNodeId: newNode.id,
        selectedEdgeId: undefined,
      };
    });
  },

  addSiblingNode: (nodeId) => {
    set((state) => {
      const node = state.nodes.find((item) => item.id === nodeId);
      if (!node) return state;
      const parentId = node.data.parentId;
      const snapshot = cloneGraph(state.nodes, state.edges);

      if (!parentId) {
        const position = {
          x: node.position.x,
          y: node.position.y + DEFAULT_NODE_HEIGHT + 40,
        };
        const newNode = { ...createNode(position), selected: true };
        const nextNodes = state.nodes.map((item) => ({ ...item, selected: false }));
        return {
          nodes: [...nextNodes, newNode],
          history: withHistory(state, snapshot),
          selectedNodeId: newNode.id,
          selectedEdgeId: undefined,
        };
      }

      const siblings = state.edges.filter((edge) => edge.source === parentId).map((edge) => edge.target);
      const siblingNodes = state.nodes.filter((item) => siblings.includes(item.id));
      const maxY = siblingNodes.length
        ? Math.max(...siblingNodes.map((item) => item.position.y))
        : node.position.y;
      const position = {
        x: node.position.x,
        y: maxY + DEFAULT_NODE_HEIGHT + 40,
      };
      const newNode = { ...createNode(position, parentId), selected: true };
      const nextNodes = state.nodes.map((item) => ({ ...item, selected: false }));
      const newEdge = createEdge(parentId, newNode.id);

      return {
        nodes: [...nextNodes, newNode],
        edges: [...state.edges, newEdge],
        history: withHistory(state, snapshot),
        selectedNodeId: newNode.id,
        selectedEdgeId: undefined,
      };
    });
  },

  updateNodeLabel: (id, label) => {
    set((state) => {
      const snapshot = cloneGraph(state.nodes, state.edges);
      const nextNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label } } : node,
      );
      return {
        nodes: nextNodes,
        history: withHistory(state, snapshot),
      };
    });
  },

  updateNodeStyle: (id, style) => {
    set((state) => {
      const snapshot = cloneGraph(state.nodes, state.edges);
      const nextNodes = state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, style: { ...node.data.style, ...style } } }
          : node,
      );
      return {
        nodes: nextNodes,
        history: withHistory(state, snapshot),
      };
    });
  },

  toggleCollapse: (id) => {
    set((state) => {
      const snapshot = cloneGraph(state.nodes, state.edges);
      const nextNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } } : node,
      );
      return {
        nodes: nextNodes,
        history: withHistory(state, snapshot),
      };
    });
  },

  removeSelection: () => {
    set((state) => {
      const snapshot = cloneGraph(state.nodes, state.edges);
      const selectedNodes = state.nodes.filter((node) => node.selected).map((node) => node.id);
      const selectedEdges = state.edges.filter((edge) => edge.selected).map((edge) => edge.id);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        return state;
      }

      const remainingNodes = state.nodes.filter((node) => !selectedNodes.includes(node.id));
      const remainingEdges = state.edges.filter(
        (edge) => !selectedEdges.includes(edge.id) && !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target),
      );

      return {
        nodes: remainingNodes,
        edges: remainingEdges,
        history: withHistory(state, snapshot),
        selectedNodeId: undefined,
        selectedEdgeId: undefined,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const past = state.history.past.slice(0, -1);
      const future = [cloneGraph(state.nodes, state.edges), ...state.history.future];
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        history: { past, future },
        selectedNodeId: undefined,
        selectedEdgeId: undefined,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const future = state.history.future.slice(1);
      const past = [...state.history.past, cloneGraph(state.nodes, state.edges)];
      return {
        nodes: next.nodes,
        edges: next.edges,
        history: { past, future },
        selectedNodeId: undefined,
        selectedEdgeId: undefined,
      };
    });
  },

  startDrag: () => {
    set((state) => ({
      dragging: true,
      dragSnapshot: cloneGraph(state.nodes, state.edges),
    }));
  },

  endDrag: () => {
    set((state) => {
      if (!state.dragSnapshot) {
        return { dragging: false, dragSnapshot: undefined };
      }
      return {
        dragging: false,
        dragSnapshot: undefined,
        history: withHistory(state, state.dragSnapshot),
      };
    });
  },

  saveCurrentDocument: async () => {
    const state = get();
    if (!state.metadata.id) {
      return null;
    }

    const now = new Date().toISOString();
    const exportDoc = buildExportMap({
      id: state.metadata.id,
      name: state.metadata.name,
      createdAt: state.metadata.createdAt,
      updatedAt: now,
      nodes: state.nodes,
      edges: state.edges,
    });

    await saveMap(exportDoc);

    set((prev) => ({
      metadata: {
        ...prev.metadata,
        updatedAt: now,
      },
      documents: prev.documents.map((doc) =>
        doc.id === exportDoc.id ? { ...doc, name: exportDoc.metadata.name, updatedAt: now } : doc,
      ),
    }));

    return exportDoc;
  },
}));
