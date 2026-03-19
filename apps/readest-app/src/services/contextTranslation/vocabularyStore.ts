import type { VocabularyEntry } from './types';

// Piggybacks on the existing readest-ai DB, bumping it to version 4
const DB_NAME = 'readest-ai';
const DB_VERSION = 4;
const VOCAB_STORE = 'vocabulary';

class VocabularyStore {
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Preserve existing stores from prior versions; only add new ones
        if (!db.objectStoreNames.contains(VOCAB_STORE)) {
          const store = db.createObjectStore(VOCAB_STORE, { keyPath: 'id' });
          store.createIndex('bookHash', 'bookHash', { unique: false });
          store.createIndex('term', 'term', { unique: false });
          store.createIndex('addedAt', 'addedAt', { unique: false });
        }
      };
    });
  }

  async save(entry: VocabularyEntry): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VOCAB_STORE, 'readwrite');
      tx.objectStore(VOCAB_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getByBook(bookHash: string): Promise<VocabularyEntry[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const req = db
        .transaction(VOCAB_STORE, 'readonly')
        .objectStore(VOCAB_STORE)
        .index('bookHash')
        .getAll(bookHash);
      req.onsuccess = () =>
        resolve((req.result as VocabularyEntry[]).sort((a, b) => b.addedAt - a.addedAt));
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(): Promise<VocabularyEntry[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(VOCAB_STORE, 'readonly').objectStore(VOCAB_STORE).getAll();
      req.onsuccess = () =>
        resolve((req.result as VocabularyEntry[]).sort((a, b) => b.addedAt - a.addedAt));
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VOCAB_STORE, 'readwrite');
      tx.objectStore(VOCAB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async search(query: string): Promise<VocabularyEntry[]> {
    const all = await this.getAll();
    const lower = query.toLowerCase();
    return all.filter(
      (e) => e.term.toLowerCase().includes(lower) || e.context.toLowerCase().includes(lower),
    );
  }
}

export const vocabularyStore = new VocabularyStore();
