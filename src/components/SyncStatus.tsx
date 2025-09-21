"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	RefreshCw,
	Wifi,
	WifiOff,
	AlertCircle,
	CheckCircle2,
	Clock,
	Settings,
	Trash2,
} from "lucide-react";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export function SyncStatusIndicator() {
	const { syncStats, getSyncStatusText, getSyncStatusColor } = useSyncStatus();

	const getIcon = () => {
		if (!syncStats.isOnline) return <WifiOff className="h-3 w-3" />;
		if (syncStats.isSyncing)
			return <RefreshCw className="h-3 w-3 animate-spin" />;
		if (syncStats.hasErrors) return <AlertCircle className="h-3 w-3" />;
		if (syncStats.pendingOperations > 0) return <Clock className="h-3 w-3" />;
		return <CheckCircle2 className="h-3 w-3" />;
	};

	const getVariant = () => {
		const color = getSyncStatusColor();
		switch (color) {
			case "red":
				return "destructive";
			case "orange":
				return "secondary";
			case "blue":
				return "default";
			case "green":
				return "default";
			default:
				return "secondary";
		}
	};

	return (
		<Badge variant={getVariant()} className="flex items-center gap-1 px-2 py-1">
			{getIcon()}
			<span className="text-xs">{getSyncStatusText()}</span>
		</Badge>
	);
}

export function SyncStatusDialog() {
	const [isOpen, setIsOpen] = useState(false);
	const {
		syncStats,
		autoSyncEnabled,
		retryFailedOperations,
		clearSyncQueue,
		enableAutoSync,
		forceSyncNow,
		getLastSyncDisplay,
		getSyncStatusText,
		getSyncStatusColor,
	} = useSyncStatus();

	const handleSync = async () => {
		try {
			await forceSyncNow();
		} catch (error) {
			console.error("Manual sync failed:", error);
		}
	};

	const handleRetryFailed = async () => {
		try {
			await retryFailedOperations();
		} catch (error) {
			console.error("Retry failed:", error);
		}
	};

	const handleClearQueue = async () => {
		if (
			confirm(
				"Are you sure you want to clear all pending sync operations? This cannot be undone."
			)
		) {
			try {
				await clearSyncQueue();
			} catch (error) {
				console.error("Clear queue failed:", error);
			}
		}
	};

	const toggleAutoSync = () => {
		enableAutoSync(!autoSyncEnabled);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 px-2">
					<SyncStatusIndicator />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<RefreshCw className="h-5 w-5" />
						Sync Status
					</DialogTitle>
					<DialogDescription>
						Manage data synchronization between device and server
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">Current Status</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Connection</span>
								<Badge variant={syncStats.isOnline ? "default" : "secondary"}>
									{syncStats.isOnline ? (
										<>
											<Wifi className="h-3 w-3 mr-1" />
											Online
										</>
									) : (
										<>
											<WifiOff className="h-3 w-3 mr-1" />
											Offline
										</>
									)}
								</Badge>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Sync Status</span>
								<Badge
									variant={
										getSyncStatusColor() === "green" ? "default" : "secondary"
									}
								>
									{getSyncStatusText()}
								</Badge>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Last Sync</span>
								<span className="text-sm">{getLastSyncDisplay()}</span>
							</div>

							{syncStats.pendingOperations > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Pending</span>
									<Badge variant="secondary">
										<Clock className="h-3 w-3 mr-1" />
										{syncStats.pendingOperations} operations
									</Badge>
								</div>
							)}

							{syncStats.hasErrors && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Errors</span>
									<Badge variant="destructive">
										<AlertCircle className="h-3 w-3 mr-1" />
										Sync errors detected
									</Badge>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleSync}
									disabled={!syncStats.isOnline || syncStats.isSyncing}
									className="flex items-center gap-2"
								>
									<RefreshCw
										className={`h-4 w-4 ${
											syncStats.isSyncing ? "animate-spin" : ""
										}`}
									/>
									{syncStats.isSyncing ? "Syncing..." : "Sync Now"}
								</Button>

								{syncStats.hasErrors && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleRetryFailed}
										disabled={!syncStats.isOnline || syncStats.isSyncing}
										className="flex items-center gap-2"
									>
										<RefreshCw className="h-4 w-4" />
										Retry Failed
									</Button>
								)}
							</div>

							<div className="flex items-center justify-between pt-2">
								<div className="flex items-center gap-2">
									<Settings className="h-4 w-4 text-gray-500" />
									<span className="text-sm text-gray-600">Auto Sync</span>
								</div>
								<Button
									variant={autoSyncEnabled ? "default" : "outline"}
									size="sm"
									onClick={toggleAutoSync}
								>
									{autoSyncEnabled ? "Enabled" : "Disabled"}
								</Button>
							</div>

							{(syncStats.pendingOperations > 0 || syncStats.hasErrors) && (
								<div className="pt-2 border-t">
									<Button
										variant="destructive"
										size="sm"
										onClick={handleClearQueue}
										className="w-full flex items-center gap-2"
									>
										<Trash2 className="h-4 w-4" />
										Clear Sync Queue
									</Button>
									<p className="text-xs text-gray-500 mt-1 text-center">
										This will remove all pending operations
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="pt-4">
							<div className="text-xs text-gray-500 space-y-1">
								<p>• Changes are automatically saved locally</p>
								<p>• Sync occurs automatically when online</p>
								<p>• Manual sync forces immediate synchronization</p>
								<p>• Failed operations are retried automatically</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
}
