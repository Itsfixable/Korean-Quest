# Korean Quest — Next.js App

React + Zustand + Next.js + Tailwind CSS + TypeScript migration of the Korean Quest static site.

## Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Zustand** (game state, auth, flashcards, bookings)
- **Tailwind CSS v4** + original page CSS for visual parity

## Development (local only)

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Do **not** deploy to company Vercel. Run locally for development, or host yourself:

```bash
yarn build
yarn start   # Node server on port 3000
```

For static hosting (e.g. GitHub Pages), use `yarn build` with `output: 'export'` in `next.config.ts`.

## Routes

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About |
| `/dashboard` | Student dashboard |
| `/resources` | Lessons & study tools |
| `/flashcards` | Flashcards |
| `/test` | Vocabulary test |
| `/jamo-select` | Jamo character grid |
| `/jamo` | Syllable builder |
| `/tracing` | Character tracing (`?char=ㄱ`) |
| `/adventure` | Adventure map & battles |
| `/schedule` | Study session booking |
| `/shop` | Cosmetic shop |
| `/leaderboard` | XP leaderboard |
| `/video` | Korean call room (`?room=...`) |

## Project structure

```
src/
  app/           # Next.js routes
  components/    # Layout (Sidebar, Chatbot) + page views
  stores/        # Zustand stores
  lib/           # Types, constants
  styles/        # Migrated CSS from original site
public/
  favicon/       # Images & icons
  resources/     # PDF downloadables
```
