# WatchBell

A maritime watch scheduling application for ship crews. WatchBell generates rotating watch schedules, tracks current and upcoming shifts in real time, and lets crew members export their personal schedules to any calendar app.

Available as a web app and native mobile app (iOS & Android via Capacitor).

---

## Features

### Dashboard
- Real-time ship clock with configurable timezone offset
- Current watch display with live progress bar
- Next watch preview
- 12-hour upcoming timeline
- Printable/shareable full-crew schedule

### Crew Management
- Add and remove crew members
- Drag-to-reorder rotation priority
- Per-crew-member schedule view

### Watch Configuration
Three scheduling modes:

| Mode | Description |
|------|-------------|
| **Standard** | Fixed watch duration (2, 3, 4, or 6 hrs) around the clock |
| **Day/Night** | Different durations for day (06:00–20:00) and night (20:00–06:00) |
| **Custom** | Define specific time slots with manual or auto crew assignment |

- Optional **Captain's Hour** — a 1-hour daily all-hands slot at a configurable time
- Rotation quality indicator (GOOD / WARNING / BAD)
- Configurable schedule start date and time

### Crew Detail & Export
- Per-member daily schedule grouped by day
- Export as `.ics` calendar file (imports into Google Calendar, Apple Calendar, Outlook, etc.)
- Share as plain text for messaging apps
- Configurable export window: 24 hours, 2 days, or 3 days

### Settings
- Light / Dark theme
- **Night Vision mode** — red-tinted filter to preserve night vision at sea
- **Auto Night Vision** — activates automatically at local sunset using GPS
- Ship time offset (UTC hours) or use device time
- 12 / 24-hour time format toggle
- Full data reset

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS (CDN), custom CSS |
| Icons | Lucide React |
| Mobile | Capacitor 8 (Android & iOS) |
| Storage | localStorage (no backend required) |

---

## Project Structure

```
watchbell/
├── index.html                      # HTML entry point
├── index.tsx                       # React entry point
├── App.tsx                         # Root component, routing, error boundary
├── types.ts                        # TypeScript interfaces
├── capacitor.config.ts             # Capacitor / native app config
├── vite.config.ts                  # Vite build config
│
├── components/
│   ├── Layout.tsx                  # Header, bottom nav, theme wrapper
│   └── SupportModal.tsx            # Feedback modal (shown after 2 weeks)
│
├── pages/
│   ├── Dashboard.tsx               # Home: clock, current/next watch, timeline
│   ├── CrewManagement.tsx          # Add/remove/reorder crew
│   ├── CrewDetail.tsx              # Individual schedule + export
│   ├── WatchConfiguration.tsx      # Schedule mode and parameters
│   └── Settings.tsx                # App preferences
│
├── context/
│   └── AppContext.tsx              # Global state (crew, config, schedule, settings)
│
├── services/
│   └── storageService.ts           # localStorage wrapper
│
└── utils/
    ├── scheduleLogic.ts            # Schedule generation (Standard / Day-Night / Custom)
    ├── scheduleHtmlGenerator.ts    # HTML schedule for print/share
    ├── icsGenerator.ts             # iCalendar (.ics) file generation
    └── sunCalc.ts                  # Sunrise/sunset via NOAA solar equations
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Production build
```bash
npm run build
```
Output goes to `dist/`.

---

## Mobile Builds

Requires Android Studio (for Android) or Xcode (for iOS).

```bash
# Sync web assets to native projects
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Open in Xcode
npm run cap:ios
```

App ID: `com.deligent.watchmaker`

---

## Architecture Notes

**Local-first** — all data lives in localStorage; no backend or account needed. Works fully offline.

**Hash-based routing** — client-side navigation via `#/` URLs; no server configuration required, compatible with native webview.

**Schedule generation** — three independent algorithms compute a 7-day schedule from the crew list and config. The schedule regenerates automatically on any config or crew change.

**Ship time offset** — scheduling is timezone-independent. Crews can enter a UTC offset to keep ship time consistent while crossing time zones, or simply use device time.

**ICS export** — standard iCalendar format ensures compatibility with all major calendar applications.

**Geolocation night vision** — uses NOAA solar equations to calculate local sunset/sunrise from GPS coordinates for automatic night vision activation.

---

## Support

If WatchBell has been useful on your watch, a coffee keeps the updates coming.

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/fadyk)
