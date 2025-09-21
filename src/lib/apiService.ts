"use client";

import { Flashcard } from "@/types";
import { ApiService } from "@/lib/syncQueue";

export interface ApiConfig {
	baseUrl: string;
	apiKey?: string;
	timeout: number;
	retryAttempts: number;
	retryDelay: number;
}

export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	success: boolean;
	status: number;
}

const DEFAULT_CONFIG: ApiConfig = {
	baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
	timeout: 10000, // 10 seconds
	retryAttempts: 3,
	retryDelay: 1000, // 1 second
};

class FlashcardApiService implements ApiService {
	private config: ApiConfig;

	constructor(config: Partial<ApiConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Generic fetch wrapper with retry logic and error handling
	 */
	private async fetchWithRetry<T>(
		endpoint: string,
		options: RequestInit = {},
		attempt = 1
	): Promise<ApiResponse<T>> {
		const url = `${this.config.baseUrl}${endpoint}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				...((options.headers as Record<string, string>) || {}),
			};

			if (this.config.apiKey) {
				headers["Authorization"] = `Bearer ${this.config.apiKey}`;
			}

			const response = await fetch(url, {
				...options,
				headers,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const responseData = response.headers
				.get("content-type")
				?.includes("application/json")
				? await response.json()
				: await response.text();

			if (!response.ok) {
				// Handle specific HTTP errors
				if (response.status === 401) {
					throw new Error("Unauthorized - Invalid API key");
				}
				if (response.status === 404) {
					throw new Error("Resource not found");
				}
				if (response.status >= 500) {
					throw new Error("Server error - please try again later");
				}

				throw new Error(
					responseData?.message ||
						`HTTP ${response.status}: ${response.statusText}`
				);
			}

			return {
				data: responseData,
				success: true,
				status: response.status,
			};
		} catch (error) {
			clearTimeout(timeoutId);

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";

			// Check if we should retry
			if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
				console.log(
					`API call failed (attempt ${attempt}/${this.config.retryAttempts}): ${errorMessage}`
				);
				await this.delay(this.config.retryDelay * attempt); // Exponential backoff
				return this.fetchWithRetry<T>(endpoint, options, attempt + 1);
			}

			return {
				error: errorMessage,
				success: false,
				status: 0,
			};
		}
	}

	/**
	 * Determine if an error should trigger a retry
	 */
	private shouldRetry(error: unknown): boolean {
		if (error instanceof Error) {
			// Don't retry on authentication or client errors
			if (
				error.message.includes("Unauthorized") ||
				error.message.includes("Invalid API key")
			) {
				return false;
			}
			// Don't retry on 404s
			if (error.message.includes("not found")) {
				return false;
			}
			// Retry on network errors, timeouts, and server errors
			return (
				error.name === "AbortError" ||
				error.message.includes("NetworkError") ||
				error.message.includes("Server error")
			);
		}
		return true; // Retry unknown errors
	}

	/**
	 * Utility delay function
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// API Methods implementing ApiService interface

	/**
	 * Create a new flashcard
	 */
	async createFlashcard(data: Partial<Flashcard>): Promise<{ id: string }> {
		const response = await this.fetchWithRetry<{ id: string }>("/flashcards", {
			method: "POST",
			body: JSON.stringify(data),
		});

		if (!response.success || !response.data) {
			throw new Error(response.error || "Failed to create flashcard");
		}

		return response.data;
	}

	/**
	 * Update an existing flashcard
	 */
	async updateFlashcard(id: string, data: Partial<Flashcard>): Promise<void> {
		const response = await this.fetchWithRetry(`/flashcards/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to update flashcard");
		}
	}

	/**
	 * Delete a flashcard
	 */
	async deleteFlashcard(id: string): Promise<void> {
		const response = await this.fetchWithRetry(`/flashcards/${id}`, {
			method: "DELETE",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to delete flashcard");
		}
	}

	/**
	 * Get all flashcards from server
	 */
	async getAllFlashcards(): Promise<Flashcard[]> {
		const response = await this.fetchWithRetry<Flashcard[]>("/flashcards");

		if (!response.success || !response.data) {
			throw new Error(response.error || "Failed to fetch flashcards");
		}

		return response.data;
	}

	/**
	 * Get a single flashcard by ID
	 */
	async getFlashcard(id: string): Promise<Flashcard> {
		const response = await this.fetchWithRetry<Flashcard>(`/flashcards/${id}`);

		if (!response.success || !response.data) {
			throw new Error(response.error || "Failed to fetch flashcard");
		}

		return response.data;
	}

	/**
	 * Sync local changes with server
	 * This method handles the full sync process
	 */
	async syncFlashcards(localFlashcards: Flashcard[]): Promise<{
		synced: Flashcard[];
		conflicts: Array<{ local: Flashcard; server: Flashcard }>;
		errors: Array<{ flashcard: Flashcard; error: string }>;
	}> {
		try {
			// Get all flashcards from server
			const serverFlashcards = await this.getAllFlashcards();

			const synced: Flashcard[] = [];
			const conflicts: Array<{ local: Flashcard; server: Flashcard }> = [];
			const errors: Array<{ flashcard: Flashcard; error: string }> = [];

			// Process each local flashcard
			for (const localCard of localFlashcards) {
				try {
					if (localCard.syncStatus === "synced" && !localCard.localChanges) {
						// Already synced, skip
						continue;
					}

					const serverCard = serverFlashcards.find(
						(sc) => sc.id === localCard.serverId || sc.id === localCard.id
					);

					if (!serverCard) {
						// New card, create on server
						if (localCard.serverId) {
							// Card was deleted on server, handle conflict
							// Create a placeholder server card for conflict resolution
							const placeholderServerCard: Flashcard = {
								...localCard,
								id: localCard.serverId,
								syncStatus: "synced",
								localChanges: false,
							};
							conflicts.push({
								local: localCard,
								server: placeholderServerCard,
							});
						} else {
							// Create new card
							const created = await this.createFlashcard(localCard);
							synced.push({
								...localCard,
								serverId: created.id,
								syncStatus: "synced",
								localChanges: false,
								lastSyncAt: new Date().toISOString(),
							});
						}
					} else {
						// Card exists on server, check for conflicts
						const serverUpdatedAt = new Date(serverCard.updatedAt);
						const localUpdatedAt = new Date(localCard.updatedAt);

						if (localCard.localChanges && serverUpdatedAt > localUpdatedAt) {
							// Conflict: both local and server have changes
							conflicts.push({ local: localCard, server: serverCard });
						} else if (localCard.localChanges) {
							// Local changes are newer, update server
							await this.updateFlashcard(serverCard.id, localCard);
							synced.push({
								...localCard,
								serverId: serverCard.id,
								syncStatus: "synced",
								localChanges: false,
								lastSyncAt: new Date().toISOString(),
							});
						} else {
							// Server is newer, update local
							synced.push({
								...serverCard,
								id: localCard.id, // Keep local ID
								serverId: serverCard.id,
								syncStatus: "synced",
								localChanges: false,
								lastSyncAt: new Date().toISOString(),
							});
						}
					}
				} catch (error) {
					errors.push({
						flashcard: localCard,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return { synced, conflicts, errors };
		} catch (error) {
			throw new Error(
				`Sync failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	/**
	 * Check server connectivity
	 */
	async ping(): Promise<boolean> {
		try {
			const response = await this.fetchWithRetry("/health");
			return response.success;
		} catch {
			return false;
		}
	}

	/**
	 * Update API configuration
	 */
	updateConfig(config: Partial<ApiConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): ApiConfig {
		return { ...this.config };
	}
}

// Create singleton instance
export const apiService = new FlashcardApiService();

// Export for testing or custom configurations
export { FlashcardApiService };
