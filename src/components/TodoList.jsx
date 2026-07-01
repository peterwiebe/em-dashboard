import { useState } from "react";
import { DEFAULT_TODOS } from "../data/mockData";

export default function TodoList() {
  const [todos, setTodos] = useState(DEFAULT_TODOS);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("med");

  const add = () => {
    if (!input.trim()) return;
    setTodos(t => [{ id:Date.now(), text:input.trim(), done:false, priority }, ...t]);
    setInput("");
  };

  return (
    <>
      <div className="todo-input-row">
        <input
          className="todo-input"
          placeholder="Add a task…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && add()}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:6, padding:"6px 8px", color:"var(--text)", fontSize:12, cursor:"pointer" }}
        >
          <option value="high">High</option>
          <option value="med">Med</option>
          <option value="low">Low</option>
        </select>
        <button className="btn btn-teal" onClick={add}>Add</button>
      </div>
      <div className="card-scroll">
        {todos.map(t => (
          <div key={t.id} className="todo-item">
            <div
              className={`todo-check ${t.done?"done":""}`}
              onClick={() => setTodos(ts => ts.map(x => x.id===t.id ? {...x,done:!x.done} : x))}
            >
              {t.done && <span style={{ color:"#000", fontSize:9, fontWeight:900 }}>✓</span>}
            </div>
            <span className={`todo-text ${t.done?"done":""}`}>{t.text}</span>
            <span className={`priority-tag p-${t.priority}`}>{t.priority}</span>
            <button className="todo-delete" onClick={() => setTodos(ts => ts.filter(x => x.id!==t.id))}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
