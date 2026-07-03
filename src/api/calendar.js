import { MOCK_MEETINGS } from "../data/mockData";

const TOKEN = import.meta.env.VITE_MS_GRAPH_TOKEN;

export function isConfigured() {
  return Boolean(TOKEN);
}

function classifyMeeting(title) {
  const t = title.toLowerCase();
  if (t.includes("standup") || t.includes("stand-up")) return "standup";
  if (t.includes("1:1") || t.includes("1on1"))          return "1on1";
  if (t.includes("planning") || t.includes("retro"))    return "planning";
  if (t.includes("review"))                             return "review";
  if (t.includes("focus"))                              return "focus";
  return "external";
}

export async function fetchWeekMeetings(offsetWeeks = 0) {
  if (!TOKEN) return MOCK_MEETINGS;

  const now   = new Date();
  const dow   = now.getDay();
  const mon   = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offsetWeeks * 7);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    startDateTime: mon.toISOString(),
    endDateTime:   sun.toISOString(),
    "$select":     "id,subject,start,end,location,attendees,isOnlineMeeting",
  });
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) throw new Error(`MS Graph API error: ${res.status}`);
  const { value: events } = await res.json();

  return events.map(ev => {
    const start = new Date(ev.start.dateTime);
    const end   = new Date(ev.end.dateTime);
    const dayOfWeek = start.getDay();
    return {
      id:          ev.id,
      title:       ev.subject,
      type:        classifyMeeting(ev.subject),
      dayIdx:      dayOfWeek === 0 ? 6 : dayOfWeek - 1,
      startH:      start.getHours() + start.getMinutes() / 60,
      durationH:   (end - start) / 3_600_000,
      location:    ev.location?.displayName ?? "",
      attendees:   ev.attendees.map(a => a.emailAddress.name),
    };
  });
}
