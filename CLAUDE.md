# J&J Power — Guide for Claude Code

## What this is
Single-file vanilla-JavaScript PWA (index.html) tracking a home solar + battery system.
No frameworks, no build step. Hosted on GitHub Pages from main at the repo root, so a
merge to main deploys straight to production.

## Data
- Source of truth is Firestore: users/jamie/{days,bills,rateHistory,settings}
- Browser state is localStorage key solar8
- Never invent or interpolate missing data. If a period has no data, do not display it.

## Safari / iOS rules (STRICT — breaking these breaks the app)
- No arrow functions; use function declarations
- No template literals; use string concatenation
- ASCII only in JavaScript (no em-dashes or other non-ASCII characters)
- No native dialogs (alert/confirm/prompt); use the app's custom overlays
- All text inputs at least 16px font-size
- Keep user-scalable=no in the viewport meta tag
- All init runs inside a DOMContentLoaded handler

## Architecture cautions
- localStorage silently overrides seeded data; account for it
- Repair data with a force-sync that re-derives from source every run, NOT one-shot
  flagged migrations (old flags block them)
- Rate rises must not change historical savings; look up the rate effective on each
  date via ratesForDate() against ST.rateHistory at every savings calculation
- Home consumption = grid + production - feedin - battery_charge + battery_discharge
  (use this exact formula everywhere)

## Working style
Surgical, minimal changes. Explain what changed and quantify any data impact.
Every change is reviewed before merge, so treat each edit as production-bound.
