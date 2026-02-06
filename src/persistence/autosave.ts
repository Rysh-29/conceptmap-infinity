import { useEffect, useMemo } from 'react';
import { debounce } from '../utils/debounce';
import { useGraphStore } from '../store/graphStore';

export function useAutosave(delayMs = 800) {
  const isReady = useGraphStore((state) => state.isReady);
  const saveCurrent = useGraphStore((state) => state.saveCurrentDocument);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const metadata = useGraphStore((state) => ({
    id: state.metadata.id,
    name: state.metadata.name,
    createdAt: state.metadata.createdAt,
  }));

  const debouncedSave = useMemo(() => debounce(() => void saveCurrent(), delayMs), [saveCurrent, delayMs]);

  useEffect(() => {
    if (!isReady) return;
    debouncedSave();
    return () => debouncedSave.cancel();
  }, [nodes, edges, metadata, isReady, debouncedSave]);
}
