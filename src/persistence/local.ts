const LAST_DOC_KEY = 'conceptmap-infinity:last-doc';

export function getLastDocId(): string | null {
  return localStorage.getItem(LAST_DOC_KEY);
}

export function setLastDocId(id: string) {
  localStorage.setItem(LAST_DOC_KEY, id);
}
