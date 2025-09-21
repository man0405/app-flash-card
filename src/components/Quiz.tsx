"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	Trophy,
	Brain,
	ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard } from "@/types";

interface QuizProps {
	flashcards: Flashcard[];
	onClose: () => void;
}

export default function Quiz({ flashcards = [], onClose }: QuizProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showAnswer, setShowAnswer] = useState(false);
	const [score, setScore] = useState(0);
	const [answered, setAnswered] = useState(0);
	const [quizCards, setQuizCards] = useState<Flashcard[]>([]);
	const [isCompleted, setIsCompleted] = useState(false);

	useEffect(() => {
		if (flashcards.length > 0) {
			const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
			setQuizCards(shuffled);
		}
	}, [flashcards]);

	const currentCard = quizCards[currentIndex];
	const progress =
		quizCards.length > 0 ? (answered / quizCards.length) * 100 : 0;

	const handleShowAnswer = () => {
		setShowAnswer(true);
	};

	const handleAnswer = (isCorrect: boolean) => {
		if (isCorrect) {
			setScore((prev) => prev + 1);
		}

		setAnswered((prev) => prev + 1);
		setShowAnswer(false);

		if (currentIndex + 1 >= quizCards.length) {
			setIsCompleted(true);
		} else {
			setCurrentIndex((prev) => prev + 1);
		}
	};

	const handleRestart = () => {
		setCurrentIndex(0);
		setShowAnswer(false);
		setScore(0);
		setAnswered(0);
		setIsCompleted(false);
		const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
		setQuizCards(shuffled);
	};

	if (flashcards.length === 0) {
		return (
			<div className="text-center py-12">
				<Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
				<h3 className="text-xl font-semibold text-gray-900 mb-2">
					Không có thẻ học nào
				</h3>
				<p className="text-gray-600 mb-6">
					Hãy thêm một số thẻ học trước khi bắt đầu quiz
				</p>
				<Button onClick={onClose} variant="outline">
					Quay lại
				</Button>
			</div>
		);
	}

	if (isCompleted) {
		const percentage = Math.round((score / quizCards.length) * 100);
		const getScoreColor = () => {
			if (percentage >= 80) return "text-green-600 ";
			if (percentage >= 60) return "text-yellow-600 ";
			return "text-red-600 ";
		};

		const getScoreMessage = () => {
			if (percentage >= 90) return "Xuất sắc! 🎉";
			if (percentage >= 80) return "Rất tốt! 👏";
			if (percentage >= 70) return "Tốt! 👍";
			if (percentage >= 60) return "Khá! 😊";
			return "Cần cố gắng thêm! 💪";
		};

		const getBadgeVariant = () => {
			if (percentage >= 80) return "default";
			if (percentage >= 60) return "secondary";
			return "destructive";
		};

		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="max-w-2xl mx-auto"
			>
				<Card className="text-center">
					<CardHeader>
						<div className="flex justify-center mb-4">
							<Trophy className="w-16 h-16 text-yellow-500" />
						</div>
						<CardTitle className="text-2xl mb-2">Quiz hoàn thành!</CardTitle>
						<p className="text-lg text-muted-foreground">{getScoreMessage()}</p>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
							<div className="text-4xl font-bold mb-2">
								<span className={getScoreColor()}>{score}</span>
								<span className="text-gray-400">/{quizCards.length}</span>
							</div>
							<Badge variant={getBadgeVariant()} className="text-lg px-4 py-2">
								{percentage}%
							</Badge>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="text-center p-4 bg-green-50 rounded-lg">
								<CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
								<div className="text-2xl font-bold text-green-600">{score}</div>
								<div className="text-sm text-green-800 ">Đúng</div>
							</div>
							<div className="text-center p-4 bg-red-50 rounded-lg">
								<XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
								<div className="text-2xl font-bold text-red-600">
									{quizCards.length - score}
								</div>
								<div className="text-sm text-red-800 ">Sai</div>
							</div>
						</div>

						<div className="flex space-x-4">
							<Button onClick={handleRestart} className="flex-1">
								<RotateCcw className="w-4 h-4 mr-2" />
								Làm lại Quiz
							</Button>
							<Button onClick={onClose} variant="outline" className="flex-1">
								Quay lại danh sách
							</Button>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center mb-2">
						<CardTitle className="text-lg">
							Câu {currentIndex + 1} / {quizCards.length}
						</CardTitle>
						<Badge variant="secondary">
							Điểm: {score}/{answered}
						</Badge>
					</div>
					<Progress value={progress} className="h-2" />
					<p className="text-sm text-muted-foreground text-center">
						{Math.round(progress)}% hoàn thành
					</p>
				</CardHeader>
			</Card>

			{currentCard && (
				<AnimatePresence mode="wait">
					<motion.div
						key={currentIndex}
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.3 }}
					>
						<Card className="min-h-[400px]">
							<CardHeader>
								<div className="flex justify-between items-center">
									<Badge variant="outline">
										{currentCard.category || "Chung"}
									</Badge>
									<Button variant="outline" size="sm" onClick={onClose}>
										Thoát
									</Button>
								</div>
							</CardHeader>

							<CardContent className="space-y-6">
								<div className="text-center">
									<h3 className="text-sm text-muted-foreground mb-3">
										Câu hỏi
									</h3>
									<p className="text-lg font-medium leading-relaxed">
										{currentCard.front}
									</p>
								</div>

								{!showAnswer ? (
									<div className="text-center">
										<Button
											onClick={handleShowAnswer}
											className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
										>
											Hiện đáp án
											<ArrowRight className="w-4 h-4 ml-2" />
										</Button>
									</div>
								) : (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className="space-y-4"
									>
										<div className="text-center p-4 bg-muted/50 rounded-lg">
											<h4 className="text-sm text-muted-foreground mb-2">
												Đáp án
											</h4>
											<p className="text-lg font-medium">{currentCard.back}</p>
										</div>

										<div className="flex space-x-4">
											<Button
												onClick={() => handleAnswer(false)}
												variant="destructive"
												className="flex-1"
											>
												<XCircle className="w-4 h-4 mr-2" />
												Sai
											</Button>
											<Button
												onClick={() => handleAnswer(true)}
												className="flex-1 bg-green-600 hover:bg-green-700"
											>
												<CheckCircle className="w-4 h-4 mr-2" />
												Đúng
											</Button>
										</div>
									</motion.div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	);
}
