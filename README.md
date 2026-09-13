# Flowlist — Your Daily To-Do

A private, mobile-first to-do list app with a glassy, minimalist look: a soft
frosted-glass surface over an aurora-gradient backdrop, one violet accent
reserved for the completion ring, the add button, and active states, card-based
lists, a floating bottom nav, and slide-up sheets. Includes task reminders and
one-tap export to Excel or PDF.

## How it works

- **Tasks page (home)** — a completion ring plus Pending / Completed / Overdue counts at the top. Below that, every task in a single flat list. Filter by **All / Active / Done**, and re-order with **Sort** (due date, priority, name, or newest first).
- **Add** (the `+` button) — creates a new task with a name, list, priority (Low/Medium/High), optional due date, optional **reminder**, and notes.
- **Reminders** — toggle "Notify me" on a task and pick a date/time. Flowlist checks reminders while the tab is open and shows a browser notification (or an in-app toast if notifications aren't allowed) when one is due. A 🔔 badge shows on tasks with a pending reminder. Turn on notifications from **More → Reminders**.
- **Tap a task's circle** to mark it done or not done. Tap the task itself to edit it, or use the **⋯** menu for edit/delete.
- **Progress page** — a 7-day "tasks completed" bar chart plus quick stats: all-time completion, this week's total, daily average, and how many tasks are currently overdue.
- **Lists page** — see all your lists (e.g. Work, Personal, Shopping) with open/total counts. Tap a list to see just its tasks, or create/edit/delete a list.
- **More page** — dark mode, text size, notification permission, **export to Excel (.xlsx) or PDF**, export/import a JSON backup, and reset all data.

## Exporting your tasks

- **More → Export tasks → Excel** downloads an `.xlsx` file with a "Tasks" sheet (title, list, priority, due date, reminder, status, notes, dates) and a "Lists summary" sheet.
- **More → Export tasks → PDF** downloads a clean, single-column PDF table of every task, colored by priority/status, with a header and page numbers — ready to print or share.
- These are separate from **Export backup (.json)**, which is a full data backup you can re-import into Flowlist (Excel/PDF exports are read-only reports, not backups).

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

**Quickest:** double-click `index.html` to open it in your browser. Basic use works fully offline after the first load; the Google Fonts stylesheet and the Excel/PDF export libraries are loaded from a CDN, so you'll need internet the first time you use those.

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
