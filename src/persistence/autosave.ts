import { useEffect, useMemo, useRef } from 'react';
import { useGraphStore } from '../store/graphStore';
import { debounce, type Debounced } from '../utils/debounce';

export function useAutosave(delayMs = 800) {
  const isReady = useGraphStore((state) => state.isReady);
  const docId = useGraphStore((state) => state.metadata.id);
  const docName = useGraphStore((state) => state.metadata.name);
  const saveCurrent = useGraphStore((state) => state.saveCurrentDocument);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);

  const snapshotSignature = useMemo(() => {
    if (!docId) {
      return '';
    }

    // Do not include timestamps in the signature to avoid self-triggered saves.
    return JSON.stringify({
      id: docId,
      name: docName,
      nodes,
      edges,
    });
  }, [docId, docName, edges, nodes]);

  const activeDocIdRef = useRef('');
  const lastSavedSignatureRef = useRef('');
  const saveCurrentRef = useRef(saveCurrent);
  const isReadyRef = useRef(isReady);
  const snapshotSignatureRef = useRef(snapshotSignature);
  const isSavingRef = useRef(false);
  const lastSaveAtRef = useRef(0);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSaveRef = useRef<Debounced<() => void> | null>(null);
  const isDev = import.meta.env.DEV;
  const minIntervalMs = Math.max(1200, delayMs);

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

      const now = Date.now();
      const elapsed = now - lastSaveAtRef.current;
      if (elapsed < minIntervalMs) {
        const waitMs = minIntervalMs - elapsed;
        if (!throttleTimerRef.current) {
          throttleTimerRef.current = setTimeout(() => {
            throttleTimerRef.current = null;
            debouncedSaveRef.current?.();
          }, waitMs);
        }
        return;
      }

      isSavingRef.current = true;
      lastSaveAtRef.current = now;
      try {
        const result = await saveCurrentRef.current();
        lastSavedSignatureRef.current = nextSignature;
        if (result && isDev) {
          console.debug('[autosave] saved');
        }
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
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, [delayMs, minIntervalMs]);

  useEffect(() => {
    if (!isReady || !docId || !snapshotSignature) {
      return;
    }

    if (activeDocIdRef.current !== docId) {
      activeDocIdRef.current = docId;
      // Treat loaded document state as baseline to avoid save loops on boot.
      lastSavedSignatureRef.current = snapshotSignature;
      debouncedSaveRef.current?.cancel();
      lastSaveAtRef.current = 0;
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      return;
    }

    if (snapshotSignature !== lastSavedSignatureRef.current) {
      debouncedSaveRef.current?.();
    }
  }, [docId, isReady, snapshotSignature]);
}
