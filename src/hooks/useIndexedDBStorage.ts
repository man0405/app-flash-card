"use client";

import { useState, useEffect, useCallback } from "react";
import { Flashcard, SyncOperation, SyncMetadata } from "@/types";
import { dbService } from "@/lib/indexeddb";
import { useOnlineStatus } from "./useOnlineStatus";

const sampleFlashcards: Flashcard[] = [
	{
		id: "1",
		front: "What is React?",
		back: "React is a JavaScript library for building user interfaces, particularly web applications.",
		category: "Programming",
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
		syncStatus: "synced",
		localChanges: false,
	},
	{
		id: "2",
		front: "Xin chào",
		back: "Hello",
		category: "Tiếng Anh",
		createdAt: "2024-01-02T00:00:00.000Z",
		updatedAt: "2024-01-02T00:00:00.000Z",
		syncStatus: "synced",
		localChanges: false,
	},
	{
		id: "3",
		front: "Cảm ơn",
		back: "Thank you",
		category: "Tiếng Anh",
		createdAt: "2024-01-03T00:00:00.000Z",
		updatedAt: "2024-01-03T00:00:00.000Z",
		syncStatus: "synced",
		localChanges: false,
	},
];

export function useFlashcardsWithSync() {
	const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [syncMetadata, setSyncMetadata] = useState<SyncMetadata>({
		pendingOperations: 0,
		isOnline: false,
		isSyncing: false,
	});
	const isOnline = useOnlineStatus();

	useEffect(() => {
		const initializeData = async () => {
			try {
				await dbService.initialize();

				const savedCards = await dbService.getAllFlashcards();

				if (savedCards.length > 0) {
					setFlashcards(savedCards);
				} else {
					const initialCards = sampleFlashcards.map((card) => ({
						...card,
						syncStatus: "pending" as const,
						localChanges: true,
					}));
					for (const card of initialCards) {
						await dbService.saveFlashcard(card);
					}
					setFlashcards(initialCards);
				}

				// Load sync metadata
				const metadata = await dbService.getSyncMetadata();
				setSyncMetadata({ ...metadata, isOnline });
			} catch (error) {
				console.error("Error initializing flashcards:", error);
				// Fallback to sample data in memory
				setFlashcards(sampleFlashcards);
			} finally {
				setIsLoading(false);
			}
		};

		initializeData();
	}, [isOnline]);

	// Queue sync operation
	const queueSyncOperation = useCallback(
		async (
			operation: Omit<SyncOperation, "id" | "timestamp" | "retryCount">
		) => {
			try {
				const syncOp: SyncOperation = {
					...operation,
					id: `${operation.type}_${operation.entityId}_${Date.now()}`,
					timestamp: new Date().toISOString(),
					retryCount: 0,
				};

				await dbService.addSyncOperation(syncOp);

				// Update sync metadata
				const currentMetadata = await dbService.getSyncMetadata();
				const updatedMetadata = {
					...currentMetadata,
					pendingOperations: currentMetadata.pendingOperations + 1,
					isOnline,
				};
				await dbService.setSyncMetadata(updatedMetadata);
				setSyncMetadata(updatedMetadata);
			} catch (error) {
				console.error("Error queuing sync operation:", error);
			}
		},
		[isOnline]
	);

	const addFlashcard = useCallback(
		async (
			cardData: Omit<
				Flashcard,
				"id" | "createdAt" | "updatedAt" | "syncStatus" | "localChanges"
			>
		) => {
			const newCard: Flashcard = {
				...cardData,
				id: `local_${Date.now()}`,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				syncStatus: "pending",
				localChanges: true,
			};

			try {
				// Save to IndexedDB first (Cache-First)
				await dbService.saveFlashcard(newCard);

				// Update local state
				setFlashcards((prev) => [...prev, newCard]);

				// Queue for sync
				await queueSyncOperation({
					type: "CREATE",
					entityType: "flashcard",
					entityId: newCard.id,
					data: newCard,
				});
			} catch (error) {
				console.error("Error adding flashcard:", error);
				// Still update state for user experience
				setFlashcards((prev) => [...prev, newCard]);
			}
		},
		[queueSyncOperation]
	);

	const updateFlashcard = useCallback(
		async (
			id: string,
			cardData: Omit<
				Flashcard,
				"id" | "createdAt" | "updatedAt" | "syncStatus" | "localChanges"
			>
		) => {
			try {
				// Get current card to preserve metadata
				const currentCard = await dbService.getFlashcard(id);
				if (!currentCard) {
					console.error("Card not found for update:", id);
					return;
				}

				const updatedCard: Flashcard = {
					...cardData,
					id,
					createdAt: currentCard.createdAt,
					updatedAt: new Date().toISOString(),
					syncStatus: "pending",
					localChanges: true,
					serverId: currentCard.serverId, // Preserve server ID
				};

				// Save to IndexedDB first (Cache-First)
				await dbService.saveFlashcard(updatedCard);

				// Update local state
				setFlashcards((prev) =>
					prev.map((card) => (card.id === id ? updatedCard : card))
				);

				// Queue for sync
				await queueSyncOperation({
					type: "UPDATE",
					entityType: "flashcard",
					entityId: id,
					data: updatedCard,
				});
			} catch (error) {
				console.error("Error updating flashcard:", error);
			}
		},
		[queueSyncOperation]
	);

	const deleteFlashcard = useCallback(
		async (id: string) => {
			try {
				// Remove from IndexedDB first (Cache-First)
				await dbService.deleteFlashcard(id);

				// Update local state
				setFlashcards((prev) => prev.filter((card) => card.id !== id));

				// Queue for sync
				await queueSyncOperation({
					type: "DELETE",
					entityType: "flashcard",
					entityId: id,
				});
			} catch (error) {
				console.error("Error deleting flashcard:", error);
				// Still update state for user experience
				setFlashcards((prev) => prev.filter((card) => card.id !== id));
			}
		},
		[queueSyncOperation]
	);

	const getCategories = useCallback(() => {
		return [...new Set(flashcards.map((card) => card.category || "Chung"))];
	}, [flashcards]);

	const refreshFromCache = useCallback(async () => {
		try {
			setIsLoading(true);
			const savedCards = await dbService.getAllFlashcards();
			setFlashcards(savedCards);

			const metadata = await dbService.getSyncMetadata();
			setSyncMetadata({ ...metadata, isOnline });
		} catch (error) {
			console.error("Error refreshing from cache:", error);
		} finally {
			setIsLoading(false);
		}
	}, [isOnline]);

	const getPendingOperations = useCallback(async () => {
		try {
			return await dbService.getPendingSyncOperations();
		} catch (error) {
			console.error("Error getting pending operations:", error);
			return [];
		}
	}, []);

	const markAsSynced = useCallback(async (id: string, serverId?: string) => {
		try {
			const card = await dbService.getFlashcard(id);
			if (card) {
				const syncedCard: Flashcard = {
					...card,
					syncStatus: "synced",
					localChanges: false,
					lastSyncAt: new Date().toISOString(),
					...(serverId && { serverId }),
				};

				await dbService.saveFlashcard(syncedCard);

				// Update local state
				setFlashcards((prev) =>
					prev.map((c) => (c.id === id ? syncedCard : c))
				);
			}
		} catch (error) {
			console.error("Error marking card as synced:", error);
		}
	}, []);

	return {
		flashcards,
		isLoading,
		syncMetadata,
		addFlashcard,
		updateFlashcard,
		deleteFlashcard,
		getCategories,
		refreshFromCache,
		getPendingOperations,
		markAsSynced,
	};
}

// Generic IndexedDB storage hook (Cache-First)
export function useIndexedDBStorage<T>(
	storeName: string,
	key: string,
	initialValue: T
) {
	const [storedValue, setStoredValue] = useState<T>(initialValue);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadValue = async () => {
			try {
				if (typeof window === "undefined") {
					setIsLoading(false);
					return;
				}

				await dbService.initialize();

				// Try to get from IndexedDB first
				const db = await dbService["ensureReady"]();
				const transaction = db.transaction([storeName], "readonly");
				const store = transaction.objectStore(storeName);
				const request = store.get(key);

				request.onsuccess = () => {
					const result = request.result;
					setStoredValue(result?.value || initialValue);
					setIsLoading(false);
				};

				request.onerror = () => {
					console.error(`Error loading ${key} from IndexedDB`);
					setStoredValue(initialValue);
					setIsLoading(false);
				};
			} catch (error) {
				console.error(`Error accessing IndexedDB for ${key}:`, error);
				setStoredValue(initialValue);
				setIsLoading(false);
			}
		};

		loadValue();
	}, [storeName, key, initialValue]);

	const setValue = useCallback(
		async (value: T | ((val: T) => T)) => {
			try {
				const valueToStore =
					value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);

				if (typeof window !== "undefined") {
					await dbService.initialize();
					const db = await dbService["ensureReady"]();
					const transaction = db.transaction([storeName], "readwrite");
					const store = transaction.objectStore(storeName);
					store.put({ key, value: valueToStore });
				}
			} catch (error) {
				console.error(`Error saving ${key} to IndexedDB:`, error);
				// Still update state for user experience
				const valueToStore =
					value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
			}
		},
		[storeName, key, storedValue]
	);

	const clearValue = useCallback(async () => {
		try {
			setStoredValue(initialValue);

			if (typeof window !== "undefined") {
				await dbService.initialize();
				const db = await dbService["ensureReady"]();
				const transaction = db.transaction([storeName], "readwrite");
				const store = transaction.objectStore(storeName);
				store.delete(key);
			}
		} catch (error) {
			console.error(`Error clearing ${key} from IndexedDB:`, error);
		}
	}, [storeName, key, initialValue]);

	return [storedValue, setValue, isLoading, clearValue] as const;
}
