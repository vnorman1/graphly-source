import { useState, useEffect, useCallback } from 'react';

// IndexedDB konfiguráció
const DB_NAME = 'OGImageDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export interface ImageRecord {
  id: string;
  blob: Blob;
  filename: string;
  timestamp: number;
  size: number;
}

interface UseImageDBReturn {
  saveImage: (id: string, blob: Blob, filename: string) => Promise<void>;
  getImage: (id: string) => Promise<Blob | null>;
  deleteImage: (id: string) => Promise<void>;
  listImages: () => Promise<ImageRecord[]>;
  clearAll: () => Promise<void>;
  isSupported: boolean;
  error: string | null;
}

// IndexedDB inicializálás
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Képek tároló létrehozása
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('filename', 'filename', { unique: false });
      }
    };
  });
};

// Custom hook az IndexedDB képkezeléshez
export const useImageDB = (): UseImageDBReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'indexedDB' in window);

  useEffect(() => {
    if (!isSupported) {
      setError('IndexedDB nem támogatott ebben a böngészőben');
    }
  }, [isSupported]);

  const saveImage = useCallback(async (id: string, blob: Blob, filename: string): Promise<void> => {
    if (!isSupported) throw new Error('IndexedDB nem támogatott');
    
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const imageRecord: ImageRecord = {
        id,
        blob,
        filename,
        timestamp: Date.now(),
        size: blob.size
      };
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(imageRecord);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      setError(null);
    } catch (err) {
      const errorMsg = `Kép mentése sikertelen: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isSupported]);

  const getImage = useCallback(async (id: string): Promise<Blob | null> => {
    if (!isSupported) throw new Error('IndexedDB nem támogatott');
    
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const result = await new Promise<ImageRecord | null>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      setError(null);
      return result ? result.blob : null;
    } catch (err) {
      const errorMsg = `Kép betöltése sikertelen: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isSupported]);

  const deleteImage = useCallback(async (id: string): Promise<void> => {
    if (!isSupported) throw new Error('IndexedDB nem támogatott');
    
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      setError(null);
    } catch (err) {
      const errorMsg = `Kép törlése sikertelen: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isSupported]);

  const listImages = useCallback(async (): Promise<ImageRecord[]> => {
    if (!isSupported) throw new Error('IndexedDB nem támogatott');
    
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const result = await new Promise<ImageRecord[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      setError(null);
      return result;
    } catch (err) {
      const errorMsg = `Képek listázása sikertelen: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isSupported]);

  const clearAll = useCallback(async (): Promise<void> => {
    if (!isSupported) throw new Error('IndexedDB nem támogatott');
    
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      setError(null);
    } catch (err) {
      const errorMsg = `Összes kép törlése sikertelen: ${err instanceof Error ? err.message : 'Ismeretlen hiba'}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isSupported]);

  return {
    saveImage,
    getImage,
    deleteImage,
    listImages,
    clearAll,
    isSupported,
    error
  };
};

export default useImageDB;
