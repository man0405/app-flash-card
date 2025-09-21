"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);

	useEffect(() => {
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowPrompt(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();

		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			console.log("User accepted the install prompt");
		} else {
			console.log("User dismissed the install prompt");
		}

		setDeferredPrompt(null);
		setShowPrompt(false);
	};

	const handleDismiss = () => {
		setShowPrompt(false);
	};

	if (!showPrompt || !deferredPrompt) {
		return null;
	}

	return (
		<Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm shadow-lg border-blue-200 bg-blue-50">
			<CardContent className="p-4">
				<div className="flex items-start justify-between space-x-3">
					<div className="flex-1">
						<h3 className="font-semibold text-blue-900">
							Install FlashCards App
						</h3>
						<p className="text-sm text-blue-700 mt-1">
							Add to your home screen for quick access and offline use
						</p>
						<div className="flex space-x-2 mt-3">
							<Button
								size="sm"
								onClick={handleInstallClick}
								className="bg-blue-600 hover:bg-blue-700"
							>
								<Download className="w-4 h-4 mr-2" />
								Install
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleDismiss}
								className="border-blue-300 text-blue-700 hover:bg-blue-100"
							>
								Not now
							</Button>
						</div>
					</div>
					<Button
						size="sm"
						variant="ghost"
						onClick={handleDismiss}
						className="text-blue-600 hover:bg-blue-100 p-1"
					>
						<X className="w-4 h-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
