import { MOCK_CONFLUENCE } from "../data/mockData";

export default function ConfluenceDocs() {
  return (
    <div className="card-scroll">
      {MOCK_CONFLUENCE.map((d,i) => (
        <div key={i} className="conf-item">
          <div className="conf-icon">{d.icon}</div>
          <div>
            <div className="conf-title">{d.title}</div>
            <div className="conf-meta">{d.space} · {d.author} · {d.updated}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
