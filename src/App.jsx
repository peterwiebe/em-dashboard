import { useState } from "react";
import { MOCK_PRS, MOCK_JIRA } from "./data/mockData";
import ConfigBanner from "./components/ConfigBanner";
import StatSummary from "./components/StatSummary";
import TeamPulse from "./components/TeamPulse";
import TodayMeetingStrip from "./components/TodayMeetingStrip";
import PRList from "./components/PRList";
import TodoList from "./components/TodoList";
import SprintBoard from "./components/SprintBoard";
import MeetingCalendar from "./components/MeetingCalendar";
import PTOCalendar from "./components/PTOCalendar";
import ConfluenceDocs from "./components/ConfluenceDocs";
import PriorityTaskList from "./components/PriorityTaskList";
import UnansweredList from "./components/UnansweredList";

const TABS = ["Overview", "Calendar", "Pull Requests", "Sprint Board", "Team", "PTO Calendar", "Docs", "My Tasks"];

export default function EMDashboard() {
  const [tab, setTab] = useState("Overview");
  const [showConfig, setShowConfig] = useState(true);
  const now = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-logo">em.dashboard</div>
        <div className="topbar-meta">
          <div className="topbar-date">{now}</div>
          <div className="avatar">P</div>
        </div>
      </header>

      <nav className="nav-tabs">
        {TABS.map(t => (
          <button key={t} className={`tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      <main className="main">
        {showConfig && <ConfigBanner onDismiss={() => setShowConfig(false)} />}

        {tab === "Overview" && (
          <>
            <StatSummary prs={MOCK_PRS} />
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="card-title-icon">📆</span> Today's Meetings</div>
              </div>
              <div className="card-body"><TodayMeetingStrip /></div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="card-title-icon">✅</span> Priority Tasks</div>
              </div>
              <div className="card-body"><PriorityTaskList /></div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="card-title-icon">📭</span> Unanswered</div>
              </div>
              <div className="card-body"><UnansweredList /></div>
            </div>
          </>
        )}

        {tab === "Calendar" && <MeetingCalendar />}

        {tab === "Pull Requests" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🔀</span> All Pull Requests — sorted by staleness</div>
              <div style={{ display:"flex", gap:8 }}>
                <span className="badge badge-red">{MOCK_PRS.filter(p => p.ageHours >= 168).length} critical</span>
                <span className="badge badge-teal">{MOCK_PRS.filter(p => p.reviewers.every(r => r==="approved") && p.reviewers.length > 0).length} ready</span>
              </div>
            </div>
            <div style={{ padding:"10px 18px", borderBottom:"1px solid var(--border)", display:"flex", gap:8, alignItems:"center", fontSize:11, color:"var(--muted)" }}>
              {[["var(--green)","<1d"],["var(--amber)","1–3d"],["#f0783a","3–7d"],["var(--red)","7d+"]].map(([c,l]) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}
                </span>
              ))}
            </div>
            <div className="card-body"><PRList prs={MOCK_PRS} /></div>
          </div>
        )}

        {tab === "Sprint Board" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🗂️</span> Sprint 44 — Jira</div>
              <span className="badge badge-muted">{Object.values(MOCK_JIRA).flat().length} tickets</span>
            </div>
            <div className="card-body"><SprintBoard /></div>
          </div>
        )}

        {tab === "Team" && (
          <div className="card">
            <div className="card-header"><div className="card-title"><span className="card-title-icon">👥</span> Team Pulse</div></div>
            <div className="card-body"><TeamPulse /></div>
          </div>
        )}

        {tab === "PTO Calendar" && (
          <div className="card">
            <div className="card-header"><div className="card-title"><span className="card-title-icon">📅</span> Team PTO — This Week</div></div>
            <div className="card-body"><PTOCalendar /></div>
          </div>
        )}

        {tab === "Docs" && (
          <div className="card">
            <div className="card-header"><div className="card-title"><span className="card-title-icon">📖</span> Recently Updated — Confluence</div></div>
            <div className="card-body"><ConfluenceDocs /></div>
          </div>
        )}

        {tab === "My Tasks" && (
          <div className="card">
            <div className="card-header"><div className="card-title"><span className="card-title-icon">✅</span> My Tasks</div></div>
            <div className="card-body"><TodoList /></div>
          </div>
        )}
      </main>
    </div>
  );
}
