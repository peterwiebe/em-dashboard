import { MOCK_JIRA } from "../data/mockData";

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
