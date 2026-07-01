import { stalenessColor, reviewDotColor } from "../utils/helpers";

export default function PRList({ prs }) {
  return (
    <div className="card-scroll">
      {[...prs].sort((a,b) => b.ageHours - a.ageHours).map(pr => {
        const { cls, label, ageCls } = stalenessColor(pr.ageHours);
        return (
          <div key={pr.id} className="pr-item">
            <div className={`pr-stale-bar ${cls}`} />
            <div className="pr-info">
              <div className="pr-title">
                {pr.draft && <span style={{ color:"var(--muted)", marginRight:6, fontSize:10 }}>DRAFT</span>}
                {pr.title}
              </div>
              <div className="pr-meta">
                <span className="pr-repo">{pr.repo}</span>
                <span style={{ fontSize:11, color:"var(--muted)" }}>{pr.author}</span>
                <span className={`pr-age ${ageCls}`} style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>{label}</span>
                <div className="pr-reviews">
                  {pr.reviewers.map((r,i) => <div key={i} className="review-dot" style={{ background:reviewDotColor(r) }} />)}
                </div>
                {pr.reviewers.length > 0 && pr.reviewers.every(r => r==="approved") && <span className="badge badge-teal">Ready</span>}
                {pr.reviewers.some(r => r==="changes") && <span className="badge badge-red">Changes req.</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
