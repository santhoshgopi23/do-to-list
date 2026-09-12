# Flowlist — Your Daily To-Do

A private, mobile-first to-do list app, built with the same look and feel as your reference app (Foundation): warm cream background, green accent, card-based lists, bottom navigation, and slide-up sheets.

## How it works

- **Tasks page (home)** — a completion ring plus Pending / Completed / Overdue counts at the top. Below that, every task in a single flat list. Filter by **All / Active / Done**, and re-order with **Sort** (due date, priority, name, or newest first).
- **Add** (the `+` button) — creates a new task with a name, list, priority (Low/Medium/High), optional due date, and notes.
- **Tap a task's circle** to mark it done or not done. Tap the task itself to edit it, or use the **⋯** menu for edit/delete.
- **Progress page** — a 7-day "tasks completed" bar chart plus quick stats: all-time completion, this week's total, daily average, and how many tasks are currently overdue.
- **Lists page** — see all your lists (e.g. Work, Personal, Shopping) with open/total counts. Tap a list to see just its tasks, or create/edit/delete a list.
- **More page** — dark mode, text size, export/import a JSON backup, and reset all data.

## What's in this folder

```
index.html              → the app itself
assets/css/style.css    → all styling
assets/js/app.js        → all app logic
assets/icons/           → app icons (72–512px) + apple touch icon
manifest.json           → PWA manifest (lets you "Add to Home Screen")
favicon.svg / .png      → browser tab icon
```

## How to use it

**Quickest:** double-click `index.html` to open it in your browser. It works fully offline after the first load (only the Google Fonts stylesheet needs internet).

**To host it** (so you can open it from your phone anywhere):
1. Upload this whole folder to any static host — GitHub Pages, Netlify, Vercel, or a plain web server.
2. Keep the folder structure exactly as-is (`index.html` at the root, `assets/` beside it).

**To install it like an app on your phone:**
1. Open the hosted site in Chrome (Android) or Safari (iPhone).
2. Tap the browser menu → "Add to Home Screen".
3. It'll open full-screen, no address bar, with its own icon.

## Your data

All tasks, lists, and settings are stored only on this device, in this browser's local storage — no server, no account, no tracking. That means:
- Data is tied to **this specific browser** on **this specific device**.
- Clearing your browser's site data for this page will erase it.
- Use **More → Export backup** regularly, and **Import backup** to restore or move data to another device.

If you open `index.html` straight from your file system in a browser that restricts local storage on `file://` pages, saving may not work — host the folder instead (see above).
