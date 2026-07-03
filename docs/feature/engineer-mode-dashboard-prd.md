# PRD: Engineer Mode Dashboard (em-dashboard v1)

## 1. North Star

> As a player-coach engineer, I need a single view of all real-time demands on my time — meetings, deadlines, and tasks that are blocking others (my reports first, other collaborators second) — so I always know my top priority and never unknowingly become the bottleneck.

## 2. Problem Statement

Today, the information needed to know "what should I be working on right now" and "who is waiting on me" is scattered across five disconnected tools: Outlook (calendar + email), Jira (tasks), Slack, Teams, and GitHub (PRs). The user checks these tools dozens of times a day, at an estimated cost of **~1 hour/day of lost productivity** `[TODO: measure — track actual time lost for one week before finalizing this estimate]`. Because there is no single ranked view of demands and blocking relationships, priority is currently decided by memory/gut feel rather than by any objective signal, which has led to real misses — including missing a report's extended PTO until the day it started, and missing meetings until it was too late to prepare.

## 3. Customer

- **Primary customer:** The user themself — a player-coach software engineer / engineering manager who currently spends more time in the "player" (individual contributor) role than the "coach" (manager) role, due to business needs, but is actively trying to grow into the coach role. This is a single-user tool built for personal use first.
- **Key characteristics:** Has direct reports; is relatively new to management; works across Outlook, Jira, Slack, Teams, and GitHub daily; is frequently the de facto (not always formally assigned) reviewer on team PRs.
- **Non-customers:** Other EMs/SWEs as a general audience — this is explicitly out of scope for v1, which is single-user, not a multi-tenant product. Individual contributors with no direct reports are also not the target, since the "unblocking my reports" mechanic assumes reports exist.

## 4. Evidence & Validation

| Evidence | Source | Status |
|----------|--------|--------|
| Missed a direct report's extended PTO until the day they left | Personal anecdote (specific incident) | Validated (occurred) |
| Missed meetings due to lack of upfront visibility into the day | Personal anecdote | Validated (occurred); frequency unknown — `[TODO: measure]` |
| Switches between Outlook/Jira/Slack/Teams/GitHub "dozens of times a day" | Self-reported estimate | `[TODO: validate — instrument or log actual switch count]` |
| ~1 hour/day of lost productivity from context-switching | Self-reported estimate | `[TODO: validate — track for one week]` |
| Frequently the de facto PR reviewer despite not being the formally assigned reviewer | Self-reported | Validated as a stated fact; downstream data-feasibility is unvalidated (see risks) |

**Unvalidated assumptions:**
- That solving engineer-mode context-switching actually recovers close to the estimated 1 hour/day, rather than a smaller amount.
- That task priority can be reliably computed from deadline + blocking-relationship metadata already present in Jira/GitHub, rather than requiring manual input.
- That "PRs I am blocking" can be reliably detected even when the user is not the formally assigned reviewer.
- That having this information consolidated in one place actually changes behavior, rather than just adding another screen to check.

## 5. Current State & Pain

- To determine "what should I work on now" today, the user separately checks: Jira (task list), Outlook (calendar and inbox), Slack and Teams (messages), and GitHub (PR review requests) — each a distinct context switch, repeated dozens of times per day.
- The workflow breaks down because there is no single ranked view: priority is decided by memory rather than an objective combination of deadline and blocking impact, so it's possible to lose track of the highest-impact task.
- It also breaks down because there is no single "here is your day" moment each morning, which has led to being blindsided by meetings.
- Measurable cost: ~1 hour/day estimated lost productivity `[TODO: measure]`; dozens of tool switches/day `[TODO: measure]`; frequency of missed meetings or blocking incidents per quarter is not currently tracked `[TODO: measure]`.

## 6. User Stories

**US-1: See today's meetings and available focus time**
As the player-coach engineer, I want to see all of today's meetings and how much unscheduled/focus time remains between them, so that I know upfront how much of my day is already claimed and don't get blindsided by a meeting I forgot about.

**Acceptance criteria:**
- [ ] Dashboard shows all of today's calendar events, pulled from Outlook, in chronological order
- [ ] Dashboard calculates and displays total remaining unscheduled/focus time for the day
- [ ] A meeting starting soon is visually flagged so it isn't missed

**North star link:** Directly surfaces "demands on my time" for the day — the calendar half of the north star.

---

**US-2: See my prioritized task list, ranked by deadline and blocking impact**
As the player-coach engineer, I want my open tasks (Jira tickets, PR reviews, admin tasks) ranked by a priority score based on deadline proximity and whether the task is blocking a report or collaborator, so that I always know what to work on next without manually cross-referencing multiple tools.

**Acceptance criteria:**
- [ ] Dashboard pulls open tasks assigned to the user from Jira
- [ ] Dashboard pulls PRs where the user is the requested reviewer, plus a best-effort signal for PRs where the user is the de facto (unassigned) reviewer `[TODO: validate feasibility of detecting informal review responsibility]`
- [ ] Tasks are ranked by a combination of deadline proximity and blocking impact, weighting tasks that block a direct report higher than tasks blocking other collaborators
- [ ] Each ranked task indicates who or what it is blocking, if applicable

**North star link:** This is the core "know my top priority, don't block others" mechanic — the direct expression of the north star.

---

**US-3: See how long I've been working on my current task**
As the player-coach engineer, I want to see elapsed time on my current top task, so that I know when to push through to finish it versus when to communicate a delay to the people waiting on me.

**Acceptance criteria:**
- [ ] Dashboard displays elapsed time since a task was marked in-progress
- [ ] Elapsed time is visible without requiring a manually-operated timer `[TODO: determine feasible data source — e.g., Jira status-change timestamp vs. manual start]`

**North star link:** Directly supports the stated definition of success — communicating delay to blocked parties rather than letting them wait silently.

---

**US-4: See unanswered messages and emails needing a response**
As the player-coach engineer, I want a consolidated list of unanswered Slack, Teams, and email messages, so that a request from a collaborator doesn't sit unnoticed and become a delay I caused.

**Acceptance criteria:**
- [ ] Dashboard shows unread/unresponded messages from Slack, Teams, and Outlook email in one consolidated list
- [ ] This list is visually distinct from the task list (a message is not automatically treated as a task)
- [ ] `[TODO: precisely define "unanswered" per platform — e.g., unread vs. no reply sent since the other party's last message]`

**North star link:** An unanswered message from a report or collaborator is itself a demand on my time that, if ignored, turns me into the bottleneck.

## 7. Proposed Solution (User Experience)

Happy path, first thing each morning:
1. User opens the dashboard. The first section shows today's meetings in order, plus total remaining focus time for the day (US-1).
2. Below that, the prioritized task list shows open tasks and PR reviews ranked by deadline and blocking impact, with elapsed time shown per task so the user can see at a glance whether something needs to be pushed through or escalated (US-2, US-3).
3. Below that, a consolidated list of unanswered messages/emails shows anything still waiting on a response (US-4).

Each section maps directly to one or more of the user stories above; no additional sections exist in v1.

## 8. Success Criteria

- Time to determine "what should I work on now" drops from dozens of tool switches (~1 hour/day estimated) to under `[TODO: set target, e.g., X minutes/day]`.
- Missed meetings/calendar events trend toward zero per month `[TODO: set target and baseline]`.
- Self-reported frequency of "I was an unrecognized bottleneck for a report or collaborator" decreases `[TODO: define a measurable self-rating cadence, e.g., weekly 1-5 rating]`.
- **Definition of good enough for v1:** the dashboard reliably surfaces today's meetings, a ranked task list, and unanswered messages each morning, using only data already present in Outlook/Jira/Slack/Teams/GitHub — no new manual data entry required beyond what these tools already capture.

## 9. Open Questions & Risks

- **Data accessibility is the single biggest risk** — the user stated this is the only thing that would make the project not worth doing. Reliable API/data access to Outlook (calendar + mail), Jira, Slack, Teams, and GitHub needs to be confirmed before further investment.
- How to detect "informal" PR review responsibility, since GitHub's assigned-reviewer metadata doesn't reflect who actually ends up reviewing.
- How exactly to weight deadline proximity vs. blocking impact in the priority ranking — needs further specification.
- How to measure "time on task" without requiring extra manual effort from the user.
- Whether the ~1 hour/day lost-productivity estimate holds up once measured — if it's significantly lower, the ROI case for this project should be revisited.

## 10. Out of Scope

- **Team-wide PR staleness report** (all PRs older than one business day, regardless of who is blocking) — deferred to a future "Manager Mode" phase. Rationale: this measures team review health, not the user's own blocking behavior, so it doesn't serve the v1 north star.
- **Reports' PTO calendar** — deferred to Manager Mode. Rationale: this is a staffing/project-continuity concern, not a case of the user personally blocking someone, so it's a different job-to-be-done than v1's focus.
- **Performance metrics for products** — deferred to Manager Mode.
- **Notes on people/projects** — deferred to Manager Mode.
- **Multi-user/multi-tenant product for other EMs/SWEs** — cut/deferred indefinitely. v1 is single-user, built for the primary customer only.
