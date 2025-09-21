"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X, Eye, Plus } from "lucide-react";
import { Flashcard, FlashcardFormData } from "@/types";

interface AddEditFlashcardProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: FlashcardFormData) => void;
	flashcard?: Flashcard | null;
	categories: string[];
}

export default function AddEditFlashcard({
	isOpen,
	onClose,
	onSave,
	flashcard = null,
	categories = [],
}: AddEditFlashcardProps) {
	const [formData, setFormData] = useState<FlashcardFormData>({
		front: "",
		back: "",
		category: "Chung",
	});
	const [newCategory, setNewCategory] = useState("");
	const [showNewCategory, setShowNewCategory] = useState(false);
	const [preview, setPreview] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const isEditing = !!flashcard;

	useEffect(() => {
		if (flashcard) {
			setFormData({
				front: flashcard.front || "",
				back: flashcard.back || "",
				category: flashcard.category || "Chung",
			});
		} else {
			setFormData({
				front: "",
				back: "",
				category: "Chung",
			});
		}
		setNewCategory("");
		setShowNewCategory(false);
		setPreview(false);
		setErrors({});
	}, [flashcard, isOpen]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.front.trim()) {
			newErrors.front = "Vui lòng nhập câu hỏi";
		}

		if (!formData.back.trim()) {
			newErrors.back = "Vui lòng nhập câu trả lời";
		}

		if (showNewCategory && !newCategory.trim()) {
			newErrors.newCategory = "Vui lòng nhập tên danh mục mới";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const finalCategory =
			showNewCategory && newCategory.trim()
				? newCategory.trim()
				: formData.category;

		const cardData: FlashcardFormData = {
			...formData,
			category: finalCategory,
		};

		onSave(cardData);
		onClose();
	};

	const handleInputChange = (field: keyof FlashcardFormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const allCategories = [
		"Chung",
		...categories.filter((cat) => cat !== "Chung"),
	];

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<span>{isEditing ? "Chỉnh sửa thẻ học" : "Thêm thẻ học mới"}</span>
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="category">Danh mục</Label>
						<div className="flex space-x-2">
							{!showNewCategory ? (
								<>
									<Select
										value={formData.category}
										onValueChange={(value) =>
											handleInputChange("category", value)
										}
									>
										<SelectTrigger className="flex-1">
											<SelectValue placeholder="Chọn danh mục" />
										</SelectTrigger>
										<SelectContent>
											{allCategories.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowNewCategory(true)}
									>
										<Plus className="w-4 h-4" />
									</Button>
								</>
							) : (
								<>
									<Input
										placeholder="Tên danh mục mới"
										value={newCategory}
										onChange={(e) => {
											setNewCategory(e.target.value);
											if (errors.newCategory) {
												setErrors((prev) => ({
													...prev,
													newCategory: "",
												}));
											}
										}}
										className="flex-1"
									/>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowNewCategory(false)}
									>
										<X className="w-4 h-4" />
									</Button>
								</>
							)}
						</div>
						{errors.newCategory && (
							<p className="text-sm text-red-500">{errors.newCategory}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="front">Câu hỏi / Mặt trước *</Label>
						<Textarea
							id="front"
							placeholder="Nhập câu hỏi hoặc nội dung mặt trước của thẻ..."
							value={formData.front}
							onChange={(e) => handleInputChange("front", e.target.value)}
							className="min-h-[100px] resize-vertical"
						/>
						{errors.front && (
							<p className="text-sm text-red-500">{errors.front}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="back">Câu trả lời / Mặt sau *</Label>
						<Textarea
							id="back"
							placeholder="Nhập câu trả lời hoặc nội dung mặt sau của thẻ..."
							value={formData.back}
							onChange={(e) => handleInputChange("back", e.target.value)}
							className="min-h-[100px] resize-vertical"
						/>
						{errors.back && (
							<p className="text-sm text-red-500">{errors.back}</p>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setPreview(!preview)}
							className="flex items-center space-x-2"
						>
							<Eye className="w-4 h-4" />
							<span>{preview ? "Ẩn xem trước" : "Xem trước"}</span>
						</Button>
					</div>

					{preview && (formData.front || formData.back) && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Xem trước</h3>
							<div className="grid md:grid-cols-2 gap-4">
								{formData.front && (
									<Card>
										<CardHeader>
											<CardTitle className="text-sm text-gray-600 ">
												Mặt trước
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-sm leading-relaxed">
												{formData.front}
											</p>
										</CardContent>
									</Card>
								)}
								{formData.back && (
									<Card>
										<CardHeader>
											<CardTitle className="text-sm text-gray-600 ">
												Mặt sau
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-sm leading-relaxed">{formData.back}</p>
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Hủy
						</Button>
						<Button
							type="submit"
							className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
						>
							<Save className="w-4 h-4 mr-2" />
							{isEditing ? "Cập nhật" : "Lưu thẻ học"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
