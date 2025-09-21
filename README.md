# Flash Card App - Smart Learning Tool

A modern Progressive Web App (PWA) for creating, managing, and studying flashcards with offline support, smart quiz features, and responsive design.

![Flash Card App Demo](https://img.shields.io/badge/PWA-Ready-green)
![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)

## ✨ Features

### 📚 Core Functionality

- **Create & Edit Flashcards**: Add flashcards with custom categories, front/back content
- **Smart Categories**: Organize flashcards by subjects or topics
- **Search & Filter**: Find flashcards quickly with real-time search and category filtering
- **Quiz Mode**: Interactive quiz system with scoring and progress tracking
- **Preview Mode**: Preview flashcards before saving

### 🔄 Data Management

- **IndexedDB Storage**: Local data persistence with browser database
- **Offline Support**: Full functionality without internet connection
- **Data Sync**: Background synchronization when online
- **Conflict Resolution**: Smart handling of data conflicts during sync

### 📱 Progressive Web App

- **PWA Features**: Install as native app on any device
- **Offline Indicator**: Visual feedback for connection status
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Install Prompt**: Native installation prompts

### 🎨 User Experience

- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Dark/Light Themes**: Adaptive design with system preference support
- **Animations**: Smooth transitions and interactions with Framer Motion
- **Accessibility**: ARIA-compliant components from Radix UI

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/flash-card-app.git
   cd flash-card-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Usage Guide

### Creating Flashcards

1. Click the **"Thêm thẻ mới"** (Add New Card) button
2. Select or create a category
3. Enter the front side content (question)
4. Enter the back side content (answer)
5. Use the preview toggle to review your card
6. Click **"Lưu"** (Save) to add the flashcard

### Quiz Mode

1. Navigate to the **"Quiz"** tab
2. Click **"Bắt đầu Quiz"** (Start Quiz) to begin
3. Read the question and think of your answer
4. Click **"Hiện đáp án"** (Show Answer) to reveal the correct answer
5. Rate your performance with **"Đúng"** (Correct) or **"Sai"** (Wrong)
6. View your final score and statistics

### Managing Cards

- **Edit**: Click the edit button on any flashcard
- **Delete**: Click the delete button to remove a flashcard
- **Search**: Use the search bar to find specific cards
- **Filter**: Select categories to filter your flashcards
- **View Modes**: Switch between grid and list views

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── AddEditFlashcard.tsx
│   ├── Flashcard.tsx
│   ├── FlashcardList.tsx
│   ├── InstallPrompt.tsx
│   ├── Layout.tsx
│   ├── OfflineIndicator.tsx
│   ├── Quiz.tsx
│   └── SyncStatus.tsx
├── hooks/                # Custom React hooks
│   ├── useIndexedDBStorage.ts
│   ├── useLocalStorage.ts
│   ├── useOnlineStatus.ts
│   └── useSyncStatus.ts
├── lib/                  # Utility libraries
│   ├── apiService.ts     # API communication
│   ├── indexeddb.ts      # IndexedDB operations
│   ├── syncQueue.ts      # Data synchronization
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
    └── index.ts
```

## 🛠️ Technology Stack

### Frontend

- **Next.js 15.5.3**: React framework with App Router
- **React 19.1.0**: UI library with latest features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling

### UI Components

- **Radix UI**: Accessible, unstyled components
- **Lucide React**: Beautiful SVG icons
- **Framer Motion**: Smooth animations
- **Class Variance Authority**: Component variants

### Data & Storage

- **IndexedDB**: Browser-based database
- **PWA**: Progressive Web App capabilities
- **Service Worker**: Background sync and caching

### Development Tools

- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Turbopack**: Fast development bundler

## 📱 PWA Features

The app is fully optimized as a Progressive Web App:

- **Installable**: Can be installed on home screen
- **Offline First**: Works without internet connection
- **App-like Experience**: Native app behavior
- **Auto-updates**: Background updates when available
- **Cross-platform**: Works on iOS, Android, Windows, macOS

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for custom configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Flash Card App
```

### PWA Settings

PWA configuration is managed in:

- `public/manifest.json`: App manifest
- `next.config.ts`: Next.js PWA configuration

## 📦 Build & Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy Options

- **Vercel**: Recommended platform (zero-config deployment)
- **Netlify**: Static site deployment
- **Docker**: Containerized deployment
- **Self-hosted**: Any Node.js hosting provider

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically on every push

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/flash-card-app/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

## 🎯 Roadmap

- [ ] Cloud synchronization
- [ ] Spaced repetition algorithm
- [ ] Multi-language support
- [ ] Voice recording for pronunciation
- [ ] Collaborative study groups
- [ ] Analytics and progress tracking
- [ ] Import/export functionality

---

Made with ❤️ for better learning experiences
