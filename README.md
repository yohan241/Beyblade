# BEYTRACK

A personal Beyblade match tracker built for competitive players. Log events, track bey performance across matches, and rank your builds using a custom scoring system.

Live at: **[your-vercel-url.vercel.app]**

---

## What it does

BEYTRACK lets you record every event you attend, log the round-by-round results for each bey in your deck, and automatically calculates win rate, SOOR (Score Over Opponent Rate), and a combined **Stat Points** number used to rank your builds. The leaderboard tells you objectively which beys are performing best across your entire competitive history.

---

## Pages

### Leaderboard

Ranks all your beys by Stat Points (default), Win Rate, or SOOR. Filter by a minimum and maximum match count so only builds with enough data are shown. Click any row to expand a full breakdown of every finish type — how many Spin Finishes, Burst Finishes, self-finishes, and so on.

The default minimum is **40 matches** so the leaderboard only surfaces beys with meaningful sample sizes.

### Events

Lists every event you've attended, newest first. Each card shows the top 3 beys from that event by Stat Points.

**Filtering:** A collapsible "Filter by Bey" panel lets you select one or more beys as tags. The list narrows to only events that contain all of the selected beys. A search bar also filters by event name.

### Event Detail

Shows every bey used in an event, sorted by Stat Points. Tap **Edit event** to reopen the full scoring wizard with all existing data pre-loaded.

### Beys

Lists all your beys. Click any row to expand it and see:
- Overall WR, SOOR, Stat Points
- Complete breakdown: how many times each finish type occurred, including self-finish counts

Each expanded row also has **Edit** and **Delete** buttons. Deleting a bey removes it from all event entries.

### Add Event / Edit Event

A two-step wizard:

1. **Details** — Event name and date.
2. **Scoring** — Add beys to the event, score each match, reorder the list by dragging.

---

## The scoring system

Every match result is recorded as a **round code** — a single character. A full event string looks like `2.431505` where each character is one match result.

### Win codes (your points)

| Code | Finish type | Points |
|------|-------------|--------|
| `1` | Spin Finish | +1 |
| `2` | Pocket Finish | +2 |
| `3` | Xtreme Finish | +3 |
| `4` | Burst Finish | +4 |
| `0` | Spin vs Stamina | +2 |
| `9` | No Contact (launch tech) | +2 |

### Loss codes (opponent's points scored on you)

| Code | Finish type | Points against |
|------|-------------|----------------|
| `5` | Opp Spin Finish | –1 |
| `6` | Opp Pocket Finish | –2 |
| `7` | Opp Xtreme Finish | –3 |
| `8` | Opp Burst Finish | –4 |
| `a` | Opp Spin vs Stamina | –2 |
| `b` | Opp No Contact | –2 |

> `a` and `b` are internal codes that display as red `0` and red `9` in the UI to keep the visual language consistent.

### Self-finish marker

A period `.` after a code (e.g. `2.`) marks a **self-finish** — when a Pocket, Xtreme, or Burst finish happened due to your own blade. This applies to both wins (codes 2/3/4) and losses (codes 6/7/8). Self-finishes are tracked separately in the breakdown accordion.

---

## Stat formulas

### Win Rate (WR)

```
WR = (wins / total matches) × 100
```

A round is a win if its point value is positive (codes 1, 2, 3, 4, 0, 9).

### Score Over Opponent Rate (SOOR)

```
SOOR = (points scored by you / points scored against you) × 100
```

SOOR above 100% means you scored more than your opponent did from you. Below 100% means you gave away more than you took.

### Stat Points

```
Stat Points = round(WR) + round(SOOR)
```

This is the primary ranking number. A bey with 79% WR and 332% SOOR scores **79 + 332 = 411 Stat Points**.

---

## Adding an event

1. Tap the **+** FAB on the Events page.
2. Enter the event name and date, tap **Next**.
3. Tap **Add Bey** in the carousel to pick beys from your roster (or create a new one inline).
4. Tap a bey chip in the carousel to open its **Score Panel**.
5. For each match, press the **→** arrow on the right for a win or the **←** arrow on the left for a loss. The centre label shows the finish type and the arrows show the point value.
6. Toggle **SF?** before pressing an arrow to mark a self-finish (Pocket / Xtreme / Burst only).
7. Use **↩ Undo** / **Redo ↪** to correct mistakes.
8. Tap a different chip to switch beys, or close the panel by tapping the active chip again.
9. Drag the **⠿** handle on any row to reorder the bey list.
10. Tap **Done** to save.

---

## Score panel reference

```
[← –2]  [ Pocket Finish ]  [+2 →]
[← –3]  [ Xtreme Finish ]  [+3 →]
```

- Left arrow = opponent scored that finish on you (subtracts from your SOOR)
- Right arrow = you scored that finish (adds to your SOOR)
- Centre button also counts as a win tap

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build tool | Vite |
| UI components | Material UI (MUI) |
| Routing | React Router v7 |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |

---

## Database schema

Three tables in Supabase:

```sql
beys (
  id          uuid primary key,
  name        text,           -- optional nickname
  build       text not null,  -- e.g. "WR 1-60H"
  image_url   text,
  created_at  timestamptz
)

events (
  id          uuid primary key,
  name        text not null,
  event_date  date not null,
  created_at  timestamptz
)

event_bey_entries (
  id          uuid primary key,
  event_id    uuid references events(id) on delete cascade,
  bey_id      uuid references beys(id) on delete cascade,
  round_codes text not null default '',
  created_at  timestamptz
)
```

The `round_codes` string is the serialised match history for one bey in one event. All stat calculation happens client-side by parsing this string.

---

## Local setup

**Prerequisites:** Node.js 18+, a Supabase project with the schema above.

```bash
git clone <repo-url>
cd Beyblade
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the project at [vercel.com](https://vercel.com).
3. Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel project settings under **Environment Variables**.
4. Deploy. Every push to `main` auto-deploys.

The `vercel.json` at the project root configures SPA routing so direct URLs like `/events/some-id` don't return 404.

---

## Supabase Storage (bey photos)

Bey images are stored in a public Supabase Storage bucket called `bey-images`. To enable uploads:

1. Go to Supabase → Storage → create a bucket named `bey-images`, set it to **Public**.
2. Run the following in the SQL editor to allow uploads from the anon key:

```sql
create policy "Allow public uploads"  on storage.objects for insert to anon with check (bucket_id = 'bey-images');
create policy "Allow public updates"  on storage.objects for update to anon using (bucket_id = 'bey-images');
create policy "Allow public reads"    on storage.objects for select to anon using (bucket_id = 'bey-images');
create policy "Allow public deletes"  on storage.objects for delete to anon using (bucket_id = 'bey-images');
```

Images are cropped to a 512×512 square in-browser before upload.

---

## Project structure

```
src/
├── components/
│   ├── BeyAvatar.tsx      # Square image/placeholder used everywhere
│   ├── BeyBreakdown.tsx   # Expandable finish-type breakdown (Beys + Leaderboard)
│   ├── BeyName.tsx        # Displays nickname + build string
│   ├── EventWizard.tsx    # Shared wizard components (ScorePanel, BeyCarousel,
│   │                      #   SortableBeyList, BeyPickerModal)
│   └── PageHeader.tsx     # Page title + optional action slot
├── hooks/
│   └── useData.ts         # React hooks for all Supabase queries
├── layouts/
│   └── AppLayout.tsx      # Top bar + sidebar nav (desktop) / bottom nav (mobile)
├── lib/
│   ├── db.ts              # All database read/write functions
│   ├── stats.ts           # Stat calculation (WR, SOOR, Stat Points)
│   └── supabase.ts        # Supabase client + row types
├── pages/
│   ├── AddEventPage.tsx   # New event wizard
│   ├── AddBeyPage.tsx     # Add bey with crop UI
│   ├── BeysPage.tsx       # Bey roster with accordion breakdown
│   ├── EditBeyPage.tsx    # Edit existing bey
│   ├── EditEventPage.tsx  # Edit existing event (full wizard)
│   ├── EventDetailPage.tsx
│   ├── EventsPage.tsx     # Event list with search + bey filter tags
│   └── LeaderboardPage.tsx
└── types/
    └── tracker.ts         # Core TypeScript types
```
