"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlashcardProps {
	id: string;
	front: string;
	back: string;
	category?: string;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export default function Flashcard({
	id,
	front,
	back,
	category = "Chung",
	onEdit,
	onDelete,
	className = "",
}: FlashcardProps) {
	const [isFlipped, setIsFlipped] = useState(false);
	const [showAnswer, setShowAnswer] = useState(false);

	const handleFlip = () => {
		setIsFlipped(!isFlipped);
		setShowAnswer(!showAnswer);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={cn("group", className)}
		>
			<Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-gray-200 ">
				<div className="absolute top-3 left-3 z-10">
					<Badge variant="secondary" className="bg-blue-100 text-blue-800 ">
						{category}
					</Badge>
				</div>

				<div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<div className="flex space-x-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onEdit?.(id)}
							className="h-8 w-8 p-0 bg-white/80 hover:bg-white "
						>
							<Edit className="w-3 h-3" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDelete?.(id)}
							className="h-8 w-8 p-0 bg-white/80 hover:bg-red-50 hover:text-red-600"
						>
							<Trash2 className="w-3 h-3" />
						</Button>
					</div>
				</div>

				<CardContent className="p-6 min-h-[200px] flex flex-col justify-center">
					<motion.div
						key={isFlipped ? "back" : "front"}
						initial={{ rotateY: 90, opacity: 0 }}
						animate={{ rotateY: 0, opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="text-center"
					>
						{!isFlipped ? (
							<div>
								<div className="text-sm text-gray-500 mb-2">Câu hỏi</div>
								<p className="text-lg font-medium text-gray-900 leading-relaxed">
									{front}
								</p>
							</div>
						) : (
							<div>
								<div className="text-sm text-gray-500 mb-2">Đáp án</div>
								<p className="text-lg font-medium text-gray-900 leading-relaxed">
									{back}
								</p>
							</div>
						)}
					</motion.div>

					<div className="mt-6 flex justify-center space-x-3">
						<Button
							variant="outline"
							onClick={handleFlip}
							className="flex items-center space-x-2"
						>
							{isFlipped ? (
								<EyeOff className="w-4 h-4" />
							) : (
								<Eye className="w-4 h-4" />
							)}
							<span>{isFlipped ? "Ẩn đáp án" : "Xem đáp án"}</span>
						</Button>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
