"use client";

import { useState, useEffect, useCallback } from "react";
import { SyncMetadata } from "@/types";
import { dbService } from "@/lib/indexeddb";
import { syncQueueService } from "@/lib/syncQueue";
import { apiService } from "@/lib/apiService";
import { useOnlineStatus } from "./useOnlineStatus";

export interface SyncStats {
	pendingOperations: number;
	lastSyncAt?: string;
	isSyncing: boolean;
	hasErrors: boolean;
	isOnline: boolean;
	nextSyncIn?: number; // seconds until next auto-sync
}

export function useSyncStatus() {
	const [syncStats, setSyncStats] = useState<SyncStats>({
		pendingOperations: 0,
		isSyncing: false,
		hasErrors: false,
		isOnline: false,
	});

	const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
	const [autoSyncInterval, setAutoSyncInterval] = useState(30000); // 30 seconds
	const isOnline = useOnlineStatus();

	const loadSyncStats = useCallback(async () => {
		try {
			const stats = await syncQueueService.getSyncStats();
			setSyncStats((prev) => ({
				...prev,
				...stats,
				isOnline,
			}));
		} catch (error) {
			console.error("Error loading sync stats:", error);
		}
	}, [isOnline]);

	const performSync = useCallback(async (): Promise<{
		success: number;
		failed: number;
	}> => {
		if (!isOnline) {
			console.log("Cannot sync: offline");
			return { success: 0, failed: 0 };
		}

		try {
			setSyncStats((prev) => ({ ...prev, isSyncing: true }));

			// Process the sync queue
			const result = await syncQueueService.processSyncQueue(apiService);

			// Update stats after sync
			await loadSyncStats();

			return result;
		} catch (error) {
			console.error("Sync failed:", error);
			setSyncStats((prev) => ({ ...prev, hasErrors: true }));
			return { success: 0, failed: 1 };
		} finally {
			setSyncStats((prev) => ({ ...prev, isSyncing: false }));
		}
	}, [isOnline, loadSyncStats]);

	// Auto-sync timer
	useEffect(() => {
		if (!autoSyncEnabled || !isOnline) return;

		const interval = setInterval(async () => {
			if (!syncQueueService.isSyncing) {
				await performSync();
			}
		}, autoSyncInterval);

		return () => clearInterval(interval);
	}, [autoSyncEnabled, autoSyncInterval, isOnline, performSync]);

	// Load initial sync stats
	useEffect(() => {
		loadSyncStats();
	}, [loadSyncStats]);

	// Update sync stats when online status changes
	useEffect(() => {
		setSyncStats((prev) => ({ ...prev, isOnline }));

		// Trigger sync when coming online
		if (isOnline && autoSyncEnabled && !syncQueueService.isSyncing) {
			performSync();
		}
	}, [isOnline, autoSyncEnabled, performSync]);

	const retryFailedOperations = useCallback(async (): Promise<{
		success: number;
		failed: number;
	}> => {
		if (!isOnline) {
			console.log("Cannot retry: offline");
			return { success: 0, failed: 0 };
		}

		try {
			setSyncStats((prev) => ({ ...prev, isSyncing: true }));

			const result = await syncQueueService.retryFailedOperations(apiService);

			// Update stats after retry
			await loadSyncStats();

			return result;
		} catch (error) {
			console.error("Retry failed:", error);
			return { success: 0, failed: 1 };
		} finally {
			setSyncStats((prev) => ({ ...prev, isSyncing: false }));
		}
	}, [isOnline, loadSyncStats]);

	const clearSyncQueue = useCallback(async () => {
		try {
			await syncQueueService.clearSyncQueue();
			await loadSyncStats();
		} catch (error) {
			console.error("Error clearing sync queue:", error);
		}
	}, [loadSyncStats]);

	const enableAutoSync = useCallback((enabled: boolean, interval?: number) => {
		setAutoSyncEnabled(enabled);
		if (interval) {
			setAutoSyncInterval(interval);
		}
	}, []);

	const forceSyncNow = useCallback(async () => {
		if (syncQueueService.isSyncing) {
			console.log("Sync already in progress");
			return { success: 0, failed: 0 };
		}

		return performSync();
	}, [performSync]);

	const getSyncMetadata = useCallback(async (): Promise<SyncMetadata> => {
		try {
			return await dbService.getSyncMetadata();
		} catch (error) {
			console.error("Error getting sync metadata:", error);
			return {
				pendingOperations: 0,
				isOnline: false,
				isSyncing: false,
			};
		}
	}, []);

	const updateSyncMetadata = useCallback(
		async (metadata: Partial<SyncMetadata>) => {
			try {
				const current = await dbService.getSyncMetadata();
				const updated = { ...current, ...metadata };
				await dbService.setSyncMetadata(updated);
				await loadSyncStats();
			} catch (error) {
				console.error("Error updating sync metadata:", error);
			}
		},
		[loadSyncStats]
	);

	// Format last sync time for display
	const getLastSyncDisplay = useCallback(() => {
		if (!syncStats.lastSyncAt) return "Never";

		const lastSync = new Date(syncStats.lastSyncAt);
		const now = new Date();
		const diffMs = now.getTime() - lastSync.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays === 1) return "Yesterday";
		return `${diffDays} days ago`;
	}, [syncStats.lastSyncAt]);

	// Get sync status text for UI
	const getSyncStatusText = useCallback(() => {
		if (!isOnline) return "Offline";
		if (syncStats.isSyncing) return "Syncing...";
		if (syncStats.hasErrors) return "Sync errors";
		if (syncStats.pendingOperations > 0)
			return `${syncStats.pendingOperations} pending`;
		return "Synced";
	}, [isOnline, syncStats]);

	// Get sync status color for UI
	const getSyncStatusColor = useCallback(() => {
		if (!isOnline) return "gray";
		if (syncStats.isSyncing) return "blue";
		if (syncStats.hasErrors) return "red";
		if (syncStats.pendingOperations > 0) return "orange";
		return "green";
	}, [isOnline, syncStats]);

	return {
		syncStats,
		autoSyncEnabled,
		autoSyncInterval,
		performSync,
		retryFailedOperations,
		clearSyncQueue,
		enableAutoSync,
		forceSyncNow,
		getSyncMetadata,
		updateSyncMetadata,
		getLastSyncDisplay,
		getSyncStatusText,
		getSyncStatusColor,
		loadSyncStats,
	};
}
