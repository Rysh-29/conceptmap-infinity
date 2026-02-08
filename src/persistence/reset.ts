const LAST_DOC_KEY = 'conceptmap-infinity:last-doc';
const DB_NAME = 'conceptmap-infinity';

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

export async function resetAppData(): Promise<void> {
  localStorage.removeItem(LAST_DOC_KEY);

  if (typeof indexedDB !== 'undefined') {
    await deleteDatabase(DB_NAME);
  }
}
