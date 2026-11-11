# Two of Us • Our Private Couples' Sanctuary 💕

A complete, private, full-stack couples' web app designed as a romantic gift. Built with **React 18 + TypeScript + Vite + Tailwind CSS**, integrated with **Supabase** (Auth, Database, Realtime, Private Storage) and a resilient **Local Real-Time Sandbox Mode** for instant playability out of the box.

---

## 🌟 What's Included

### 1. Games (15 Playable Games in 3 Categories)
- **Romantic (5 Games)**:
  1. **How Well Do You Know Us?** — Interactive relationship quiz with customizable questions, scoring, memory stories, and confetti.
  2. **Our Memory Match** — Card-flip memory game matching couple dates and memories (Coffee dates, stargazing, road trips, pasta dinners).
  3. **Our Story Timeline** — Chronological milestone organizer to test who remembers the exact order of your journey together.
  4. **Compliment Roulette** — Categorized prompts (Sweet, Deep, Playful, Spicy) with a permanent **Jar of Sweet Words** keepsake notes ledger.
  5. **Pick Our Date** — Interactive vibe, time, and budget selector generating 3-step date agendas with surprise elements, plus 1-click sharing to Chat!

- **Funny (5 Games)**:
  1. **Couple This or That** — Rapid-fire dilemmas to reveal your couple personality fingerprint and compatibility.
  2. **Caption This** — Take turns writing funny captions for couple scenarios and upvoting each other's best roasts.
  3. **Emoji Charades** — Decrypt emoji sequences to guess romantic movies, songs, and classic date night habits.
  4. **Two Truths and a Lie** — Spot the made-up lie among wild facts, plus an interactive round creator for your partner.
  5. **The Ridiculous Quiz** — Silly couples dilemmas ("Would you love me if I was a worm?") awarding custom duo badges.

- **Co-op Multiplayer (5 Games with Live State Sync)**:
  1. **Together Maze** — 2-player cooperative maze where Player 1 (💖) and Player 2 (⭐) must coordinate stepping on pressure plates to lower gates for each other to meet at the center.
  2. **Mini Escape Room ("The Love Lockbox")** — Search the vintage desk, bookshelf, and antique music box to deduce the 4-digit combination.
  3. **Draw and Guess** — Synchronized drawing canvas with full color palette and brush tools; one draws while the other guesses in real time.
  4. **Rhythm Team-Up ("Harmonious Heartbeat")** — Dual-lane synchronized rhythm tap game building couple combo multipliers.
  5. **Little Shared Garden** — Persistent garden with plots to plant roses, sunflowers, strawberries, and lavender, with real-time watering and blooming.

### 2. Private 1-on-1 Chat
- **Real-Time Messaging** & persistent conversation history
- **Photo Attachments** with inline previews and fullscreen lightbox zoom
- **Message Replies** with quoted reference banner
- **Emoji Reactions** (❤️, 🥰, 😘, 😂, 🥺, ✨, 🔥) with toggle counts
- **Message Editing and Deletion**
- **Read Receipts** (Sent ✓, Delivered ✓✓, Read ✓✓) and exact timestamps
- **Live Typing Indicator** and online presence indicators
- **In-Chat Search** with instant message filtering
- **Responsive Layout** with romantic bubbles and smooth scrolling

### 3. Private Shared Photos Gallery
- **Desktop & Mobile Uploads** with drag-and-drop support
- **Upload Progress** and client-side file validation (JPEG, PNG, WebP < 10MB)
- **Album / Collection Categorization** (Date Nights, Adventures, Candid Moments, Milestones, and custom albums)
- **Fullscreen Lightbox Viewer** with keyboard shortcuts (Arrow keys, Escape) and download support
- **Favorites Hearting** and delete controls with confirmation
- **Private Storage Architecture** with strict Row-Level Security (RLS)

### 4. Customization & Pairing
- **Sanctuary Settings Modal**: Edit partner names, avatars, anniversary date (with live days/years together counter), welcome message, and couple invite code.
- **Pairing / Invitation Flow**: Invite code pairing ensures only the two approved accounts can access the sanctuary.
- **Quick Switch Toolbar**: Allows 1-click switching between Partner 1 and Partner 2 for effortless local two-player testing on a single machine or across two browser tabs!

---

## 📱 Cross-Device Play (Phone + PC)

The entire website is responsive from 360px smartphone screens up to 4K monitors, with touch, mouse, and keyboard input seamlessly supported.

### How to play with one person on Phone and one on PC:

#### Over Local Wi-Fi (Local Dev Mode):
1. Start the dev server with network access:
   ```bash
   npm run dev -- --host
   ```
2. Vite will display your local network address (e.g., `http://192.168.1.15:5173/`).
3. On your PC, launch any Co-op game (e.g. Together Maze, Draw & Guess, Garden).
4. Click the **"Join from Phone / Share"** button on the session bar.
5. Point your girlfriend's phone camera at the on-screen **QR code** (or open the displayed URL on the phone).
6. The phone instantly enters the exact same game session as Partner 2!
7. Watch drawing strokes, maze moves, garden flowers, and rhythm taps sync across phone and PC in real time.

#### In Production (Vercel / Netlify + Supabase):
- When deployed with Supabase, the game state synchronizes across devices worldwide over Supabase Realtime WebSockets.
- Simply click **"Join from Phone / Share"**, copy the invite link, and open it on the phone or tablet.

### Touch & Responsive Optimizations:
- **Draw and Guess**: Touchscreen finger-drawing with `touch-action: none` to prevent page scrolling while drawing.
- **Together Maze**: 54px tactile touch D-Pad with haptic feedback vibration for mobile, plus WASD / Arrow keys for desktop.
- **Rhythm Team-Up**: Low-latency touch target zones with haptic vibration on phones, and `D` / `K` keys on keyboard.
- **Chat**: Tap-to-react, edit, and reply controls (no hover-dependency) and dynamic viewport height (`100dvh`) to prevent mobile keyboard overlapping.
- **Photos Gallery**: Direct-tap favorite hearts and swipeable/arrow-key Lightbox.
- **Reconnection Resilience**: Temporary network loss or page refreshes do not end the game session; state is safely restored immediately.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Steps
1. Navigate to the project directory:
   ```bash
   cd "C:\Users\singh\.gemini\antigravity\scratch\two-of-us"
   ```

2. Dependencies are already installed (`npm install`). To start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`.

> **Testing 2-Player Co-op Locally:**
> Open two browser windows side-by-side (or one incognito window). In one window, click **"Viewing as Ayush"** to switch to Partner 1, and in the other window switch to Vrishti. Watch moves in Together Maze, Draw & Guess, Garden watering, and Chat sync in real time across the two tabs!

---

## 🔐 How to Connect Supabase (Production Mode)

The app works right out of the box in **Local Sandbox Mode**. To connect your live Supabase project for persistent cloud storage and database:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Note your **Project URL** and **anon public key** from `Project Settings -> API`.

### 2. Run Database Migration
1. In your Supabase Dashboard, go to **SQL Editor -> New Query**.
2. Open the file `supabase/schema.sql` in this project.
3. Paste the entire contents and click **Run**.
   - This creates the `couples`, `chat_messages`, `photos`, and `game_sessions` tables.
   - Enables Row-Level Security (RLS) policies guaranteeing only the 2 paired users have access.
   - Sets up the `couple-photos` private storage bucket.
   - Activates Supabase Realtime publication.

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart the dev server:
```bash
npm run dev
```
The Sanctuary Settings modal will now display a green **"Supabase Live Connected"** badge!

---

## 💌 How to Invite Your Partner

1. Open **Sanctuary Settings** (gear icon in the top right).
2. Copy the **Couple Invite Code** (default is `US-FOREVER-2024` or customized by you).
3. Send your partner the deployed website link along with the code.
4. When she opens the site, she enters her name and the invite code to link her account as Partner 2. Once both accounts are joined, the sanctuary is locked strictly to the two of you!

---

## 🌐 How to Deploy to Production

### Option 1: Vercel (Recommended)
1. Push this repository to GitHub or run `vercel` CLI:
   ```bash
   npm install -g vercel
   vercel
   ```
2. In the Vercel project settings, add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Click **Deploy**.

### Option 2: Netlify
1. Run `netlify deploy --build` or connect your repository in the Netlify web dashboard.
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 📋 What Works & Limitations

### Fully Working:
- ✅ All 15 Games are completely built, playable, and styled.
- ✅ Dual-mode architecture: Local Real-time sync via BroadcastChannel and Supabase Realtime integration.
- ✅ Full 1-on-1 Chat with text, emoji reactions, message editing, deletion, reply quotes, photo attachments, search, and read receipts.
- ✅ Shared Photo Gallery with drag-and-drop upload, album filters, favorites, captions, and keyboard-navigable Lightbox.
- ✅ Relationship anniversary counter (live calculation of days and years together).
- ✅ Sanctuary customization (editable names, avatars, welcome note, and invite code).
- ✅ Responsive layout tailored for both mobile smartphones and desktop screens.

### Placeholders / Expandable in the Future:
- In Local Mode, uploaded photos are persisted via Base64/IndexedDB storage; in Supabase Mode, photos are uploaded to the private `couple-photos` storage bucket.
- Voice/Audio recording notes can be added on top of the existing photo attachment pipeline.
- Additional games can be dropped into `src/components/games/` and registered in `GamesHub.tsx` within minutes.
