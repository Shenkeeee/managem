export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TimeTrackerDB", 1); // Database name and version
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      db.createObjectStore("entries", { keyPath: "id", autoIncrement: true }); // Create an object store with an auto-incrementing key
    };
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

export function addEntry(entry) {
  return openDatabase().then((db) => {
    const transaction = db.transaction("entries", "readwrite");
    const store = transaction.objectStore("entries");

    // Convert to a plain object to handle the Proxy
    const entryData = JSON.parse(JSON.stringify(entry));
    store.add(entryData);
    return transaction.complete;
  });
}

export function getEntries() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("entries", "readonly");
      const store = transaction.objectStore("entries");
      const request = store.getAll();

      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  });
}

export function updateEntry(updatedEntry) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("entries", "readwrite");
      const store = transaction.objectStore("entries");

      // Convert to a plain object to handle the Proxy
      const entryData = JSON.parse(JSON.stringify(updatedEntry));
      const request = store.put(entryData);

      request.onsuccess = function () {
        resolve();
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  });
}

export function deleteEntry(id) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("entries", "readwrite");
      const store = transaction.objectStore("entries");
      const request = store.delete(id);

      request.onsuccess = function () {
        resolve();
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  });
}
