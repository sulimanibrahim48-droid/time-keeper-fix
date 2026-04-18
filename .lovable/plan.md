
## Plan: Functional Clock, Alarm & Timer App

Port the uploaded flip-clock app into the React/TanStack project and make **all buttons actually work** — including Add Alarm, Create Countdown, Settings, and Menu, which currently do nothing.

### Routes (separate files, with shared layout)
- `/` — Clock (animated flip clock, current time)
- `/alarm` — Alarm list
- `/timer` — Countdown timer
- Shared layout route with the top app bar + bottom nav (Clock / Alarm / Timer)

### Clock page (`/`)
- Port the flip-card animation exactly as in `index.html` (HH:MM:SS, flipping digits, pulsing colons)
- Responsive sizing for mobile / tablet / desktop

### Alarm page (`/alarm`) — fully functional
- Persist alarms in `localStorage`
- **Add (+) button** opens a modal/sheet with: time picker (hour, minute, AM/PM), label, repeat days (Mon–Sun chips), tone selection
- Each alarm card: toggle on/off, tap to edit, swipe/long-press or trailing menu to **delete**
- Background ticker checks every second; when an enabled alarm matches current time → play tone + show dismiss/snooze (5 min) dialog
- Seed with the 3 sample alarms on first load

### Timer page (`/timer`) — fully functional
- **Setup view**: large hour / minute / second wheel inputs + numeric keypad; preset chips (Deep 10:00, Break 5:00, Focus 25:00) tap to load; "Start" button
- **Running view**: animated SVG progress ring, MM:SS (or HH:MM:SS) countdown, estimated end time
- Controls: Start / Pause / Resume / Reset / Cancel (back to setup)
- On finish: ring pulses, alarm tone plays, "Dismiss" + "Restart" buttons
- Recent durations saved to `localStorage` and shown as tappable chips

### Top bar buttons (currently `alert()` placeholders)
- **Menu**: opens a side drawer with: theme (system/light/dark), 24-hour vs 12-hour, sound on/off, about
- **Settings**: opens a settings sheet with the same preferences (persisted to `localStorage`) — applied app-wide

### Design
- Keep the exact dark palette, Space Grotesk + Inter typography, Material Symbols icons, and grain texture overlay from the uploads
- Mobile-first, max-width container, fixed header + bottom nav

### Tech
- React state + `localStorage` (no backend needed)
- Web Audio API for alarm/timer tones (generated beep, no asset required)
- shadcn `Dialog`, `Sheet`, `Switch`, `Button` for the new interactions
