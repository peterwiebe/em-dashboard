# EM Dashboard

Engineering manager command center — GitHub PRs, Jira sprint board, Confluence docs, team PTO, meeting calendar, and task list.

Built with React + Vite. Mock data throughout; ready to wire up real API tokens.

---

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

---

## Push to GitHub (one-time setup)

```bash
# 1. Create a new repo on github.com (no README, no .gitignore)
#    e.g. https://github.com/YOUR_USERNAME/em-dashboard

# 2. From this folder:
git init
git add .
git commit -m "feat: initial EM dashboard prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/em-dashboard.git
git push -u origin main
```

---

## Wiring up real data

### GitHub (Pull Requests)
Replace `MOCK_PRS` in `src/App.jsx`:
```js
// GET https://api.github.com/repos/{owner}/{repo}/pulls?state=open&sort=created&direction=asc
// Headers: Authorization: Bearer YOUR_GITHUB_TOKEN
const res = await fetch('https://api.github.com/repos/tour-digital/core-api/pulls?state=open', {
  headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
})
const data = await res.json()
// Map: data.map(pr => ({ id: pr.id, title: pr.title, repo: pr.base.repo.full_name,
//   author: pr.user.login, ageHours: (Date.now() - new Date(pr.created_at)) / 36e5,
//   reviewers: [], draft: pr.draft }))
```

### Jira (Sprint Board)
Replace `MOCK_JIRA`:
```js
// GET https://YOUR_DOMAIN.atlassian.net/rest/api/3/search
//   ?jql=project=DIG AND sprint in openSprints()
//   &fields=summary,status,assignee
// Headers: Authorization: Basic base64(email:api_token)
```

### Confluence (Recent Docs)
Replace `MOCK_CONFLUENCE`:
```js
// GET https://YOUR_DOMAIN.atlassian.net/wiki/rest/api/content/search
//   ?cql=space=ENG AND lastModified > now("-7d")&expand=version,space
// Headers: Authorization: Basic base64(email:api_token)
```

### Outlook Calendar (Meeting Calendar)
Replace `MOCK_MEETINGS`:
```js
// GET https://graph.microsoft.com/v1.0/me/calendarView
//   ?startDateTime=<week_start_ISO>&endDateTime=<week_end_ISO>
//   &$select=subject,start,end,location,attendees,isOnlineMeeting
// Headers: Authorization: Bearer YOUR_MS_GRAPH_TOKEN
//
// Map: events.map(ev => ({
//   id: ev.id, title: ev.subject,
//   type: classifyMeeting(ev.subject),   // your own heuristic
//   dayIdx: new Date(ev.start.dateTime).getDay() - 1,
//   startH: new Date(ev.start.dateTime).getHours() + new Date(ev.start.dateTime).getMinutes()/60,
//   durationH: (new Date(ev.end.dateTime) - new Date(ev.start.dateTime)) / 36e5,
//   location: ev.location?.displayName || '',
//   attendees: ev.attendees.map(a => a.emailAddress.name)
// }))
```

---

## Project structure

```
em-dashboard/
├── src/
│   ├── App.jsx       ← entire dashboard (split into separate files as it grows)
│   └── main.jsx      ← React entry point
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Next steps

- Split `App.jsx` into `components/` (PRList, MeetingCalendar, SprintBoard, etc.)
- Add a `src/api/` layer for each integration
- Add `.env` for tokens (`VITE_GITHUB_TOKEN`, `VITE_JIRA_TOKEN`, etc.)
- Consider React Query for data fetching + caching
