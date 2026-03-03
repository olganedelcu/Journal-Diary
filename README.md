# Journal Diary

A super easy journaling app where you can drop all your thoughts and keep track of them. Write stuff down, throw in some photos, and look back at it all whenever you want.
Link: https://journal.olganedelcu.com/

![Journal entries page](screenshots/jornal.png)

## What it does

- **Write diary entries** with a title, text, and photos
- **Search** through all your entries by title or content
- **Timeline view** that shows your entries on an alternating left/right visual timeline
- **Photo gallery** pulls every image from your entries into one place
- **Streak tracker** counts how many consecutive days you've been writing
- **Pagination** so things stay fast even with lots of entries
- **Data caching** with React Query so navigating between pages feels instant

Everything is tied to your account, so your entries are private and synced across devices.

![Sign in page](screenshots/login.png)

## Tech stack

- **React 19** + TypeScript
- **Vite** for dev/build
- **Supabase** for auth, database (Postgres), and image storage
- **React Router** for navigation
- **TanStack React Query** for data caching and mutations
- **date-fns** for date formatting
- **lucide-react** for icons

## Getting started

```bash
npm install
npm run dev
```

The app expects a Supabase project with the schema defined in `supabase-setup.sql`. You'll need a `journal_entries` table and a `diary-images` storage bucket.

## Project structure

```
src/
  pages/         Page components (Auth, Welcome, Entries, View, Edit, Timeline, Photos)
  hooks/         React Query hooks for data fetching and mutations
  storage/       Supabase client and all database/storage functions
  context/       Auth context provider
  types/         TypeScript interfaces
  App.tsx        Routes and app shell
  App.css        All styles
```

## How it works

You sign in with email/password (Supabase Auth handles this). Once logged in, you land on the entries page with quick-access cards for Write, Journal, Timeline, and Photos. Your entries show up as cards you can click into, search through, or delete. Each entry can have multiple photos that get uploaded to Supabase Storage.

Row Level Security on the database means you can only see and modify your own entries. The app caches data client-side so going back and forth between pages doesn't re-fetch everything.
