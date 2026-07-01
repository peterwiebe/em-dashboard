import { MOCK_JIRA } from "../data/mockData";

const COLS = [
  { key:"backlog",       label:"Backlog"      },
  { key:"in-progress",   label:"In Progress"  },
  { key:"review",        label:"In Review"    },
  { key:"done",          label:"Done"         },
];

export default function SprintBoard() {
  return (
    <div className="sprint-columns">
      {COLS.map(col => (
        <div key={col.key} className="sprint-col">
          <div className="sprint-col-header">
            <span>{col.label}</span>
            <span className="sprint-col-count">{MOCK_JIRA[col.key].length}</span>
          </div>
          {MOCK_JIRA[col.key].map(t => (
            <div key={t.id} className="jira-ticket">
              <div className="jira-id">{t.id}</div>
              <div className="jira-title">{t.title}</div>
              <div className="jira-assignee">{t.assignee}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
