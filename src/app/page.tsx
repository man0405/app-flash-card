"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import FlashcardList from "@/components/FlashcardList";
import AddEditFlashcard from "@/components/AddEditFlashcard";
import { useFlashcardsWithSync } from "@/hooks/useIndexedDBStorage";
import { Flashcard, FlashcardFormData } from "@/types";

export default function Home() {
	const {
		flashcards,
		isLoading,
		addFlashcard,
		updateFlashcard,
		deleteFlashcard,
		getCategories,
	} = useFlashcardsWithSync();
	const [isAddEditOpen, setIsAddEditOpen] = useState(false);
	const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

	const handleAddCard = () => {
		setEditingCard(null);
		setIsAddEditOpen(true);
	};

	const handleEditCard = (cardId: string) => {
		const card = flashcards.find((c: Flashcard) => c.id === cardId);
		if (card) {
			setEditingCard(card);
			setIsAddEditOpen(true);
		}
	};

	const handleDeleteCard = (cardId: string) => {
		deleteFlashcard(cardId);
	};

	const handleSaveCard = (cardData: FlashcardFormData) => {
		if (editingCard) {
			updateFlashcard(editingCard.id, cardData);
		} else {
			addFlashcard(cardData);
		}
	};

	const handleCloseAddEdit = () => {
		setIsAddEditOpen(false);
		setEditingCard(null);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Đang tải dữ liệu...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<Layout onAddCard={handleAddCard} flashcards={flashcards}>
				<FlashcardList
					flashcards={flashcards}
					onEdit={handleEditCard}
					onDelete={handleDeleteCard}
					onAdd={handleAddCard}
				/>
			</Layout>

			<AddEditFlashcard
				isOpen={isAddEditOpen}
				onClose={handleCloseAddEdit}
				onSave={handleSaveCard}
				flashcard={editingCard}
				categories={getCategories()}
			/>
		</>
	);
}
