import { TEAM } from "../data/mockData";

const DOT_CLS = { in:"s-in", out:"s-out", mtg:"s-mtg", pto:"s-pto" };

export default function TeamPulse() {
  return (
    <div className="pulse-grid">
      {TEAM.map(m => (
        <div key={m.id} className="pulse-member">
          <div className="pulse-avatar" style={{ background:m.color, color:m.textColor }}>{m.initials}</div>
          <div>
            <div className="pulse-name">{m.name.split(" ")[0]}</div>
            <div className="pulse-status">
              <div className={`status-dot ${DOT_CLS[m.status]}`} />
              {m.statusLabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
