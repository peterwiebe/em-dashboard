import { useEffect, useState } from "react";
import { fetchSlackUnread } from "../api/slack";
import { fetchTeamsUnread } from "../api/teamsChat";
import { fetchUnreadMail } from "../api/outlookMail";

const SOURCE_ICON = { slack: "💬", teams: "🟣", mail: "✉️" };

export function mergeByRecency(...lists) {
  return lists
    .flat()
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : -Infinity;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : -Infinity;
      return tb - ta;
    });
}

export default function UnansweredList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSlackUnread(), fetchTeamsUnread(), fetchUnreadMail()]).then(
      ([slack, teams, mail]) => {
        if (!cancelled) {
          setItems(mergeByRecency(slack, teams, mail));
          setLoading(false);
        }
      }
    );
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  if (items.length === 0) {
    return <div className="empty"><div className="empty-icon">📭</div>Nothing unanswered</div>;
  }

  return (
    <div className="card-scroll">
      {items.map(item => (
        <div key={`${item.source}-${item.id}`} className="conf-item">
          <div className="conf-icon" title={item.source}>{SOURCE_ICON[item.source] ?? "•"}</div>
          <div>
            <div className="conf-title">{item.title}</div>
            <div className="conf-meta">
              {item.from}
              {item.timestamp && ` · ${new Date(item.timestamp).toLocaleString()}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
