export function stalenessColor(hours) {
  if (hours < 24)  return { cls:"stale-fresh", ageCls:"teal",  label:`${hours}h` };
  if (hours < 72)  return { cls:"stale-warm",  ageCls:"amber", label:`${Math.floor(hours/24)}d` };
  if (hours < 168) return { cls:"stale-hot",   ageCls:"",      label:`${Math.floor(hours/24)}d` };
  return                  { cls:"stale-fire",  ageCls:"red",   label:`${Math.floor(hours/24)}d` };
}

export function reviewDotColor(s) {
  return s === "approved" ? "#3fb950" : s === "changes" ? "#f85149" : "#7d8590";
}

export function getWeekDays(offsetWeeks = 0) {
  const today = new Date();
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { label: d.toLocaleDateString("en-US",{weekday:"short"}), date: d.getDate(), month: d.getMonth(), full: d, idx: i };
  });
}

export function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  const ampm = hh < 12 ? "am" : "pm";
  const disp = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return mm === 0 ? `${disp}${ampm}` : `${disp}:${String(mm).padStart(2,"0")}${ampm}`;
}

export function evTypeColor(type) {
  return { standup:"#00d4aa", "1on1":"#58a6ff", planning:"#bc8cff", review:"#e3a820", external:"#f85149", focus:"#3fb950" }[type] || "#7d8590";
}

// Merges overlapping/back-to-back [start, end) intervals so double-booked
// meetings don't get double-counted against the workday window.
function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

export function computeFocusTime(meetings, dayIdx, dayStartH = 9, dayEndH = 18) {
  const intervals = meetings
    .filter(m => m.dayIdx === dayIdx)
    .map(m => [Math.max(m.startH, dayStartH), Math.min(m.startH + m.durationH, dayEndH)])
    .filter(([start, end]) => end > start);

  const scheduledH = mergeIntervals(intervals).reduce((sum, [start, end]) => sum + (end - start), 0);
  const workdayH = Math.max(dayEndH - dayStartH, 0);
  return Math.max(workdayH - scheduledH, 0);
}

export function isStartingSoon(meeting, now, thresholdMinutes = 15) {
  const nowH = now.getHours() + now.getMinutes() / 60;
  const diffH = meeting.startH - nowH;
  return diffH >= 0 && diffH <= thresholdMinutes / 60;
}

export function formatElapsed(ms) {
  const totalMinutes = Math.floor(Math.max(ms, 0) / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
