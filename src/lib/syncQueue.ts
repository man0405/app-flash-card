"use client";

import { SyncOperation, SyncMetadata, Flashcard } from "@/types";
import { dbService } from "@/lib/indexeddb";

export interface SyncConfig {
	maxRetries: number;
	retryDelay: number;
	batchSize: number;
}

export interface ApiService {
	createFlashcard: (data: Partial<Flashcard>) => Promise<{ id: string }>;
	updateFlashcard: (id: string, data: Partial<Flashcard>) => Promise<void>;
	deleteFlashcard: (id: string) => Promise<void>;
}

export interface SyncConfig {
	maxRetries: number;
	retryDelay: number;
	batchSize: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
	maxRetries: 3,
	retryDelay: 1000, // 1 second
	batchSize: 10,
};

class SyncQueueService {
	private config: SyncConfig;
	private isProcessing = false;

	constructor(config: SyncConfig = DEFAULT_SYNC_CONFIG) {
		this.config = config;
	}

	/**
	 * Process all pending sync operations
	 * Implements retry logic and batch processing
	 */
	async processSyncQueue(
		apiService?: ApiService
	): Promise<{ success: number; failed: number }> {
		if (this.isProcessing) {
			console.log("Sync already in progress");
			return { success: 0, failed: 0 };
		}

		this.isProcessing = true;
		let successCount = 0;
		let failedCount = 0;

		try {
			// Update sync metadata - start syncing
			await this.updateSyncStatus(true);

			const pendingOperations = await dbService.getPendingSyncOperations();
			console.log(`Processing ${pendingOperations.length} pending operations`);

			// Process operations in batches
			for (
				let i = 0;
				i < pendingOperations.length;
				i += this.config.batchSize
			) {
				const batch = pendingOperations.slice(i, i + this.config.batchSize);

				for (const operation of batch) {
					try {
						const success = await this.processOperation(operation, apiService);
						if (success) {
							successCount++;
							await dbService.removeSyncOperation(operation.id);
						} else {
							failedCount++;
							await this.handleFailedOperation(operation);
						}
					} catch (error) {
						console.error("Error processing operation:", error);
						failedCount++;
						await this.handleFailedOperation(
							operation,
							error instanceof Error ? error : new Error(String(error))
						);
					}
				}

				// Small delay between batches to prevent overwhelming the server
				await this.delay(100);
			}

			// Update sync metadata
			await this.updateSyncMetadata(successCount, failedCount);
		} catch (error) {
			console.error("Error processing sync queue:", error);
		} finally {
			this.isProcessing = false;
			await this.updateSyncStatus(false);
		}

		return { success: successCount, failed: failedCount };
	}

	/**
	 * Process a single sync operation
	 */
	private async processOperation(
		operation: SyncOperation,
		apiService?: ApiService
	): Promise<boolean> {
		if (!apiService) {
			// If no API service provided, simulate success for testing
			console.log(
				"Simulating sync operation:",
				operation.type,
				operation.entityId
			);
			await this.delay(100); // Simulate network delay
			return true;
		}

		try {
			switch (operation.type) {
				case "CREATE":
					if (!operation.data) {
						console.error("No data provided for CREATE operation");
						return false;
					}
					const created = await apiService.createFlashcard(operation.data);
					if (created && operation.data) {
						// Update local card with server ID
						await this.updateLocalCardAfterSync(operation.entityId, created.id);
					}
					return true;

				case "UPDATE":
					if (!operation.data) {
						console.error("No data provided for UPDATE operation");
						return false;
					}
					await apiService.updateFlashcard(operation.entityId, operation.data);
					await this.markCardAsSynced(operation.entityId);
					return true;

				case "DELETE":
					await apiService.deleteFlashcard(operation.entityId);
					return true;

				default:
					console.error("Unknown operation type:", operation.type);
					return false;
			}
		} catch (error) {
			console.error("API call failed for operation:", operation.id, error);
			return false;
		}
	}

	/**
	 * Handle failed operations with retry logic
	 */
	private async handleFailedOperation(
		operation: SyncOperation,
		error?: Error
	): Promise<void> {
		const updatedOperation: SyncOperation = {
			...operation,
			retryCount: operation.retryCount + 1,
			lastError: error?.message || "Unknown error",
		};

		if (updatedOperation.retryCount < this.config.maxRetries) {
			// Schedule for retry
			await dbService.addSyncOperation(updatedOperation);
			console.log(
				`Operation ${operation.id} scheduled for retry (${updatedOperation.retryCount}/${this.config.maxRetries})`
			);
		} else {
			// Mark operation as permanently failed
			console.error(
				`Operation ${operation.id} failed permanently after ${this.config.maxRetries} retries`
			);

			// You might want to:
			// 1. Save to a "failed operations" store for manual review
			// 2. Mark the local entity with an error status
			// 3. Notify the user

			await this.markEntityAsError(operation.entityId);
		}
	}

	/**
	 * Update local flashcard after successful server sync
	 */
	private async updateLocalCardAfterSync(
		localId: string,
		serverId: string
	): Promise<void> {
		try {
			const card = await dbService.getFlashcard(localId);
			if (card) {
				const syncedCard: Flashcard = {
					...card,
					serverId,
					syncStatus: "synced",
					localChanges: false,
					lastSyncAt: new Date().toISOString(),
				};
				await dbService.saveFlashcard(syncedCard);
			}
		} catch (error) {
			console.error("Error updating local card after sync:", error);
		}
	}

	/**
	 * Mark card as synced
	 */
	private async markCardAsSynced(cardId: string): Promise<void> {
		try {
			const card = await dbService.getFlashcard(cardId);
			if (card) {
				const syncedCard: Flashcard = {
					...card,
					syncStatus: "synced",
					localChanges: false,
					lastSyncAt: new Date().toISOString(),
				};
				await dbService.saveFlashcard(syncedCard);
			}
		} catch (error) {
			console.error("Error marking card as synced:", error);
		}
	}

	/**
	 * Mark entity as having sync error
	 */
	private async markEntityAsError(entityId: string): Promise<void> {
		try {
			const card = await dbService.getFlashcard(entityId);
			if (card) {
				const errorCard: Flashcard = {
					...card,
					syncStatus: "error",
				};
				await dbService.saveFlashcard(errorCard);
			}
		} catch (error) {
			console.error("Error marking entity as error:", error);
		}
	}

	/**
	 * Update sync status in metadata
	 */
	private async updateSyncStatus(isSyncing: boolean): Promise<void> {
		try {
			const metadata = await dbService.getSyncMetadata();
			const updatedMetadata: SyncMetadata = {
				...metadata,
				isSyncing,
				isOnline: navigator.onLine,
			};
			await dbService.setSyncMetadata(updatedMetadata);
		} catch (error) {
			console.error("Error updating sync status:", error);
		}
	}

	/**
	 * Update sync metadata after processing
	 */
	private async updateSyncMetadata(
		successCount: number,
		failedCount: number
	): Promise<void> {
		try {
			const metadata = await dbService.getSyncMetadata();
			const updatedMetadata: SyncMetadata = {
				...metadata,
				lastSyncAt: new Date().toISOString(),
				pendingOperations: Math.max(
					0,
					metadata.pendingOperations - successCount
				),
				isSyncing: false,
				isOnline: navigator.onLine,
				...(failedCount > 0 && {
					lastError: `${failedCount} operations failed`,
				}),
			};
			await dbService.setSyncMetadata(updatedMetadata);
		} catch (error) {
			console.error("Error updating sync metadata:", error);
		}
	}

	/**
	 * Get sync statistics
	 */
	async getSyncStats(): Promise<{
		pendingOperations: number;
		lastSyncAt?: string;
		isSyncing: boolean;
		hasErrors: boolean;
	}> {
		try {
			const [metadata, operations] = await Promise.all([
				dbService.getSyncMetadata(),
				dbService.getPendingSyncOperations(),
			]);

			const hasErrors = operations.some(
				(op) => op.retryCount >= this.config.maxRetries
			);

			return {
				pendingOperations: operations.length,
				lastSyncAt: metadata.lastSyncAt,
				isSyncing: metadata.isSyncing,
				hasErrors,
			};
		} catch (error) {
			console.error("Error getting sync stats:", error);
			return {
				pendingOperations: 0,
				isSyncing: false,
				hasErrors: false,
			};
		}
	}

	/**
	 * Clear all sync operations (for reset/development)
	 */
	async clearSyncQueue(): Promise<void> {
		try {
			await dbService.clearSyncOperations();

			const metadata = await dbService.getSyncMetadata();
			const updatedMetadata: SyncMetadata = {
				...metadata,
				pendingOperations: 0,
				lastError: undefined,
			};
			await dbService.setSyncMetadata(updatedMetadata);
		} catch (error) {
			console.error("Error clearing sync queue:", error);
		}
	}

	/**
	 * Retry failed operations
	 */
	async retryFailedOperations(
		apiService?: ApiService
	): Promise<{ success: number; failed: number }> {
		const operations = await dbService.getPendingSyncOperations();
		const failedOperations = operations.filter((op) => op.retryCount > 0);

		console.log(`Retrying ${failedOperations.length} failed operations`);

		for (const operation of failedOperations) {
			// Reset retry count for manual retry
			const resetOperation: SyncOperation = {
				...operation,
				retryCount: 0,
				lastError: undefined,
			};

			await dbService.addSyncOperation(resetOperation);
		}

		// Process the queue normally
		return this.processSyncQueue(apiService);
	}

	/**
	 * Utility delay function
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Check if sync is currently in progress
	 */
	get isSyncing(): boolean {
		return this.isProcessing;
	}
}

// Create singleton instance
export const syncQueueService = new SyncQueueService();
