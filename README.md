# BEYTRACK

A personal stat tracker for competitive Beyblade players. Built for a single player who wanted a proper way to record match results, track which beys are performing well, and actually answer the question — *which build is my best right now?*

---

## The problem it solves

Competitive Beyblade players often track their results in notes apps, spreadsheets, or just memory. BEYTRACK replaces that with a purpose-built tool that understands the game's scoring system, automatically calculates your win rate and point efficiency, and ranks your builds so the best one is always obvious.

---

## How it works

Everything revolves around three things: **Beys**, **Events**, and **Stats**.

### Beys

Your roster of builds. Each bey has a build string (e.g. `WR 1-60H`), an optional nickname, and an optional photo. When you look at a bey you can see its all-time record across every event you've ever attended — wins, losses, points scored, points given away, and a full breakdown of exactly how those results happened.

### Events

Every tournament or session you attend gets logged as an event. You record which beys you used, and for every single match you tap a button to record what happened — whether you won with a Burst Finish, lost to a Pocket Finish, or pulled off a no-contact launch. The app turns all of that into a compact record string behind the scenes.

### Stats

The app calculates three numbers for every bey, both per-event and across all time:

**Win Rate (WR)** — straightforward. How often did this bey win its matches.

**Score Over Opponent Rate (SOOR)** — a measure of point efficiency. If you scored 12 points and your opponent scored 9 points from your bey, your SOOR is 133%. Above 100% means you gave as good as you got. Below 100% means the other bey was pulling ahead on points even in the rounds it lost.

**Stat Points** — the combined ranking number. Win Rate percentage plus SOOR percentage, added together. So 79% WR + 332% SOOR = **411 Stat Points**. This is the single number used to rank everything. The bey at the top of the leaderboard with the most stat points across enough matches is, objectively, your best performing build.

---

## The scoring system

Each match result is one of these:

| What happened | Points |
|---|---|
| You got a Spin Finish | +1 |
| You got a Pocket Finish | +2 |
| You got an Xtreme Finish | +3 |
| You got a Burst Finish | +4 |
| You won against a Stamina build | +2 |
| You won by no-contact launch | +2 |
| Opponent got a Spin Finish on you | –1 |
| Opponent got a Pocket Finish on you | –2 |
| Opponent got an Xtreme Finish on you | –3 |
| Opponent got a Burst Finish on you | –4 |
| Opponent won against your Stamina build | –2 |
| Opponent won by no-contact launch | –2 |

You can also mark any Pocket, Xtreme, or Burst finish — on either side — as a **Self Finish**, meaning the result happened due to the losing bey's own movement rather than a clean hit. These are tracked separately so you can see how often a bey is self-finishing.

---

## What you can do

### Log an event
Tap the + button on the Events page. Give the event a name and date, then add the beys you used. For each bey, open its score panel and tap the result of every match — win arrows on the right, loss arrows on the left. The panel shows a running tally of the bey's record as you go. When you're done, tap Done and everything is saved.

You can also drag and reorder the bey list, undo and redo individual match results, and create a brand new bey on the spot if you used something that wasn't in your roster yet.

### Edit an event
Already logged an event but made a mistake? Open the event, tap Edit, and the full scoring wizard reopens with all your existing results pre-loaded. Change anything — the beys used, every single match result — and save.

### Your bey roster
The Beys page shows every build you've ever used. Tap any bey to expand it and see the complete picture: overall record, point totals, and a breakdown showing exactly how many times each finish type occurred and how many were self-finishes.

### The leaderboard
Ranks all your beys by Stat Points. By default only beys with at least 40 matches show up, so the ranking is based on real data rather than a lucky run of five games. You can adjust that threshold up or down. Click any ranked bey to expand its full breakdown without leaving the page.

### Filter events by bey
On the Events page there's a collapsible filter panel. Select one or more beys and the list narrows to only events where you used those builds. Useful for tracking how a specific bey has been performing across tournaments over time.

---

## A note on how results are stored

Under the hood, a full event's worth of match results for one bey is stored as a compact string of characters — something like `2.431505`. Each character is one match, and the app decodes that back into all the stats you see. This keeps the data light and fast while still capturing everything needed to calculate any stat exactly.

---

## Built with

The app runs in a web browser and is hosted online so it's accessible from any device. It uses a cloud database to store all event and bey data, meaning nothing is lost if you switch phones or clear your browser. Photos uploaded for beys are also stored in the cloud.

The whole thing was built custom — there's no off-the-shelf Beyblade tracker that understands this specific scoring system, so everything from the stat formulas to the match input screen was designed from scratch around how the game actually works.

---

## Privacy

This is a private tool. The hosted URL is not public. All data belongs to the player it was built for.
