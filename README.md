# كلامنجي شات - Kalamngy Chat

## 🌟 Overview
A real-time, comprehensive Arabic chat platform built with React, Vite, Tailwind CSS, and Supabase. The platform supports public and private chat rooms, admin dashboard, user roles, real-time messaging, and monetization ready-UI.

## 📁 Project Structure

```
d:\chat1\
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── chat/           # Chat-specific components (ChatBoard, MessageBubble, Input, Sidebar)
│   │   ├── layout/         # Layout components (Navbar, Sidebar)
│   │   └── admin/          # Admin dashboard components
│   ├── lib/                # Utilities and Configuration
│   │   ├── store.ts        # Zustand state management store
│   │   ├── supabase.ts     # Supabase client configuration
│   │   └── types.ts        # Database types and interfaces
│   ├── pages/              # Main Route Pages
│   │   ├── Home.tsx        # Main Chat layout and board
│   │   ├── Login.tsx       # User Authentication
│   │   ├── Register.tsx    # User Registration
│   │   └── Admin.tsx       # Admin Dashboard
│   ├── App.tsx             # Application routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global Tailwind and custom styles
├── tailwind.config.js      # Tailwind configuration with primary colors and themes
└── package.json            # Dependencies and scripts
```

## 🚀 How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Connect to Supabase:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## 🧾 Database Setup (Supabase)
To fully integrate with the backend, create the following tables in your Supabase SQL Editor:
- `users`: id (uuid), username (text), email (text), role (text), avatar (text), bio (text), status (text), balance (int).
- `chat_rooms`: id (uuid), name (text), type (text), icon (text).
- `messages`: id (uuid), user_id (uuid), room_id (uuid), content (text), type (text).

Enable **Realtime** on the `messages` table in Supabase Dashboard.

## ✨ Features Built
- ✅ **Dark/Light Mode** implemented nicely with Tailwind CSS.
- ✅ **Guest Logic** + Regular Login simulated state.
- ✅ **Modern RTL Arabic UI** matching platforms like Kalamngy Chat.
- ✅ **Zustand Store** for managing user state and active rooms.
- ✅ **Real-time Chat UI** with dynamic Message Bubbles, online presence, and emojis.
- ✅ **Admin Dashboard** with stats, sidebar, and modular pages.
"# chaty"  
