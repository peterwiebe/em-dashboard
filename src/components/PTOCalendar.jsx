import { TEAM, PTO_THIS_WEEK } from "../data/mockData";
import { getWeekDays } from "../utils/helpers";

export default function PTOCalendar() {
  const days = getWeekDays(0);
  const todayDate = new Date().getDate();

  return (
    <div className="calendar-grid">
      <div className="cal-week-header">
        <div />
        {days.map(d => (
          <div key={d.idx} className="cal-day-label" style={{ color: d.date===todayDate ? "var(--amber)" : undefined }}>
            {d.label}<br /><span style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>{d.date}</span>
          </div>
        ))}
      </div>
      {TEAM.map(m => (
        <div key={m.id} className="cal-row">
          <div className="cal-member">{m.name.split(" ")[0]}</div>
          {days.map(d => {
            const isPTO = PTO_THIS_WEEK[m.id]?.includes(d.idx);
            const isToday = d.date === todayDate;
            return (
              <div
                key={d.idx}
                className={`cal-cell ${isPTO?"pto":""} ${isToday?"today-col":""}`}
                title={isPTO ? `${m.name} — PTO` : m.name}
              >
                {isPTO && <div className="cal-cell-label">PTO</div>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
