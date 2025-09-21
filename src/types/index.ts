export interface Flashcard {
	id: string;
	front: string;
	back: string;
	category?: string;
	createdAt: string;
	updatedAt: string;
	// Sync metadata
	serverId?: string; // Server-side ID when synced
	syncStatus: "pending" | "synced" | "conflict" | "error";
	lastSyncAt?: string;
	localChanges: boolean; // True if there are unsynced local changes
}

export interface SyncOperation {
	id: string;
	type: "CREATE" | "UPDATE" | "DELETE";
	entityType: "flashcard";
	entityId: string;
	data?: Partial<Flashcard>;
	timestamp: string;
	retryCount: number;
	lastError?: string;
}

export interface SyncMetadata {
	lastSyncAt?: string;
	pendingOperations: number;
	isOnline: boolean;
	isSyncing: boolean;
	lastError?: string;
}

export interface QuizAnswer {
	card: Flashcard;
	isCorrect: boolean;
	timestamp: string;
}

export interface QuizResult {
	totalCards: number;
	correctAnswers: number;
	percentage: number;
	answers: QuizAnswer[];
	completedAt: string;
}

export interface FlashcardFormData {
	front: string;
	back: string;
	category: string;
}

export type ViewMode = "grid" | "list";

export type TabValue = "cards" | "quiz" | "stats";
