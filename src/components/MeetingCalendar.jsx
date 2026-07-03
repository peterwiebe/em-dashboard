import { useEffect, useState } from "react";
import { fetchWeekMeetings } from "../api/calendar";
import { getWeekDays, fmtHour, evTypeColor } from "../utils/helpers";

const HOUR_PX = 48;

export default function MeetingCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState("week");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchWeekMeetings(weekOffset).then(data => {
      if (!cancelled) setMeetings(data);
    });
    return () => { cancelled = true; };
  }, [weekOffset]);

  const days = getWeekDays(weekOffset);
  const todayMonthDay = new Date().getDate();
  const todayMonth    = new Date().getMonth();
  const isThisWeek    = weekOffset === 0;

  const weekLabel = isThisWeek
    ? `This week · ${days[0].label} ${days[0].date} – ${days[6].label} ${days[6].date}`
    : `${days[0].label} ${days[0].date} – ${days[6].label} ${days[6].date}`;

  const now  = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);

  return (
    <div className="card" style={{ overflow:"hidden" }}>
      {/* Nav */}
      <div className="mcal-nav">
        <div className="mcal-nav-title">{weekLabel}</div>
        <div className="mcal-nav-btns">
          <div className="view-toggle">
            <button className={`view-btn ${view==="week"?"active":""}`} onClick={() => setView("week")}>Week</button>
            <button className={`view-btn ${view==="agenda"?"active":""}`} onClick={() => setView("agenda")}>Agenda</button>
          </div>
          <button className="mcal-nav-btn" onClick={() => setWeekOffset(w => w-1)}>‹</button>
          <button className={`mcal-nav-btn ${isThisWeek?"mcal-today-btn":""}`} onClick={() => setWeekOffset(0)}>Today</button>
          <button className="mcal-nav-btn" onClick={() => setWeekOffset(w => w+1)}>›</button>
        </div>
      </div>

      {view === "week" && (
        <>
          <div className="mcal-day-headers" style={{ display:"grid", gridTemplateColumns:"52px repeat(7, 1fr)" }}>
            <div style={{ borderRight:"1px solid var(--border)", background:"var(--surface)" }} />
            {days.map(d => {
              const isToday = d.date === todayMonthDay && d.month === todayMonth && isThisWeek;
              return (
                <div key={d.idx} className={`mcal-day-header ${isToday?"is-today":""}`}>
                  <span className="mcal-day-num">{d.date}</span>
                  <span className="mcal-day-name">{d.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mcal-grid-wrap">
            {hours.map(h => (
              <div key={h} className="mcal-row" style={{ height:HOUR_PX }}>
                <div className="mcal-time-label">{fmtHour(h)}</div>
                <div className="mcal-day-cells" style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", flex:1, borderLeft:"1px solid var(--border)" }}>
                  {days.map(d => {
                    const isToday = d.date === todayMonthDay && d.month === todayMonth && isThisWeek;
                    const eventsInSlot = meetings.filter(m => m.dayIdx === d.idx && Math.floor(m.startH) === h);
                    return (
                      <div key={d.idx} className={`mcal-cell ${isToday?"is-today":""}`} style={{ position:"relative", height:HOUR_PX }}>
                        {isToday && h === Math.floor(nowH) && isThisWeek && (
                          <div style={{ position:"absolute", left:0, right:0, top:`${(nowH - h) * HOUR_PX}px`, height:2, background:"var(--red)", zIndex:10 }}>
                            <div style={{ position:"absolute", left:-4, top:-4, width:10, height:10, borderRadius:"50%", background:"var(--red)" }} />
                          </div>
                        )}
                        {eventsInSlot.map(ev => (
                          <div
                            key={ev.id}
                            className={`mcal-event ev-${ev.type}`}
                            style={{ top:(ev.startH - h) * HOUR_PX, height:Math.max(ev.durationH * HOUR_PX - 2, 18) }}
                            onClick={() => setSelectedEvent(ev)}
                            title={ev.title}
                          >
                            <div className="mcal-event-title">{ev.title}</div>
                            {ev.durationH >= 0.5 && <div className="mcal-event-time">{fmtHour(ev.startH)} – {fmtHour(ev.startH + ev.durationH)}</div>}
                            {ev.durationH >= 1 && ev.location && <div className="mcal-event-loc">📍 {ev.location}</div>}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "agenda" && (
        <div style={{ maxHeight:560, overflowY:"auto" }}>
          {days.map(d => {
            const isToday = d.date === todayMonthDay && d.month === todayMonth && isThisWeek;
            const dayEvs  = meetings.filter(m => m.dayIdx === d.idx).sort((a,b) => a.startH - b.startH);
            return (
              <div key={d.idx}>
                <div style={{
                  padding:"8px 18px", fontSize:11, fontWeight:600, textTransform:"uppercase",
                  letterSpacing:"0.08em", color: isToday ? "var(--teal)" : "var(--muted)",
                  borderBottom:"1px solid var(--border)", background:"var(--surface2)",
                  display:"flex", alignItems:"center", gap:8
                }}>
                  {isToday && <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--teal)", display:"inline-block" }} />}
                  {d.label} {d.date} {isToday && "(Today)"}
                </div>
                {dayEvs.length === 0 && <div style={{ padding:"10px 18px", fontSize:12, color:"var(--muted)" }}>No meetings</div>}
                {dayEvs.map((ev, i) => (
                  <div key={ev.id} className="agenda-item" onClick={() => setSelectedEvent(ev)}>
                    <div className="agenda-dot-col">
                      <div className="agenda-dot" style={{ borderColor:evTypeColor(ev.type), background:evTypeColor(ev.type)+"22" }} />
                      {i < dayEvs.length - 1 && <div className="agenda-line" />}
                    </div>
                    <div className="agenda-time">
                      {fmtHour(ev.startH)}<br />
                      <span style={{ fontSize:10 }}>{fmtHour(ev.startH + ev.durationH)}</span>
                    </div>
                    <div className="agenda-body">
                      <div className="agenda-title">{ev.title}</div>
                      <div className="agenda-meta">
                        {ev.location && <span>📍 {ev.location}</span>}
                        <span>⏱ {ev.durationH < 1 ? `${ev.durationH*60}min` : `${ev.durationH}h`}</span>
                      </div>
                      {ev.attendees.length > 0 && (
                        <div style={{ marginTop:5, display:"flex", flexWrap:"wrap", gap:4 }}>
                          {ev.attendees.slice(0,4).map(a => <span key={a} className="agenda-att-chip">{a}</span>)}
                          {ev.attendees.length > 4 && <span className="agenda-att-chip">+{ev.attendees.length-4}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {selectedEvent && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10, padding:24, minWidth:320, maxWidth:440, boxShadow:"0 24px 48px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:"var(--text)", marginBottom:4 }}>{selectedEvent.title}</div>
                <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--font-mono)" }}>
                  {days[selectedEvent.dayIdx]?.label} · {fmtHour(selectedEvent.startH)} – {fmtHour(selectedEvent.startH + selectedEvent.durationH)}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:18 }}>×</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {selectedEvent.location && <div style={{ fontSize:12, color:"var(--muted)" }}>📍 {selectedEvent.location}</div>}
              <div style={{ fontSize:12, color:"var(--muted)" }}>
                ⏱ {selectedEvent.durationH < 1 ? `${selectedEvent.durationH*60} min` : `${selectedEvent.durationH} hr`}
              </div>
              {selectedEvent.attendees.length > 0 && (
                <div>
                  <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted)", marginBottom:6 }}>Attendees</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {selectedEvent.attendees.map(a => (
                      <span key={a} style={{ fontSize:11, padding:"3px 9px", borderRadius:99, background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--text)" }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop:4 }}>
                <span style={{
                  fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:99, textTransform:"uppercase", letterSpacing:"0.06em",
                  background:evTypeColor(selectedEvent.type)+"22",
                  color:evTypeColor(selectedEvent.type),
                  border:`1px solid ${evTypeColor(selectedEvent.type)}`
                }}>{selectedEvent.type}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
