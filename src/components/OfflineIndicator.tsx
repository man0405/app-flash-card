"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineIndicator() {
	const isOnline = useOnlineStatus();

	if (isOnline) {
		return null;
	}

	return (
		<div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
			<Badge
				variant="destructive"
				className="flex items-center gap-2 px-3 py-2"
			>
				<WifiOff className="h-4 w-4" />
				<span className="text-sm font-medium">Offline Mode</span>
			</Badge>
		</div>
	);
}

export function OnlineStatusBadge() {
	const isOnline = useOnlineStatus();

	return (
		<Badge
			variant={isOnline ? "default" : "destructive"}
			className="flex items-center gap-2 px-2 py-1"
		>
			{isOnline ? (
				<>
					<Wifi className="h-3 w-3" />
					<span className="text-xs">Online</span>
				</>
			) : (
				<>
					<WifiOff className="h-3 w-3" />
					<span className="text-xs">Offline</span>
				</>
			)}
		</Badge>
	);
}
