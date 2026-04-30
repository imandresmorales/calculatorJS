/**
 * db.js — Improvement #33
 * Lightweight IndexedDB wrapper for the calculator.
 * Replaces localStorage for history and favorites to avoid storage quota limits.
 *
 * Public API (all methods return Promises):
 *   CalcDB.init()                  → open/upgrade DB
 *   CalcDB.addEntry(store, data)   → add record
 *   CalcDB.getAll(store)           → get all records (newest first)
 *   CalcDB.clear(store)            → delete all records
 *   CalcDB.delete(store, id)       → delete one record by key
 */
const CalcDB = (() => {
    const DB_NAME    = 'CalcPremiumDB';
    const DB_VERSION = 1;
    const STORES     = { history: 'history', favorites: 'favorites' };

    let db = null;

    /** Open (or upgrade) the database */
    function init() {
        if (db) return Promise.resolve(db);

        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = e => {
                const idb = e.target.result;

                if (!idb.objectStoreNames.contains(STORES.history)) {
                    const histStore = idb.createObjectStore(STORES.history, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    histStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!idb.objectStoreNames.contains(STORES.favorites)) {
                    idb.createObjectStore(STORES.favorites, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                }
            };

            req.onsuccess = e => {
                db = e.target.result;
                resolve(db);
            };

            req.onerror = e => reject(e.target.error);
        });
    }

    function getStore(storeName, mode) {
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    /** Add a record to a store. Returns the generated key. */
    function addEntry(storeName, data) {
        return init().then(() => new Promise((resolve, reject) => {
            const req = getStore(storeName, 'readwrite').add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = e => reject(e.target.error);
        }));
    }

    /** Get all records from a store, sorted by timestamp descending. */
    function getAll(storeName) {
        return init().then(() => new Promise((resolve, reject) => {
            const req = getStore(storeName, 'readonly').getAll();
            req.onsuccess = () => resolve((req.result || []).reverse());
            req.onerror   = e => reject(e.target.error);
        }));
    }

    /** Clear all records in a store. */
    function clear(storeName) {
        return init().then(() => new Promise((resolve, reject) => {
            const req = getStore(storeName, 'readwrite').clear();
            req.onsuccess = () => resolve();
            req.onerror   = e => reject(e.target.error);
        }));
    }

    /** Delete a single record by primary key. */
    function deleteEntry(storeName, id) {
        return init().then(() => new Promise((resolve, reject) => {
            const req = getStore(storeName, 'readwrite').delete(id);
            req.onsuccess = () => resolve();
            req.onerror   = e => reject(e.target.error);
        }));
    }

    return { init, addEntry, getAll, clear, delete: deleteEntry, STORES };
})();

window.CalcDB = CalcDB;
// Kick off the DB connection immediately so it's ready when history.js loads.
CalcDB.init().catch(() => {});
