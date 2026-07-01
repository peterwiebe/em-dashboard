import { MOCK_MEETINGS, TODAY_DAY_IDX } from "../data/mockData";
import { fmtHour, evTypeColor } from "../utils/helpers";

export default function TodayMeetingStrip() {
  const todayEvs = MOCK_MEETINGS.filter(m => m.dayIdx === TODAY_DAY_IDX).sort((a,b) => a.startH - b.startH);

  if (todayEvs.length === 0) {
    return <div className="empty"><div className="empty-icon">🎉</div>No meetings today</div>;
  }

  return (
    <>
      {todayEvs.map(ev => (
        <div key={ev.id} className="mini-meeting">
          <div className="mini-dot" style={{ background: evTypeColor(ev.type) }} />
          <div className="mini-time">{fmtHour(ev.startH)}</div>
          <div className="mini-title">{ev.title}</div>
          {ev.location && <div className="mini-loc">📍 {ev.location}</div>}
        </div>
      ))}
    </>
  );
}
