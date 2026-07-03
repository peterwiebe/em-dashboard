# EM Dashboard

A personal dashboard for a player-coach engineer/EM: one place to see what's demanding your time today (meetings, focus time, a priority-ranked task list combining Jira/GitHub/admin tasks, and unanswered Slack/Teams/mail), plus lighter-weight manager-mode views (team status, PTO, sprint board, docs).

Built with React + Vite, client-side only — no backend beyond a small local dev-server middleware for persisting your reports/tasks to disk. Every data source falls back to realistic mock data until you configure real API tokens, so the app is fully usable (and testable) with zero configuration.

See `docs/feature/engineer-mode-dashboard-prd.md` and `docs/feature/engineer-mode-dashboard-spec.md` for the product/technical background.

---

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173 — the dashboard runs entirely on mock data out of the box.

**Important:** this app is meant to be run locally via `npm run dev` only. Tokens are read from `VITE_*` environment variables, which get bundled directly into the client-side JS — fine on your own machine, but do **not** deploy a build of this app to a publicly reachable URL with real tokens configured.

---

## Connecting real data (optional)

Copy `.env.example` to `.env` and fill in whichever tokens you have. Each integration falls back to mock data independently, so you can configure one, all, or none.

| Service | Env vars | Powers |
|---|---|---|
| GitHub | `VITE_GITHUB_TOKEN`, `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`, `VITE_GITHUB_USERNAME` | Pull Requests tab (all open PRs in one repo) and the "review requested by me" PRs in Priority Tasks (cross-repo, needs `TOKEN`+`USERNAME` only) |
| Jira | `VITE_JIRA_DOMAIN`, `VITE_JIRA_EMAIL`, `VITE_JIRA_TOKEN`, `VITE_JIRA_PROJECT` | Sprint Board tab, and your assigned tickets + time-on-task in Priority Tasks |
| Confluence | `VITE_CONFLUENCE_DOMAIN`, `VITE_CONFLUENCE_EMAIL`, `VITE_CONFLUENCE_TOKEN`, `VITE_CONFLUENCE_SPACE` | Docs tab |
| Microsoft Graph | `VITE_MS_GRAPH_TOKEN` (needs `Calendars.Read`, `Chat.Read`, `Mail.Read` scopes) | Calendar tab + today's meetings/focus time, Teams unread, Outlook mail unread |
| Slack | `VITE_SLACK_TOKEN` (user token with `im:read`/`im:history`/`mpim:read`/`mpim:history`) | Slack unread DMs/group DMs in the Unanswered card |

**Known risk:** Atlassian Cloud REST APIs (Jira, Confluence) commonly block direct browser-origin CORS requests. This hasn't been validated against a real token — if you hit CORS errors, that's expected and would require a proxy to fix; the Jira/Confluence integrations were built and tested against fixture data only.

---

## Local persistence

Your direct reports (added via the app), admin to-do list, and any manual priority overrides are saved to `data/local-state.json` — gitignored, created automatically on first save. This file only exists via the `npm run dev` dev-server middleware (`vite-plugins/local-state-plugin.js`); it won't work with `npm run preview` or a production build.

---

## Testing

```bash
npm test        # run the suite once
npm run test:watch
```

Uses Vitest + React Testing Library (jsdom environment). Setup lives in `src/test/setup.js`; test files sit alongside the code they cover (`*.test.js` / `*.test.jsx`).

---

## Project structure

```
em-dashboard/
├── src/
│   ├── App.jsx              ← tab navigation + Overview layout
│   ├── api/                 ← one fetch module per data source, each with a
│   │                           mock-data fallback (calendar, github, jira,
│   │                           slack, teamsChat, outlookMail, confluence,
│   │                           localState)
│   ├── components/          ← one component per card/tab
│   ├── utils/                 priority.js (task ranking), helpers.js
│   ├── data/mockData.js     ← fallback data for every integration
│   └── test/setup.js        ← shared Vitest/RTL setup
├── vite-plugins/
│   └── local-state-plugin.js ← dev-only /api/state persistence middleware
├── docs/feature/             ← PRD + technical spec for this dashboard
├── vite.config.js
└── package.json
```

## Known gaps

- **`ReportsManager` isn't wired into the UI yet.** The component (add/edit/remove direct reports, used for blocking-detection in Priority Tasks) is built and tested, but there's no tab or button in `App.jsx` that currently reaches it — it's unreachable in the running app.
- The "Team" tab (`TeamPulse`), Pull Requests, Sprint Board, PTO Calendar, and Docs tabs are manager-mode features carried over from the original prototype; they're not part of this dashboard's north star and haven't been extended.
