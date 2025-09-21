"use client";

import { Flashcard, SyncOperation, SyncMetadata } from "@/types";

const DB_NAME = "FlashcardApp";
const DB_VERSION = 1;

// Store names
const STORES = {
	FLASHCARDS: "flashcards",
	SYNC_OPERATIONS: "syncOperations",
	SYNC_METADATA: "syncMetadata",
} as const;

class IndexedDBService {
	private db: IDBDatabase | null = null;
	private initPromise: Promise<void> | null = null;

	async initialize(): Promise<void> {
		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = new Promise((resolve, reject) => {
			if (typeof window === "undefined") {
				reject(new Error("IndexedDB not available in SSR"));
				return;
			}

			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(new Error("Failed to open IndexedDB"));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create flashcards store
				if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
					const flashcardsStore = db.createObjectStore(STORES.FLASHCARDS, {
						keyPath: "id",
					});
					flashcardsStore.createIndex("category", "category", {
						unique: false,
					});
					flashcardsStore.createIndex("syncStatus", "syncStatus", {
						unique: false,
					});
					flashcardsStore.createIndex("serverId", "serverId", {
						unique: false,
					});
					flashcardsStore.createIndex("updatedAt", "updatedAt", {
						unique: false,
					});
				}

				// Create sync operations store
				if (!db.objectStoreNames.contains(STORES.SYNC_OPERATIONS)) {
					const syncStore = db.createObjectStore(STORES.SYNC_OPERATIONS, {
						keyPath: "id",
					});
					syncStore.createIndex("type", "type", { unique: false });
					syncStore.createIndex("entityId", "entityId", { unique: false });
					syncStore.createIndex("timestamp", "timestamp", { unique: false });
				}

				// Create sync metadata store
				if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
					db.createObjectStore(STORES.SYNC_METADATA, { keyPath: "key" });
				}
			};
		});

		return this.initPromise;
	}

	private async ensureReady(): Promise<IDBDatabase> {
		await this.initialize();
		if (!this.db) {
			throw new Error("Database not initialized");
		}
		return this.db;
	}

	// Flashcards operations
	async getAllFlashcards(): Promise<Flashcard[]> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.FLASHCARDS], "readonly");
			const store = transaction.objectStore(STORES.FLASHCARDS);
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async getFlashcard(id: string): Promise<Flashcard | null> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.FLASHCARDS], "readonly");
			const store = transaction.objectStore(STORES.FLASHCARDS);
			const request = store.get(id);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async saveFlashcard(flashcard: Flashcard): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.FLASHCARDS], "readwrite");
			const store = transaction.objectStore(STORES.FLASHCARDS);
			const request = store.put(flashcard);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async deleteFlashcard(id: string): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.FLASHCARDS], "readwrite");
			const store = transaction.objectStore(STORES.FLASHCARDS);
			const request = store.delete(id);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getFlashcardsByCategory(category: string): Promise<Flashcard[]> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.FLASHCARDS], "readonly");
			const store = transaction.objectStore(STORES.FLASHCARDS);
			const index = store.index("category");
			const request = index.getAll(category);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async getUnsyncedFlashcards(): Promise<Flashcard[]> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.FLASHCARDS], "readonly");
			const store = transaction.objectStore(STORES.FLASHCARDS);
			const index = store.index("syncStatus");
			const request = index.getAll("pending");

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	// Sync operations
	async addSyncOperation(operation: SyncOperation): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.SYNC_OPERATIONS], "readwrite");
			const store = transaction.objectStore(STORES.SYNC_OPERATIONS);
			const request = store.put(operation);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getPendingSyncOperations(): Promise<SyncOperation[]> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.SYNC_OPERATIONS], "readonly");
			const store = transaction.objectStore(STORES.SYNC_OPERATIONS);
			const request = store.getAll();

			request.onsuccess = () => {
				const operations = request.result || [];
				// Sort by timestamp (oldest first)
				operations.sort(
					(a, b) =>
						new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
				);
				resolve(operations);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async removeSyncOperation(id: string): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.SYNC_OPERATIONS], "readwrite");
			const store = transaction.objectStore(STORES.SYNC_OPERATIONS);
			const request = store.delete(id);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async clearSyncOperations(): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.SYNC_OPERATIONS], "readwrite");
			const store = transaction.objectStore(STORES.SYNC_OPERATIONS);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// Sync metadata
	async getSyncMetadata(): Promise<SyncMetadata> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.SYNC_METADATA], "readonly");
			const store = transaction.objectStore(STORES.SYNC_METADATA);
			const request = store.get("global");

			request.onsuccess = () => {
				const result = request.result;
				resolve(
					result?.value || {
						pendingOperations: 0,
						isOnline: navigator.onLine,
						isSyncing: false,
					}
				);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async setSyncMetadata(metadata: SyncMetadata): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.SYNC_METADATA], "readwrite");
			const store = transaction.objectStore(STORES.SYNC_METADATA);
			const request = store.put({ key: "global", value: metadata });

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// Utility methods
	async clearAllData(): Promise<void> {
		const db = await this.ensureReady();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(
				[STORES.FLASHCARDS, STORES.SYNC_OPERATIONS, STORES.SYNC_METADATA],
				"readwrite"
			);

			let completed = 0;
			const stores = [
				STORES.FLASHCARDS,
				STORES.SYNC_OPERATIONS,
				STORES.SYNC_METADATA,
			];

			const checkComplete = () => {
				completed++;
				if (completed === stores.length) {
					resolve();
				}
			};

			stores.forEach((storeName) => {
				const store = transaction.objectStore(storeName);
				const request = store.clear();
				request.onsuccess = checkComplete;
				request.onerror = () => reject(request.error);
			});
		});
	}

	async close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.initPromise = null;
		}
	}
}

// Create singleton instance
export const dbService = new IndexedDBService();
