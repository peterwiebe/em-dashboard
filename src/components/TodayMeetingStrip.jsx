import { useEffect, useState } from "react";
import { TODAY_DAY_IDX } from "../data/mockData";
import { fetchWeekMeetings } from "../api/calendar";
import { fmtHour, evTypeColor, isStartingSoon } from "../utils/helpers";

export default function TodayMeetingStrip() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchWeekMeetings().then(data => {
      if (!cancelled) {
        setMeetings(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  const todayEvs = meetings.filter(m => m.dayIdx === TODAY_DAY_IDX).sort((a,b) => a.startH - b.startH);

  if (todayEvs.length === 0) {
    return <div className="empty"><div className="empty-icon">🎉</div>No meetings today</div>;
  }

  const now = new Date();

  return (
    <>
      {todayEvs.map(ev => (
        <div key={ev.id} className="mini-meeting">
          <div className="mini-dot" style={{ background: evTypeColor(ev.type) }} />
          <div className="mini-time">{fmtHour(ev.startH)}</div>
          <div className="mini-title">{ev.title}</div>
          {isStartingSoon(ev, now) && <span className="badge badge-red">Starting soon</span>}
          {ev.location && <div className="mini-loc">📍 {ev.location}</div>}
        </div>
      ))}
    </>
  );
}
