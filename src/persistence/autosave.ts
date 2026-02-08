import { useEffect, useMemo, useRef } from 'react';
import { buildExportMap } from '../export/json';
import { useGraphStore } from '../store/graphStore';
import { debounce, type Debounced } from '../utils/debounce';

export function useAutosave(delayMs = 800) {
  const isReady = useGraphStore((state) => state.isReady);
  const docId = useGraphStore((state) => state.metadata.id);
  const docName = useGraphStore((state) => state.metadata.name);
  const createdAt = useGraphStore((state) => state.metadata.createdAt);
  const saveCurrent = useGraphStore((state) => state.saveCurrentDocument);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const snapshotSignature = useMemo(() => {
    if (!docId) {
      return '';
    }

    return JSON.stringify(
      buildExportMap({
        id: docId,
        name: docName,
        createdAt,
        // Only needed for schema shape. It is ignored in dirty-checking logic.
        updatedAt: createdAt,
        nodes,
        edges,
      }),
    );
  }, [createdAt, docId, docName, edges, nodes]);

  const activeDocIdRef = useRef('');
  const lastSavedSignatureRef = useRef('');
  const saveCurrentRef = useRef(saveCurrent);
  const isReadyRef = useRef(isReady);
  const snapshotSignatureRef = useRef(snapshotSignature);
  const isSavingRef = useRef(false);
  const debouncedSaveRef = useRef<Debounced<() => void> | null>(null);

  useEffect(() => {
    saveCurrentRef.current = saveCurrent;
  }, [saveCurrent]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    snapshotSignatureRef.current = snapshotSignature;
  }, [snapshotSignature]);

  useEffect(() => {
    const saveIfDirty = async () => {
      if (isSavingRef.current) {
        return;
      }

      const nextSignature = snapshotSignatureRef.current;
      if (!isReadyRef.current || !nextSignature || nextSignature === lastSavedSignatureRef.current) {
        return;
      }

      isSavingRef.current = true;
      try {
        await saveCurrentRef.current();
        lastSavedSignatureRef.current = nextSignature;
      } finally {
        isSavingRef.current = false;
        const latestSignature = snapshotSignatureRef.current;
        if (latestSignature && latestSignature !== lastSavedSignatureRef.current) {
          debouncedSaveRef.current?.();
        }
      }
    };

    const debouncedSave = debounce(() => {
      void saveIfDirty();
    }, delayMs);

    debouncedSaveRef.current = debouncedSave;

    return () => {
      debouncedSave.cancel();
      debouncedSaveRef.current = null;
    };
  }, [delayMs]);

  useEffect(() => {
    if (!isReady || !docId || !snapshotSignature) {
      return;
    }

    if (activeDocIdRef.current !== docId) {
      activeDocIdRef.current = docId;
      // Treat loaded document state as baseline to avoid save loops on boot.
      lastSavedSignatureRef.current = snapshotSignature;
      debouncedSaveRef.current?.cancel();
      return;
    }

    if (snapshotSignature !== lastSavedSignatureRef.current) {
      debouncedSaveRef.current?.();
    }
  }, [docId, isReady, snapshotSignature]);
}
