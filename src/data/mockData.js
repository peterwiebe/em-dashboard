export const TEAM = [
  { id: 1, name: "Arjun Patel",   initials: "AP", color: "#00d4aa20", textColor: "#00d4aa", status: "in",  statusLabel: "Available" },
  { id: 2, name: "Mia Chen",      initials: "MC", color: "#58a6ff20", textColor: "#58a6ff", status: "mtg", statusLabel: "In meeting" },
  { id: 3, name: "Jordan Lee",    initials: "JL", color: "#bc8cff20", textColor: "#bc8cff", status: "pto", statusLabel: "PTO today" },
  { id: 4, name: "Priya Sharma",  initials: "PS", color: "#3fb95020", textColor: "#3fb950", status: "in",  statusLabel: "Available" },
  { id: 5, name: "Carlos Rivera", initials: "CR", color: "#e3a82020", textColor: "#e3a820", status: "out", statusLabel: "Offline" },
  { id: 6, name: "Aisha Okonkwo", initials: "AO", color: "#f0783a20", textColor: "#f0783a", status: "in",  statusLabel: "Available" },
];

export const PTO_THIS_WEEK = { 3: [0,1,2,3,4], 2: [3,4], 5: [1] };

export const TODAY_DAY_IDX = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

export const MOCK_MEETINGS = [
  { id: 1,  title: "Daily Standup",               type: "standup",  dayIdx: 0, startH: 9.25,  durationH: 0.25, location: "Teams",            attendees: ["Arjun","Mia","Priya","Aisha"] },
  { id: 2,  title: "Daily Standup",               type: "standup",  dayIdx: 1, startH: 9.25,  durationH: 0.25, location: "Teams",            attendees: ["Arjun","Mia","Priya","Aisha"] },
  { id: 3,  title: "Daily Standup",               type: "standup",  dayIdx: 2, startH: 9.25,  durationH: 0.25, location: "Teams",            attendees: ["Arjun","Mia","Priya","Aisha"] },
  { id: 4,  title: "Daily Standup",               type: "standup",  dayIdx: 3, startH: 9.25,  durationH: 0.25, location: "Teams",            attendees: ["Arjun","Mia","Priya","Aisha"] },
  { id: 5,  title: "Daily Standup",               type: "standup",  dayIdx: 4, startH: 9.25,  durationH: 0.25, location: "Teams",            attendees: ["Arjun","Mia","Priya","Aisha"] },
  { id: 6,  title: "1:1 — Arjun Patel",           type: "1on1",     dayIdx: 0, startH: 10,    durationH: 0.5,  location: "Teams",            attendees: ["Arjun"] },
  { id: 7,  title: "1:1 — Mia Chen",              type: "1on1",     dayIdx: 1, startH: 10,    durationH: 0.5,  location: "Teams",            attendees: ["Mia"] },
  { id: 8,  title: "1:1 — Priya Sharma",          type: "1on1",     dayIdx: 2, startH: 14,    durationH: 0.5,  location: "Teams",            attendees: ["Priya"] },
  { id: 9,  title: "1:1 — Aisha Okonkwo",         type: "1on1",     dayIdx: 4, startH: 11,    durationH: 0.5,  location: "Teams",            attendees: ["Aisha"] },
  { id: 10, title: "Sprint 45 Planning",           type: "planning", dayIdx: 0, startH: 13,    durationH: 2,    location: "Conf Room B",      attendees: ["Arjun","Mia","Priya","Carlos","Aisha"] },
  { id: 11, title: "Architecture Review",          type: "review",   dayIdx: 2, startH: 11,    durationH: 1,    location: "Teams",            attendees: ["Arjun","Mia"] },
  { id: 12, title: "Partner API Sync — Accenture", type: "external", dayIdx: 1, startH: 14,    durationH: 1,    location: "Teams (external)", attendees: ["Arjun","Priya"] },
  { id: 13, title: "Focus Block",                  type: "focus",    dayIdx: 3, startH: 9,     durationH: 2,    location: "",                 attendees: [] },
  { id: 14, title: "Sprint 44 Retro",              type: "planning", dayIdx: 4, startH: 13,    durationH: 1.5,  location: "Conf Room A",      attendees: ["Arjun","Mia","Priya","Carlos","Aisha","Jordan"] },
  { id: 15, title: "Leadership Sync",              type: "external", dayIdx: 3, startH: 15,    durationH: 1,    location: "Teams",            attendees: ["You"] },
  { id: 16, title: "Engineering All-Hands",        type: "planning", dayIdx: 4, startH: 9,     durationH: 1,    location: "Main Auditorium",  attendees: ["All Engineering"] },
];

export const MOCK_PRS = [
  { id: 1, title: "feat: real-time leaderboard via WebSocket subscriptions",       repo: "tour-digital/core-api",        author: "Arjun Patel",   ageHours: 312, reviewers: ["approved","approved","pending"], draft: false },
  { id: 2, title: "fix: race condition in scoring pipeline under high concurrency", repo: "tour-digital/scoring-service", author: "Mia Chen",       ageHours: 195, reviewers: ["changes","pending"],             draft: false },
  { id: 3, title: "chore: upgrade Next.js 14 → 15, resolve breaking changes",      repo: "tour-digital/web-app",         author: "Priya Sharma",   ageHours: 88,  reviewers: ["approved","approved"],           draft: false },
  { id: 4, title: "feat: add OWGR integration and world rankings feed",             repo: "tour-digital/data-feeds",      author: "Carlos Rivera",  ageHours: 47,  reviewers: ["pending","pending","pending"],   draft: false },
  { id: 5, title: "WIP: federation gateway for partner API access",                 repo: "tour-digital/gateway",         author: "Aisha Okonkwo",  ageHours: 12,  reviewers: [],                               draft: true  },
  { id: 6, title: "refactor: extract shared auth middleware to platform package",   repo: "tour-digital/platform",        author: "Jordan Lee",     ageHours: 62,  reviewers: ["approved"],                     draft: false },
];

export const MOCK_JIRA = {
  backlog:       [{ id:"DIG-441", title:"Localize leaderboard for APAC markets",      assignee:"Unassigned"    },{ id:"DIG-438", title:"Analytics event schema v3 migration", assignee:"Carlos Rivera" }],
  "in-progress": [{ id:"DIG-440", title:"Real-time scoring pipeline v2",              assignee:"Arjun Patel"   },{ id:"DIG-437", title:"Fan engagement push notifications",   assignee:"Mia Chen"      },{ id:"DIG-435", title:"Partner API rate limiting", assignee:"Aisha Okonkwo" }],
  review:        [{ id:"DIG-432", title:"OWGR data integration",                       assignee:"Carlos Rivera" },{ id:"DIG-429", title:"Web app Next.js upgrade",             assignee:"Priya Sharma"  }],
  done:          [{ id:"DIG-428", title:"CI pipeline parallelization",                 assignee:"Jordan Lee"    },{ id:"DIG-425", title:"Auth token refresh hardening",        assignee:"Arjun Patel"   },{ id:"DIG-423", title:"CDN cache-busting strategy", assignee:"Mia Chen" }],
};

export const MOCK_MY_TASKS = [
  { id:"DIG-450", title:"Fix scoring pipeline race condition regression", status:"in-progress", dueDate:"2026-07-03", blocks:["DIG-437"] },
  { id:"DIG-451", title:"Review OWGR data integration approach doc",       status:"backlog",     dueDate:"2026-07-08", blocks:[] },
  { id:"DIG-452", title:"Approve partner API rate limit thresholds",       status:"in-progress", dueDate:null,         blocks:["DIG-435"] },
];

export const MOCK_CONFLUENCE = [
  { icon:"📐", title:"Digital Platform Architecture — Q3 Update", space:"Engineering",  author:"Arjun Patel",   updated:"2h ago"    },
  { icon:"🔌", title:"Partner API Onboarding Runbook v2",          space:"Integrations", author:"Aisha Okonkwo", updated:"Yesterday"  },
  { icon:"📊", title:"Sprint 44 Retrospective Notes",              space:"Team Rituals", author:"You",           updated:"2 days ago" },
  { icon:"🗺️", title:"H2 Roadmap — Digital Products",             space:"Strategy",     author:"You",           updated:"3 days ago" },
  { icon:"🔒", title:"Incident Response Playbook — Scoring Outage",space:"Ops",          author:"Priya Sharma",  updated:"5 days ago" },
];

export const DEFAULT_TODOS = [
  { id:1, text:"Review DIG-440 PR from Arjun",               done:false, priority:"high" },
  { id:2, text:"Prep sprint 45 planning agenda",             done:false, priority:"high" },
  { id:3, text:"1:1 with Mia — discuss career goals",        done:false, priority:"med"  },
  { id:4, text:"Finalize H2 roadmap slide for leadership",   done:true,  priority:"med"  },
  { id:5, text:"Set up code review SLA policy doc",          done:false, priority:"low"  },
];
