import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  type EdgeTypes,
  type NodeTypes,
  type ReactFlowInstance,
} from 'reactflow';
import ConceptNode from './components/ConceptNode';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import { applyCollapse } from './graph/collapse';
import { useGraphStore } from './store/graphStore';
import { useAutosave } from './persistence/autosave';
import { getMap, listMaps } from './persistence/db';
import { getLastDocId, setLastDocId } from './persistence/local';
import { resetAppData } from './persistence/reset';
import { buildExportMap } from './export/json';
import { downloadBlob } from './export/download';
import { exportPdfPoster, exportPdfSingle } from './export/pdf';

const nodeTypes: NodeTypes = { concept: ConceptNode };
const edgeTypes: EdgeTypes = {};
const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } };
const panOnDrag = [1, 2];

const AppContent = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const metadata = useGraphStore((state) => state.metadata);
  const documents = useGraphStore((state) => state.documents);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);

  const setDocuments = useGraphStore((state) => state.setDocuments);
  const loadDocument = useGraphStore((state) => state.loadDocument);
  const newDocument = useGraphStore((state) => state.newDocument);
  const renameDocument = useGraphStore((state) => state.renameDocument);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const onConnect = useGraphStore((state) => state.onConnect);
  const selectFromSelection = useGraphStore((state) => state.selectFromSelection);
  const addNodeAt = useGraphStore((state) => state.addNodeAt);
  const addChildNode = useGraphStore((state) => state.addChildNode);
  const addSiblingNode = useGraphStore((state) => state.addSiblingNode);
  const updateNodeLabel = useGraphStore((state) => state.updateNodeLabel);
  const updateNodeStyle = useGraphStore((state) => state.updateNodeStyle);
  const toggleCollapse = useGraphStore((state) => state.toggleCollapse);
  const removeSelection = useGraphStore((state) => state.removeSelection);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);
  const startDrag = useGraphStore((state) => state.startDrag);
  const endDrag = useGraphStore((state) => state.endDrag);
  const saveCurrentDocument = useGraphStore((state) => state.saveCurrentDocument);

  useAutosave();

  const { nodes: visibleNodes, edges: visibleEdges } = useMemo(() => applyCollapse(nodes, edges), [nodes, edges]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const createNodeAtCenter = useCallback(() => {
    if (!reactFlowInstance || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    addNodeAt(position);
  }, [addNodeAt, reactFlowInstance]);

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
        return;
      }

      const key = event.key.toLowerCase();
      const isMod = event.ctrlKey || event.metaKey;

      if (key === 'enter') {
        event.preventDefault();
        if (selectedNodeId) {
          addChildNode(selectedNodeId);
        } else {
          createNodeAtCenter();
        }
      }

      if (key === 'tab') {
        event.preventDefault();
        if (selectedNodeId) {
          addSiblingNode(selectedNodeId);
        } else {
          createNodeAtCenter();
        }
      }

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        removeSelection();
      }

      if (isMod && key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (isMod && key === 'y') {
        event.preventDefault();
        redo();
      } else if (isMod && key === 'z') {
        event.preventDefault();
        undo();
      }

      if (isMod && key === 's') {
        event.preventDefault();
        void saveCurrentDocument();
      }
    },
    [
      addChildNode,
      addSiblingNode,
      createNodeAtCenter,
      redo,
      removeSelection,
      saveCurrentDocument,
      selectedNodeId,
      undo,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  const handleSelectionChange = useCallback(
    (params: { nodes?: { id: string }[]; edges?: { id: string }[] } | null) => {
      selectFromSelection(
        params?.nodes?.map((node) => node.id) ?? [],
        params?.edges?.map((edge) => edge.id) ?? [],
      );
    },
    [selectFromSelection],
  );

  const handlePaneClick = useCallback(() => {
    selectFromSelection([], []);
  }, [selectFromSelection]);

  useEffect(() => {
    const init = async () => {
      const docs = await listMaps();
      if (docs.length === 0) {
        newDocument();
        return;
      }
      setDocuments(
        docs.map((doc) => ({
          id: doc.id,
          name: doc.metadata.name,
          createdAt: doc.metadata.createdAt,
          updatedAt: doc.metadata.updatedAt,
        })),
      );

      const lastId = getLastDocId();
      const candidate = lastId ? docs.find((doc) => doc.id === lastId) : docs[0];
      if (candidate) {
        const loaded = await getMap(candidate.id);
        if (loaded) {
          loadDocument(loaded);
        } else {
          newDocument();
        }
      }
    };

    void init();
  }, [loadDocument, newDocument, setDocuments]);

  useEffect(() => {
    if (metadata.id) {
      setLastDocId(metadata.id);
    }
  }, [metadata.id]);

  const handleDocSwitch = async (id: string) => {
    if (!id) return;
    const loaded = await getMap(id);
    if (loaded) {
      loadDocument(loaded);
    }
  };

  const handleRename = () => {
    const nextName = prompt('Nuevo nombre del mapa', metadata.name);
    if (nextName) {
      renameDocument(nextName);
    }
  };

  const handleSave = () => {
    void saveCurrentDocument();
  };

  const handleResetAppData = useCallback(async () => {
    await resetAppData();
    window.location.reload();
  }, []);

  const handleExport = async (format: 'json' | 'pdf-a4') => {
    const safeName = metadata.name.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'ConceptMap';
    if (format === 'json') {
      const doc = buildExportMap({
        id: metadata.id,
        name: metadata.name,
        createdAt: metadata.createdAt,
        updatedAt: new Date().toISOString(),
        nodes,
        edges,
      });
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${safeName}.json`);
    } else if (format === 'pdf-a4') {
      if (!reactFlowInstance || !wrapperRef.current) return;
        await exportPdfPoster({
        container: wrapperRef.current,
        reactFlow: reactFlowInstance,
        nodes: visibleNodes.filter((node) => !node.hidden),
        pageSize: 'A4',
        filename: `${safeName}-A4.pdf`,
        });
    }
  };

  const exportPoster = async (size: 'A3' | 'A4') => {
    if (!reactFlowInstance || !wrapperRef.current) return;
    const safeName = metadata.name.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'ConceptMap';
    await exportPdfPoster({
      container: wrapperRef.current,
      reactFlow: reactFlowInstance,
      nodes: visibleNodes.filter((node) => !node.hidden),
      pageSize: size,
      filename: `${safeName}-${size}.pdf`,
    });
  };

  const exportSingle = async () => {
    if (!reactFlowInstance || !wrapperRef.current) return;
    const safeName = metadata.name.replace(/[<>:"/\\|?*]+/g, '-').trim() || 'ConceptMap';
    await exportPdfSingle({
      container: wrapperRef.current,
      reactFlow: reactFlowInstance,
      nodes: visibleNodes.filter((node) => !node.hidden),
      filename: `${safeName}-single.pdf`,
    });
  };

  const exportAndUpload = async () => {
    handleExport('json');
    await exportPoster('A4');
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener');
  };

  return (
    <div className="app">
      <TopBar
        docList={documents}
        docId={metadata.id}
        onDocSwitch={handleDocSwitch}
        onNew={() => newDocument()}
        onRename={handleRename}
        onSave={handleSave}
        onExport={handleExport}
        onExportPoster={exportPoster}
        onExportSingle={exportSingle}
        onExportAndUpload={exportAndUpload}
      />
      <div className="app__body">
        <div className="canvas" ref={wrapperRef}>
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeDragStart={startDrag}
            onNodeDragStop={endDrag}
            onSelectionChange={handleSelectionChange}
            onPaneClick={handlePaneClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
            panActivationKeyCode="Space"
            panOnDrag={panOnDrag}
            zoomOnScroll
            selectionOnDrag
            defaultEdgeOptions={defaultEdgeOptions}
          >
            <Background gap={24} color="#c7c3bd" />
            <MiniMap pannable zoomable className="minimap" />
            <Controls position="bottom-left" />
          </ReactFlow>
        </div>
        <SidePanel
          node={selectedNode}
          onUpdateLabel={updateNodeLabel}
          onUpdateStyle={updateNodeStyle}
          onToggleCollapse={toggleCollapse}
          onResetAppData={handleResetAppData}
        />
      </div>
    </div>
  );
};

const App = () => (
  <ReactFlowProvider>
    <AppContent />
  </ReactFlowProvider>
);

export default App;
