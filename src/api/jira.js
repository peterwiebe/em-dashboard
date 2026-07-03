import { MOCK_JIRA, MOCK_MY_TASKS } from "../data/mockData";

const DOMAIN = import.meta.env.VITE_JIRA_DOMAIN;  // e.g. "yourcompany.atlassian.net"
const EMAIL  = import.meta.env.VITE_JIRA_EMAIL;
const TOKEN  = import.meta.env.VITE_JIRA_TOKEN;
const PROJECT = import.meta.env.VITE_JIRA_PROJECT ?? "DIG";

function basicAuth() {
  return btoa(`${EMAIL}:${TOKEN}`);
}

const STATUS_MAP = {
  "To Do":       "backlog",
  "In Progress": "in-progress",
  "In Review":   "review",
  "Done":        "done",
};

export async function fetchSprintTickets() {
  if (!DOMAIN || !EMAIL || !TOKEN) return MOCK_JIRA;

  const jql = encodeURIComponent(`project=${PROJECT} AND sprint in openSprints() ORDER BY status ASC`);
  const res = await fetch(
    `https://${DOMAIN}/rest/api/3/search?jql=${jql}&fields=summary,status,assignee&maxResults=50`,
    { headers: { Authorization: `Basic ${basicAuth()}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Jira API error: ${res.status}`);
  const { issues } = await res.json();

  const board = { backlog:[], "in-progress":[], review:[], done:[] };
  for (const issue of issues) {
    const col = STATUS_MAP[issue.fields.status.name] ?? "backlog";
    board[col].push({
      id:       issue.key,
      title:    issue.fields.summary,
      assignee: issue.fields.assignee?.displayName ?? "Unassigned",
    });
  }
  return board;
}

// Outward "Blocks" links = tickets that *this* issue blocks (used to rank
// tasks that are holding up a report or collaborator ahead of the person's
// own deadline-only work).
export function extractBlockedKeys(issuelinks = []) {
  return issuelinks
    .filter(link => link.type?.name === "Blocks" && link.outwardIssue)
    .map(link => link.outwardIssue.key);
}

export function mapIssueToMyTask(issue) {
  return {
    id:      issue.key,
    title:   issue.fields.summary,
    status:  STATUS_MAP[issue.fields.status.name] ?? "backlog",
    dueDate: issue.fields.duedate ?? null,
    blocks:  extractBlockedKeys(issue.fields.issuelinks),
  };
}

export async function fetchMyTasks() {
  if (!DOMAIN || !EMAIL || !TOKEN) return MOCK_MY_TASKS;

  const jql = encodeURIComponent(`project=${PROJECT} AND assignee = currentUser() AND resolution = Unresolved ORDER BY duedate ASC`);
  const res = await fetch(
    `https://${DOMAIN}/rest/api/3/search?jql=${jql}&fields=summary,status,duedate,issuelinks&maxResults=50`,
    { headers: { Authorization: `Basic ${basicAuth()}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Jira API error: ${res.status}`);
  const { issues } = await res.json();

  return issues.map(mapIssueToMyTask);
}

// Changelog "values" entries are returned oldest-first; a ticket can cycle
// through "In Progress" more than once (e.g. paused and resumed), so this
// scans all of them and keeps the most recent, rather than the first match.
export function findLastInProgressTransition(changelogValues = []) {
  let latest = null;
  for (const entry of changelogValues) {
    const statusChange = entry.items?.find(
      item => item.field === "status" && item.toString === "In Progress"
    );
    if (!statusChange) continue;
    const createdAt = new Date(entry.created);
    if (!latest || createdAt > latest) latest = createdAt;
  }
  return latest ? latest.toISOString() : null;
}

// Returns the ISO timestamp of the most recent "In Progress" transition for
// a ticket, or null if there isn't one (or no Jira token is configured — mock
// mode has no per-ticket changelog history to draw from, so this returns
// null rather than fake data; callers should render nothing, same as a
// fetch failure, per spec R-8's documented limitation).
export async function fetchIssueChangelog(issueKey) {
  if (!DOMAIN || !EMAIL || !TOKEN) return null;

  const res = await fetch(
    `https://${DOMAIN}/rest/api/3/issue/${issueKey}/changelog?maxResults=100`,
    { headers: { Authorization: `Basic ${basicAuth()}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Jira API error: ${res.status}`);
  const { values } = await res.json();

  return findLastInProgressTransition(values);
}
