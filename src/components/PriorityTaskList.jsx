import { useEffect, useState } from "react";
import { fetchMyTasks, fetchSprintTickets } from "../api/jira";
import { fetchReviewRequestedPRs } from "../api/github";
import { load } from "../api/localState";
import { rankTasks } from "../utils/priority";

const SOURCE_LABEL = { jira: "Jira", github: "GitHub", admin: "Task" };

// fetchSprintTickets() returns assignees by ticket key, which is the only
// way to resolve "this Jira task blocks ticket DIG-437" into "...which is
// Mia Chen's ticket" — fetchMyTasks() only returns *your* tickets, not the
// ones you block.
export function buildAssigneeMap(sprintBoard) {
  const map = {};
  for (const column of Object.values(sprintBoard)) {
    for (const ticket of column) map[ticket.id] = ticket.assignee;
  }
  return map;
}

// A task can block multiple tickets with different assignees; prefer a
// report over a plain collaborator for ranking purposes, matching
// rankTasks' report-first tier ordering.
export function resolveJiraBlockingIdentifier(blockedKeys, assigneeMap, reports) {
  if (!blockedKeys?.length) return null;
  const assignees = blockedKeys.map(key => assigneeMap[key]).filter(Boolean);
  const reportMatch = assignees.find(name => reports.some(r => r.name === name));
  return reportMatch ?? assignees[0] ?? null;
}

export function normalizeJiraTask(task, assigneeMap, reports) {
  return {
    id: `jira:${task.id}`,
    source: "jira",
    title: task.title,
    dueDate: task.dueDate,
    blockingIdentifier: resolveJiraBlockingIdentifier(task.blocks, assigneeMap, reports),
    ref: task.id,
  };
}

export function normalizeGithubPR(pr) {
  return {
    id: `github:${pr.id}`,
    source: "github",
    title: pr.title,
    dueDate: null,
    blockingIdentifier: pr.author,
    ref: pr.repo,
  };
}

export function normalizeAdminTodo(todo, reports) {
  const report = reports.find(r => r.id === todo.blocksReportId);
  return {
    id: `admin:${todo.id}`,
    source: "admin",
    title: todo.text,
    dueDate: null,
    blockingIdentifier: report?.name ?? null,
    ref: todo.priority,
  };
}

export default function PriorityTaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyTasks(), fetchSprintTickets(), fetchReviewRequestedPRs(), load()]).then(
      ([myTasks, sprintBoard, prs, state]) => {
        if (cancelled) return;

        const reports = state.reports ?? [];
        const openTodos = (state.todos ?? []).filter(t => !t.done);
        const assigneeMap = buildAssigneeMap(sprintBoard);

        const normalized = [
          ...myTasks.map(t => normalizeJiraTask(t, assigneeMap, reports)),
          ...prs.map(normalizeGithubPR),
          ...openTodos.map(t => normalizeAdminTodo(t, reports)),
        ];

        setTasks(rankTasks(normalized, reports));
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return <div className="empty"><div className="empty-icon">✅</div>Nothing on your plate right now</div>;
  }

  return (
    <div className="card-scroll">
      {tasks.map(t => (
        <div key={t.id} className="todo-item">
          <span className="badge badge-muted">{SOURCE_LABEL[t.source]}</span>
          <span className="todo-text">{t.title}</span>
          {t.dueDate && <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{t.dueDate}</span>}
          {t.blockingIdentifier && <span className="badge badge-red">blocks: {t.blockingIdentifier}</span>}
        </div>
      ))}
    </div>
  );
}
