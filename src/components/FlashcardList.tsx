"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Grid, List } from "lucide-react";
import { Flashcard as FlashcardType, ViewMode } from "@/types";
import Flashcard from "./Flashcard";

interface FlashcardListProps {
	flashcards: FlashcardType[];
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onAdd: () => void;
}

export default function FlashcardList({
	flashcards = [],
	onEdit,
	onDelete,
	onAdd,
}: FlashcardListProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");

	const categories = [
		...new Set(flashcards.map((card) => card.category || "Chung")),
	];

	const filteredCards = flashcards.filter((card) => {
		const matchesSearch =
			card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
			card.back.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesCategory =
			selectedCategory === "all" ||
			(card.category || "Chung") === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	const handleDelete = (id: string) => {
		if (window.confirm("Bạn có chắc chắn muốn xóa thẻ học này?")) {
			onDelete(id);
		}
	};

	if (flashcards.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
					<Search className="w-8 h-8 text-gray-400" />
				</div>
				<h3 className="text-xl font-semibold text-gray-900 mb-2">
					Chưa có thẻ học nào
				</h3>
				<p className="text-gray-600 mb-6">
					Hãy tạo thẻ học đầu tiên để bắt đầu hành trình học tập
				</p>
				<Button
					onClick={onAdd}
					className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
				>
					Tạo thẻ học đầu tiên
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Search and Filter Controls */}
			<div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 p-4 rounded-lg backdrop-blur-sm border border-gray-200 ">
				<div className="flex-1 flex gap-3 w-full sm:w-auto">
					{/* Search Input */}
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Tìm kiếm thẻ học..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Category Filter */}
					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-[180px]">
							<Filter className="w-4 h-4 mr-2" />
							<SelectValue placeholder="Tất cả danh mục" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tất cả danh mục</SelectItem>
							{categories.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* View Mode Toggle */}
				<div className="flex items-center gap-2">
					<Button
						variant={viewMode === "grid" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("grid")}
					>
						<Grid className="w-4 h-4" />
					</Button>
					<Button
						variant={viewMode === "list" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("list")}
					>
						<List className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Results Info */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-gray-600 ">
					Hiển thị {filteredCards.length} trên tổng số {flashcards.length} thẻ
					học
					{selectedCategory !== "all" &&
						` trong danh mục "${selectedCategory}"`}
				</p>{" "}
			</div>

			{/* No Results */}
			{filteredCards.length === 0 && (
				<div className="text-center py-12">
					<Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Không tìm thấy thẻ học nào
					</h3>
					<p className="text-gray-600 mb-4">
						Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc danh mục
					</p>
					<Button
						variant="outline"
						onClick={() => {
							setSearchTerm("");
							setSelectedCategory("all");
						}}
					>
						Xóa bộ lọc
					</Button>
				</div>
			)}

			{/* Flashcards Grid */}
			{filteredCards.length > 0 && (
				<div
					className={
						viewMode === "grid"
							? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
							: "space-y-4"
					}
				>
					{filteredCards.map((card) => (
						<Flashcard
							key={card.id}
							id={card.id}
							front={card.front}
							back={card.back}
							category={card.category}
							onEdit={onEdit}
							onDelete={handleDelete}
							className={viewMode === "list" ? "max-w-full" : ""}
						/>
					))}
				</div>
			)}
		</div>
	);
}
