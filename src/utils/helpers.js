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
