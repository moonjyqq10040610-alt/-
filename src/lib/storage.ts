export interface BirthdayPhoto { id: string; blob: Blob; createdAt: string; age: number; }
const DATABASE = 'doodle-room-polaroids';
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Storage unavailable')); return; }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Storage is busy'));
  });
}
export async function saveBirthdayPhoto(photo: BirthdayPhoto) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').put(photo);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}
export async function latestBirthdayPhoto(): Promise<BirthdayPhoto | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('photos').objectStore('photos').getAll();
    request.onsuccess = () => { db.close(); const photos = request.result as BirthdayPhoto[]; photos.sort((a,b) => b.createdAt.localeCompare(a.createdAt)); resolve(photos[0] ?? null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
export async function deleteBirthdayPhoto(id: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('photos', 'readwrite');
    transaction.objectStore('photos').delete(id);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}
