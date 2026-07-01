import { MOCK_MEETINGS, MOCK_JIRA, PTO_THIS_WEEK, TODAY_DAY_IDX } from "../data/mockData";

export default function StatSummary({ prs }) {
  const stalePRs  = prs.filter(p => p.ageHours >= 72 && !p.draft).length;
  const readyPRs  = prs.filter(p => p.reviewers.length > 0 && p.reviewers.every(r => r==="approved") && !p.draft).length;
  const ptoCount  = Object.keys(PTO_THIS_WEEK).length;
  const todayMtgs = MOCK_MEETINGS.filter(m => m.dayIdx === TODAY_DAY_IDX).length;

  return (
    <div className="stat-row" style={{ borderRadius:"var(--r)", overflow:"hidden", border:"1px solid var(--border)" }}>
      <div className="stat-cell"><div className="stat-label">Open PRs</div><div className="stat-value teal">{prs.filter(p=>!p.draft).length}</div></div>
      <div className="stat-cell"><div className="stat-label">Stale (&gt;3d)</div><div className={`stat-value ${stalePRs>2?"red":"amber"}`}>{stalePRs}</div></div>
      <div className="stat-cell"><div className="stat-label">Ready to Merge</div><div className="stat-value teal">{readyPRs}</div></div>
      <div className="stat-cell"><div className="stat-label">On PTO</div><div className="stat-value">{ptoCount}</div></div>
      <div className="stat-cell"><div className="stat-label">In Progress</div><div className="stat-value">{MOCK_JIRA["in-progress"].length}</div></div>
      <div className="stat-cell"><div className="stat-label">Meetings Today</div><div className="stat-value amber">{todayMtgs}</div></div>
    </div>
  );
}
