import { useEffect, useState } from "react";
import { load, save } from "../api/localState";

function isValidGithubUsername(v) {
  return /^[a-zA-Z0-9-]{1,39}$/.test(v);
}

export default function ReportsManager() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [jiraAccountId, setJiraAccountId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    load().then(state => {
      if (!cancelled) {
        setReports(state.reports ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Re-loads the full state right before saving (rather than reusing a
  // copy captured at mount) so a concurrent edit elsewhere in the app
  // (e.g. TodoList) is less likely to get clobbered — see A-1's documented
  // no-concurrency-control limitation.
  async function persist(nextReports) {
    const state = await load();
    await save({ ...state, reports: nextReports });
    setReports(nextReports);
  }

  function addReport() {
    if (!name.trim()) return;
    const trimmedGithub = githubUsername.trim();
    if (trimmedGithub && !isValidGithubUsername(trimmedGithub)) {
      setError("GitHub username can only contain letters, numbers, and hyphens.");
      return;
    }

    setError("");
    const newReport = {
      id: `${Date.now()}`,
      name: name.trim(),
      githubUsername: trimmedGithub || null,
      jiraAccountId: jiraAccountId.trim() || null,
    };
    persist([...reports, newReport]);
    setName("");
    setGithubUsername("");
    setJiraAccountId("");
  }

  function removeReport(id) {
    persist(reports.filter(r => r.id !== id));
  }

  if (loading) return null;

  return (
    <>
      <div className="todo-input-row">
        <input
          className="todo-input"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addReport()}
        />
        <input
          className="todo-input"
          placeholder="GitHub username (optional)"
          value={githubUsername}
          onChange={e => setGithubUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addReport()}
        />
        <input
          className="todo-input"
          placeholder="Jira account ID (optional)"
          value={jiraAccountId}
          onChange={e => setJiraAccountId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addReport()}
        />
        <button className="btn btn-teal" onClick={addReport}>Add</button>
      </div>
      {error && <div style={{ color: "var(--red)", fontSize: 12, padding: "6px 18px 0" }}>{error}</div>}
      <div className="card-scroll">
        {reports.length === 0 && <div className="empty">No direct reports added yet</div>}
        {reports.map(r => (
          <div key={r.id} className="todo-item">
            <span className="todo-text">{r.name}</span>
            {r.githubUsername && <span style={{ fontSize: 11, color: "var(--muted)" }}>@{r.githubUsername}</span>}
            {r.jiraAccountId && <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.jiraAccountId}</span>}
            <button className="todo-delete" onClick={() => removeReport(r.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
