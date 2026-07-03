import { useEffect, useState } from "react";
import { load, save } from "../api/localState";

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("med");

  useEffect(() => {
    let cancelled = false;
    load().then(state => {
      if (!cancelled) {
        setTodos(state.todos ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Re-loads the full state right before saving, same pattern as
  // ReportsManager, so a concurrent edit elsewhere in the app is less
  // likely to get clobbered (persistence has no concurrency control).
  async function persist(nextTodos) {
    const state = await load();
    await save({ ...state, todos: nextTodos });
    setTodos(nextTodos);
  }

  const add = () => {
    if (!input.trim()) return;
    const newTodo = { id: `${Date.now()}`, text: input.trim(), done: false, priority, blocksReportId: null };
    persist([newTodo, ...todos]);
    setInput("");
  };

  const toggleDone = (id) => {
    persist(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const remove = (id) => {
    persist(todos.filter(t => t.id !== id));
  };

  if (loading) return null;

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
              onClick={() => toggleDone(t.id)}
            >
              {t.done && <span style={{ color:"#000", fontSize:9, fontWeight:900 }}>✓</span>}
            </div>
            <span className={`todo-text ${t.done?"done":""}`}>{t.text}</span>
            <span className={`priority-tag p-${t.priority}`}>{t.priority}</span>
            <button className="todo-delete" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
