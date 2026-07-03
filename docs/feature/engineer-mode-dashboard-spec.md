# Technical Spec: Engineer Mode Dashboard (em-dashboard v1)

**PRD:** docs/feature/engineer-mode-dashboard-prd.md
**North Star:** As a player-coach engineer, I need a single view of all real-time demands on my time — meetings, deadlines, and tasks that are blocking others (my reports first, other collaborators second) — so I always know my top priority and never unknowingly become the bottleneck.
**Author:** Peter Wiebe
**Status:** Draft

---

## 1. Requirements

| Req ID | User Story | Technical Requirement | Acceptance Criteria |
|--------|-----------|----------------------|-------------------|
| R-1 | US-1: Today's meetings + focus time | Wire `TodayMeetingStrip` and `MeetingCalendar` to call `fetchWeekMeetings()` from `src/api/calendar.js` instead of importing `MOCK_MEETINGS` directly, so real MS Graph data flows through once a token is configured | Rendering either component with `VITE_MS_GRAPH_TOKEN` unset still shows mock meetings (no regression); setting the token shows live data |
| R-2 | US-1: Focus time calculation | Add `computeFocusTime(meetings, dayIdx, dayStartH, dayEndH)` to `src/utils/helpers.js`, returning total unscheduled hours for the given day within a configurable workday window (default 9–18) | Given a day's meetings, the function returns workday hours minus summed meeting duration, floored at 0 |
| R-3 | US-1: Meeting-starting-soon flag | Add `isStartingSoon(meeting, now, thresholdMinutes = 15)` to `helpers.js`; apply a visual flag in `TodayMeetingStrip` when true | A meeting starting within 15 minutes renders with a distinct visual treatment (e.g., highlighted border/badge) |
| R-4 | US-2: Prioritized task list | Build `src/utils/priority.js` exposing `rankTasks(tasks, reports)`, combining deadline proximity and blocking tier (blocks a report > blocks a collaborator > no blocking) into a single sort order | Given a fixture set of tasks with varying due dates and blocking targets, `rankTasks` returns tasks ordered so a task blocking a report outranks a same-deadline task with no blocking |
| R-5 | US-2: Jira task data | Extend `src/api/jira.js` with `fetchMyTasks()` pulling tickets assigned to the user, including `duedate` and `issuelinks` (blocks/is blocked by) fields | Returned tasks include a due date (nullable) and a list of linked blocked ticket keys, falling back to mock data when Jira env vars are unset |
| R-6 | US-2: GitHub review-requested PRs | Extend `src/api/github.js` with `fetchReviewRequestedPRs()` using GitHub's cross-repo search API (`is:pr is:open review-requested:{username}`), replacing the current single-repo-only `fetchPullRequests()` for this purpose | Returns open PRs across all repos the token can see where the user is a requested reviewer; falls back to mock data when no token is set |
| R-7 | US-2: Unified ranked view | Build `PriorityTaskList.jsx` combining Jira tasks (R-5), GitHub review-requested PRs (R-6), and admin to-dos, passed through `rankTasks()` (R-4), rendering each item's blocking target if any | The rendered list order matches `rankTasks()` output; each item shows source (Jira/GitHub/admin), title, due date if present, and "blocks: <name>" badge if applicable |
| R-8 | US-3: Time on task | Add `fetchIssueChangelog(issueKey)` to `jira.js`, parsing the most recent transition timestamp into "In Progress"; display elapsed time on Jira-sourced items in `PriorityTaskList` | For a Jira-sourced task, the list shows elapsed time since the last "In Progress" transition; PR and admin-task rows show no elapsed time (documented limitation, not an error state) |
| R-9 | US-4: Unified unanswered inbox | Build `src/api/slack.js`, `src/api/teamsChat.js`, and `src/api/outlookMail.js`, each returning a normalized `{ id, source, title, from, timestamp, link }` shape; merge and sort by recency in new `UnansweredList.jsx` | Component renders a single list combining unread Slack DMs/mentions, unread Teams chats, and unread Outlook mail, each tagged with its source icon; falls back to per-source mock data when a token is absent |

**Technical Prerequisites** (not tied to a single user story, required to make the above possible):

| ID | Prerequisite | Justification |
|----|-------------|----------------|
| TP-1 | Local JSON persistence layer: a Vite dev-server middleware plugin serving `GET /api/state` and `PUT /api/state` against a local `data/local-state.json` file, plus a client wrapper `src/api/localState.js` | The app currently has zero persistence (even the to-do list resets on reload). Reports management (TP-2) and priority overrides need to survive page reloads, and the user explicitly chose file-on-disk persistence over localStorage. |
| TP-2 | `ReportsManager.jsx` — a UI to add/edit/remove direct reports (name, optional GitHub username, optional Jira account ID), persisted via TP-1 | R-4/R-7's blocking-tier ranking needs to know who the user's direct reports are; the user chose to manage this list from within the dashboard rather than a static config file. |
| TP-3 | Introduce Vitest + React Testing Library as net-new test infrastructure | The project currently has no test setup at all (no test runner, no test files). Vitest is the natural pairing for a Vite project and is needed to satisfy Section 5. |

## 2. Constraints

- **Codebase patterns:** Functional React components with hooks only (no class components). Existing `api/*.js` modules follow a consistent shape: read `VITE_*` env vars, fall back to a `MOCK_*` constant when required vars are missing, otherwise fetch and map to a normalized shape. All new API modules (`slack.js`, `teamsChat.js`, `outlookMail.js`) must follow this same fallback pattern.
- **Existing inconsistency to resolve:** some components (`TodayMeetingStrip`, `MeetingCalendar`, `PTOCalendar`, `TeamPulse`, `SprintBoard`, `ConfluenceDocs`) currently import mock data constants directly instead of calling their corresponding `api/*.js` fetch function — the fetch functions exist but are unused. R-1 fixes this specifically for the calendar components in scope; other components are untouched (out of scope, see Section 10 of the PRD).
- **Infrastructure:** No backend server exists today beyond the new minimal persistence middleware (TP-1). Per explicit user decision, the app must remain runnable via a single `npm run dev` and must **never be deployed to a publicly reachable host**, since `VITE_*` tokens are bundled into the client JS at build time and would be extractable by anyone who can reach the served app.
- **Compatibility:** Existing tab navigation (`Overview`, `Calendar`, `Pull Requests`, `Sprint Board`, `PTO Calendar`, `Docs`, `My Tasks`) and out-of-scope manager-mode components (`TeamPulse`, `PTOCalendar`, `SprintBoard`, `ConfluenceDocs`) must continue to render unchanged.
- **Performance:** No hard SLA (single-user personal tool). Reasonable expectation: dashboard render completes within a few seconds on typical broadband once all sources are fetched.
- **Security:** Tokens are read only from `.env` (already gitignored) and must never be logged, displayed, or written into `data/local-state.json`. The persistence middleware (TP-1) only ever reads/writes reports, to-dos, and priority overrides — never tokens.

## 3. Technical Plan

### 3.1 Architecture Overview

The app remains a single-page React + Vite client app. This feature adds three layers on top of the existing `api/` + `components/` structure:

1. **New API modules** (`slack.js`, `teamsChat.js`, `outlookMail.js`) follow the existing fetch-with-mock-fallback pattern already used by `github.js`/`jira.js`/`calendar.js`/`confluence.js`.
2. **A pure computation layer** (`src/utils/priority.js`, plus additions to `src/utils/helpers.js`) that takes normalized data and produces rankings/derived values, with no side effects — easy to unit test.
3. **A minimal local persistence layer** (Vite plugin middleware + `src/api/localState.js`) that is the only new "backend" surface, solely for reports/to-dos/overrides, not for proxying third-party tokens.

Data flow for the primary story (US-2, prioritized task list):

```
App.jsx (Overview tab)
   │
   ├─ fetchMyTasks() ──────────────┐
   ├─ fetchReviewRequestedPRs() ───┤
   ├─ TodoList admin tasks ────────┤
   ├─ localState.load() → reports ─┤
   │                               ▼
   │                     rankTasks(tasks, reports)   [src/utils/priority.js]
   │                               │
   │                               ▼
   └────────────────────► PriorityTaskList.jsx
                                    │
                          (top item) fetchIssueChangelog(issueKey)
                                    │
                                    ▼
                          elapsed time-on-task display
```

`UnansweredList.jsx` follows an analogous but independent flow: `fetchSlackUnread()` + `fetchTeamsUnread()` + `fetchUnreadMail()` → merge/sort by recency → render.

### 3.2 Data Model Changes

No database exists. This feature introduces one local JSON file, `data/local-state.json` (gitignored, alongside `.env`), with the following shape:

```
{
  "reports": [
    { "id": string, "name": string, "githubUsername": string | null, "jiraAccountId": string | null }
  ],
  "todos": [
    { "id": string, "text": string, "done": boolean, "priority": "high" | "med" | "low", "blocksReportId": string | null }
  ],
  "priorityOverrides": {
    "<taskId>": number
  }
}
```

- **Migration strategy:** None needed (new file, no prior schema). The persistence middleware creates the file with empty defaults (`{ reports: [], todos: [], priorityOverrides: {} }`) on first write if it doesn't exist.
- **Impact on existing data:** `TodoList.jsx` currently seeds from `DEFAULT_TODOS` in memory only; migrating it to read/write through `localState` replaces that in-memory seed with the persisted file (first run seeds the file from `DEFAULT_TODOS` once).
- **Rollback plan:** Delete `data/local-state.json`; the app falls back to empty defaults (todos back to seeded `DEFAULT_TODOS` per current behavior).

### 3.3 API Changes

Two new local-only endpoints, served by a Vite dev-server middleware plugin (not a public API):

- `GET /api/state` → returns the full contents of `data/local-state.json` (or defaults if missing). No auth (localhost-only, single-user).
- `PUT /api/state` → accepts a full JSON body matching the shape in 3.2 and overwrites the file. No partial-patch support in v1 — the client always sends the complete state.

No changes to any public-facing API. No impact on external API consumers (there are none).

### 3.4 Agent Tool Changes

Not applicable — this project has no agent or tool-calling layer.

### 3.5 Frontend Changes

**New components:**
- `src/components/PriorityTaskList.jsx` — unified ranked list (R-7, R-8)
- `src/components/UnansweredList.jsx` — merged Slack/Teams/mail list (R-9)
- `src/components/ReportsManager.jsx` — add/edit/remove direct reports (TP-2)

**Modified components:**
- `src/components/TodayMeetingStrip.jsx` — call `fetchWeekMeetings()`, apply `isStartingSoon()` flag (R-1, R-3)
- `src/components/MeetingCalendar.jsx` — call `fetchWeekMeetings()` instead of static import (R-1)
- `src/components/TodoList.jsx` — read/write through `localState` instead of local-only `useState` (TP-1)
- `src/components/StatSummary.jsx` — add a "Focus time remaining today" stat cell (R-2)
- `src/App.jsx` — reorder the `Overview` tab to the Engineer Mode order from PRD Section 7: meetings + focus time, `PriorityTaskList`, `UnansweredList`; existing manager-mode cards (`TeamPulse`, stale `PRList`, `SprintBoard`) move out of the primary Overview flow but remain reachable from their existing tabs, unchanged

**New API modules:**
- `src/api/slack.js`, `src/api/teamsChat.js`, `src/api/outlookMail.js` (R-9)
- `src/api/localState.js` (TP-1)

**New utility modules:**
- `src/utils/priority.js` (R-4)
- Additions to `src/utils/helpers.js`: `computeFocusTime`, `isStartingSoon` (R-2, R-3)

**State management approach:** No new state library introduced. Each data source is fetched in its owning component via `useEffect` + `useState`, consistent with the existing (if inconsistently applied) pattern; `localState` reads/writes are also plain `useEffect`/`useState`, kept deliberately simple given the small data volume.

### 3.6 Key Implementation Decisions

- **Decision:** Local persistence (TP-1) is implemented as a Vite dev-server middleware plugin, not a separate Express process.
  **Alternatives considered:** A standalone Express server run alongside Vite; browser `localStorage`.
  **Rationale:** The user explicitly chose file-on-disk persistence over `localStorage`. A Vite plugin keeps the app to a single `npm run dev` command with no second process to manage, while still writing to a real file on disk.

- **Decision:** Priority score in `rankTasks()` is a pure, synchronous function combining normalized deadline urgency and a blocking tier (report > collaborator > none), recomputed on every render rather than cached or persisted.
  **Alternatives considered:** Server-computed ranking (no backend exists); a learned/weighted model (unwarranted complexity for tens of items).
  **Rationale:** Transparent and cheap given expected data volume (tens of tasks), and easy to unit test as a pure function.

- **Decision:** "Unanswered" (R-9) is defined as "unread" for v1 across Slack, Teams, and Outlook mail, rather than true last-reply-authorship detection.
  **Alternatives considered:** Per-thread reply analysis to determine whether the user specifically was the last to respond.
  **Rationale:** The PRD flagged this definition as unresolved. "Unread" is achievable directly from each platform's existing API fields (`isRead`, conversation `unread_count`, chat `lastMessageReadDateTime` vs. `lastMessagePreview`), while thread-authorship analysis would require materially more integration work across three different API shapes for uncertain benefit. Documented as a known v1 limitation.

- **Decision:** Time-on-task (R-8) is scoped to Jira-tracked items only; GitHub PR-review rows and admin to-do rows show no elapsed time rather than an approximated one (e.g., "time since PR opened" or "time since to-do added").
  **Alternatives considered:** Approximating elapsed time from creation timestamps for non-Jira items.
  **Rationale:** Per the user's explicit choice of Jira-changelog-based tracking, and because "time since created" is a different, misleading signal from "time actually spent working on it." Better to show nothing than a number that looks precise but isn't.

## 4. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Atlassian Cloud REST APIs (Jira, Confluence) commonly block direct browser-origin CORS requests; `jira.js`'s real-fetch path may never have been exercised against a live token | High | High | Validate early: manually test `fetchMyTasks()`/`fetchSprintTickets()` against a real Jira Cloud instance from the browser before building R-5/R-8 further. If CORS blocks it, the "stay client-only" decision needs revisiting specifically for Jira/Confluence — likely a small local CORS-forwarding dev middleware (distinct from and simpler than a full token-proxying backend). |
| GitHub Search API (used by R-6) has a lower authenticated rate limit (30 req/min) than the core REST API | Medium | Medium | Cache `fetchReviewRequestedPRs()` results client-side for a short TTL (e.g., 60s); refresh on user action rather than on a tight polling loop. |
| Slack/Teams "unread" (R-9) doesn't perfectly capture "needs a response from me" — e.g., unread channel chatter not directed at the user | High | Medium | Scope Slack/Teams sources to DMs and @mentions only, not full channel unread counts. Document as a known limitation per the PRD's own unresolved "define unanswered" TODO. |
| `data/local-state.json` (TP-1) has no concurrency control; near-simultaneous writes from multiple tabs could clobber each other | Low | Low | Single-user, single-tab usage is the expected case; document as an accepted limitation rather than building file-locking. |
| Reports list (TP-2) requires manually-entered GitHub usernames/Jira account IDs; typos silently break blocking-detection in R-4 | Medium | Medium | Validate identifier format on entry in `ReportsManager`; visually flag a report whose identifiers matched zero items in the most recent fetch, to surface likely typos. |
| Time-on-task (R-8) requires an extra Jira changelog API call per displayed task | Medium | Low | Only fetch changelog for the top few ranked items actually rendered with elapsed time, not the full task list. |

## 5. Testing Strategy

The project has no existing test infrastructure (TP-3 introduces Vitest + React Testing Library as net-new).

| Req ID | Test Type | Test Description |
|--------|----------|-----------------|
| R-2 | Unit | `computeFocusTime` returns correct remaining hours for a day with overlapping/back-to-back meetings, and floors at 0 when meetings exceed the workday window |
| R-3 | Unit | `isStartingSoon` returns true/false correctly around the threshold boundary, using a fixed/mocked `now` |
| R-4 | Unit | `rankTasks` orders a fixture set so report-blocking outranks collaborator-blocking outranks no-blocking at equal deadlines; and nearer deadlines outrank farther ones at equal blocking tier |
| R-5 | Unit | `fetchMyTasks` mapping logic correctly extracts `duedate` and `issuelinks` from a fixture Jira API response; falls back to mock data when env vars are unset |
| R-6 | Unit | `fetchReviewRequestedPRs` mapping logic correctly maps a fixture GitHub search response; falls back to mock data when no token is set |
| R-7 | Integration (RTL) | `PriorityTaskList` renders items in the order produced by `rankTasks`, with correct source labels and blocking badges |
| R-8 | Unit | Changelog-parsing logic correctly identifies the most recent "In Progress" transition from a fixture changelog payload; elapsed-time display shows nothing (not an error) when changelog fetch fails |
| R-9 | Unit + Integration (RTL) | Per-source mapping functions (Slack/Teams/mail → normalized shape) tested individually; `UnansweredList` tested for correct merge-and-sort-by-recency across all three mocked sources |
| TP-1 | Integration | Middleware `GET`/`PUT /api/state` handlers tested directly against a temp file: read-before-write returns defaults, write-then-read round-trips correctly |
| TP-2 | Integration (RTL) | `ReportsManager` add/edit/remove interactions correctly update persisted state via `localState` |

**Edge cases to cover:** no meetings today; empty task list; empty reports list (blocking detection becomes a no-op, not an error); all tokens absent (entire dashboard still renders from mock data); Jira changelog fetch failure (must not crash the list).

## 6. Task Breakdown

### Workstream A: Persistence & Reports Foundation
| Task | Description | Dependencies | Estimated Complexity |
|------|------------|-------------|---------------------|
| A-1 | Build Vite dev-server middleware plugin serving `GET`/`PUT /api/state` against `data/local-state.json` | None | M |
| A-2 | Build `src/api/localState.js` client wrapper (`load()`/`save()`) | A-1 | S |
| A-3 | Build `ReportsManager.jsx` (add/edit/remove reports), wired to `localState` | A-2 | M |
| A-4 | Migrate `TodoList.jsx` to read/write admin tasks and priority overrides through `localState` instead of in-memory `useState` | A-2 | M |

### Workstream B: Calendar & Focus Time (US-1)
| Task | Description | Dependencies | Estimated Complexity |
|------|------------|-------------|---------------------|
| B-1 | Wire `TodayMeetingStrip` and `MeetingCalendar` to `fetchWeekMeetings()` instead of static `MOCK_MEETINGS` import | None | S |
| B-2 | Add `computeFocusTime` and `isStartingSoon` to `helpers.js` | None | S |
| B-3 | Add focus-time stat cell to `StatSummary` and starting-soon flag to `TodayMeetingStrip` | B-1, B-2 | S/M |

### Workstream C: Prioritized Task Engine (US-2)
| Task | Description | Dependencies | Estimated Complexity |
|------|------------|-------------|---------------------|
| C-1 | Extend `jira.js` with `fetchMyTasks()` including `duedate` + `issuelinks` | None | M |
| C-2 | Extend `github.js` with `fetchReviewRequestedPRs()` via cross-repo search API | None | M |
| C-3 | Build `src/utils/priority.js` (`rankTasks`) as a pure function with fixture-based tests | None | M |
| C-4 | Build `PriorityTaskList.jsx` combining C-1, C-2, admin tasks (A-4), and reports (A-3) through C-3 | A-3, A-4, C-1, C-2, C-3 | L |

### Workstream D: Time on Task (US-3)
| Task | Description | Dependencies | Estimated Complexity |
|------|------------|-------------|---------------------|
| D-1 | Add `fetchIssueChangelog(issueKey)` to `jira.js`, parse most recent "In Progress" transition | None | M |
| D-2 | Integrate elapsed-time display into `PriorityTaskList` for Jira-sourced rows | C-4, D-1 | S |

### Workstream E: Unanswered Inbox (US-4)
| Task | Description | Dependencies | Estimated Complexity |
|------|------------|-------------|---------------------|
| E-1 | Build `src/api/slack.js` — unread DMs/mentions, mock fallback | None | M |
| E-2 | Build `src/api/teamsChat.js` — unread Teams chats via MS Graph, mock fallback | None | M |
| E-3 | Build `src/api/outlookMail.js` — unread inbox messages via MS Graph, mock fallback | None | S/M |
| E-4 | Build `UnansweredList.jsx` merging E-1/E-2/E-3, sorted by recency | E-1, E-2, E-3 | M |

### Workstream F: Integration & Testing
| Task | Description | Dependencies | Estimated Complexity |
|------|------------|-------------|---------------------|
| F-1 | Introduce Vitest + React Testing Library (net-new test infra) | None | S/M |
| F-2 | Restructure `App.jsx` Overview tab to Engineer Mode order (meetings+focus, PriorityTaskList, UnansweredList) | B-3, D-2, E-4 | M |
| F-3 | Write unit/integration tests per Section 5 | F-1, and each corresponding implementation task | L |

## 7. Parallel Workstreams

```
Workstream A (Persistence)        Workstream B (Calendar)         Workstream C (Task Engine)
  A-1 ──► A-2 ──┬─► A-3 ──┐          B-1 ──┐                         C-1 ──┐
                └─► A-4 ──┤          B-2 ──┴─► B-3 ──┐                C-2 ──┼─► C-4
                          │                          │                C-3 ──┘   │
Workstream D (Time on Task)        │                 │                         │
  D-1 ──────────────────────────────┼─────────────────┼─────────────► D-2 ◄────┘
                                    │                 │                 │
Workstream E (Unanswered Inbox)    │                 │                 │
  E-1 ──┐                          │                 │                 │
  E-2 ──┼─► E-4 ─────────────────────────────────────┼─────────────────┤
  E-3 ──┘                          │                 │                 │
                                    ▼                 ▼                 ▼
Workstream F (Integration)                       F-2 (Overview reorg) ◄┘
  F-1 (test infra, independent) ──────────────────────► F-3 (tests, depends on everything)
```

- **Can start immediately (no dependencies):** A-1, B-1, B-2, C-1, C-2, C-3, D-1, E-1, E-2, E-3, F-1
- **Blocked until:** A-1+A-2 complete before A-3/A-4 can start; A-3+A-4+C-1+C-2+C-3 complete before C-4 can start; C-4+D-1 complete before D-2 can start; E-1+E-2+E-3 complete before E-4 can start; B-3+D-2+E-4 complete before F-2 can start; everything complete before F-3's final integration tests (per-piece unit tests can be written alongside their implementation task)
- **Fully parallel:** Workstreams A, B, C, D (up to C-4/D-1), and E have no cross-dependencies until they converge at C-4, D-2, and E-4 respectively
- **Integration point:** F-2, where the Overview tab is reassembled from B-3 (calendar/focus time), D-2 (ranked tasks with time-on-task), and E-4 (unanswered inbox) — this is where joint testing of the full Engineer Mode view happens

## 8. Definition of Done

- [ ] All requirements (R-1 through R-9) pass their acceptance criteria
- [ ] All unit and integration tests (Section 5) pass
- [ ] No regressions in existing tabs (`Calendar`, `Pull Requests`, `Sprint Board`, `PTO Calendar`, `Docs`, `My Tasks`) or their underlying mock-fallback behavior
- [ ] `data/local-state.json` round-trips correctly (write, reload, read) with no data loss
- [ ] Dashboard renders fully from mock data alone when all `VITE_*` tokens are unset (no crashes, no blank states)
- [ ] The Jira/Confluence CORS risk (Section 4) has been validated against a real token before this is marked done — if blocked, the architecture decision in Section 2 is revisited before shipping R-5/R-8
- [ ] README updated to reflect the new Engineer Mode Overview layout and the `data/local-state.json` persistence file (add to `.gitignore` alongside `.env`)
