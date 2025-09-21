"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, Brain, Settings, BarChart3 } from "lucide-react";
import { Flashcard, TabValue } from "@/types";
import Quiz from "./Quiz";
import { OfflineIndicator, OnlineStatusBadge } from "./OfflineIndicator";
import { InstallPrompt } from "./InstallPrompt";
import { SyncStatusDialog } from "./SyncStatus";

interface LayoutProps {
	children: ReactNode;
	onAddCard: () => void;
	flashcards: Flashcard[];
}

export default function Layout({
	children,
	onAddCard,
	flashcards = [],
}: LayoutProps) {
	const [activeTab, setActiveTab] = useState<TabValue>("cards");
	const [showQuiz, setShowQuiz] = useState(false);

	const handleStartQuiz = () => {
		setShowQuiz(true);
	};

	const handleCloseQuiz = () => {
		setShowQuiz(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<OfflineIndicator />
			<header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
				<div className="max-w-4xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
								<Brain className="w-6 h-6 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
								<p className="text-sm text-gray-600">Học tập thông minh</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<OnlineStatusBadge />
							<SyncStatusDialog />
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-6">
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as TabValue)}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-3 mb-6">
						<TabsTrigger value="cards" className="flex items-center space-x-2">
							<BookOpen className="w-4 h-4" />
							<span>Thẻ học</span>
						</TabsTrigger>
						<TabsTrigger value="quiz" className="flex items-center space-x-2">
							<Brain className="w-4 h-4" />
							<span>Quiz</span>
						</TabsTrigger>
						<TabsTrigger value="stats" className="flex items-center space-x-2">
							<BarChart3 className="w-4 h-4" />
							<span>Thống kê</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="cards" className="space-y-4">
						<div className="flex justify-between items-center">
							<h2 className="text-2xl font-semibold text-gray-900 ">
								Thẻ học của bạn
							</h2>
							<Button
								onClick={onAddCard}
								className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
							>
								<Plus className="w-4 h-4 mr-2" />
								Thêm thẻ mới
							</Button>
						</div>
						{children}
					</TabsContent>

					<TabsContent value="quiz" className="space-y-4">
						{!showQuiz ? (
							<div className="text-center py-12">
								<Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
								<h2 className="text-2xl font-semibold text-gray-900 mb-2">
									Chế độ Quiz
								</h2>
								<p className="text-gray-600 mb-6">
									Kiểm tra kiến thức của bạn với các câu hỏi ngẫu nhiên từ{" "}
									{flashcards.length} thẻ học
								</p>
								<Button
									size="lg"
									onClick={handleStartQuiz}
									disabled={flashcards.length === 0}
									className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
								>
									Bắt đầu Quiz
								</Button>
								{flashcards.length === 0 && (
									<p className="text-sm text-gray-500 mt-3">
										Hãy thêm một số thẻ học trước khi bắt đầu quiz
									</p>
								)}
							</div>
						) : (
							<Quiz flashcards={flashcards} onClose={handleCloseQuiz} />
						)}
					</TabsContent>

					<TabsContent value="stats" className="space-y-4">
						<div className="text-center py-12">
							<h2 className="text-2xl font-semibold text-gray-900 mb-4">
								Thống kê học tập
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg">Tổng số thẻ</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-3xl font-bold text-blue-600 ">
											{flashcards.length}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg">Danh mục</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-3xl font-bold text-green-600 ">
											{
												[
													...new Set(
														flashcards.map((card) => card.category || "Chung")
													),
												].length
											}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="text-lg">Thẻ mới nhất</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-sm text-gray-600 ">
											{flashcards.length > 0
												? new Date(
														Math.max(
															...flashcards.map((card) =>
																new Date(card.createdAt).getTime()
															)
														)
												  ).toLocaleDateString("vi-VN")
												: "Chưa có"}
										</div>
									</CardContent>
								</Card>
							</div>

							{flashcards.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Phân bố theo danh mục</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{[
												...new Set(
													flashcards.map((card) => card.category || "Chung")
												),
											].map((category) => {
												const count = flashcards.filter(
													(card) => (card.category || "Chung") === category
												).length;
												const percentage = Math.round(
													(count / flashcards.length) * 100
												);

												return (
													<div
														key={category}
														className="flex items-center justify-between"
													>
														<span className="font-medium">{category}</span>
														<div className="flex items-center space-x-2">
															<div className="w-24 h-2 bg-gray-200 rounded-full">
																<div
																	className="h-full bg-blue-500 rounded-full"
																	style={{ width: `${percentage}%` }}
																/>
															</div>
															<span className="text-sm text-gray-600 ">
																{count} ({percentage}%)
															</span>
														</div>
													</div>
												);
											})}
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</main>
			<InstallPrompt />
		</div>
	);
}
