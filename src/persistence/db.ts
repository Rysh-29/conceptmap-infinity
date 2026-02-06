import { openDB, type DBSchema } from 'idb';
import type { ExportMap } from '../types/schema';

const DB_NAME = 'conceptmap-infinity';
const DB_VERSION = 1;
const STORE_NAME = 'maps';

interface ConceptMapDb extends DBSchema {
  maps: {
    key: string;
    value: ExportMap;
    indexes: { 'by-updated': string };
  };
}

let dbPromise: ReturnType<typeof openDB<ConceptMapDb>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ConceptMapDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-updated', 'metadata.updatedAt');
      },
    });
  }
  return dbPromise;
}

export async function saveMap(doc: ExportMap): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, doc);
}

export async function getMap(id: string): Promise<ExportMap | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, id);
}

export async function listMaps(): Promise<ExportMap[]> {
  const db = await getDb();
  const docs = await db.getAll(STORE_NAME);
  return docs.sort((a, b) => b.metadata.updatedAt.localeCompare(a.metadata.updatedAt));
}

export async function deleteMap(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}
