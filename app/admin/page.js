"use client";
import { useEffect, useState, useCallback } from "react";
import "./admin.css";

async function api(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const date = (d) => new Date(d).toLocaleDateString();

/* ---------- Dashboard ---------- */
function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api("/api/admin/stats").then(setS).catch(() => setS({})); }, []);
  if (!s) return <p>Loading...</p>;
  return (
    <div className="cards">
      <div className="card">Total Students<b>{s.totalStudents ?? "-"}</b></div>
      <div className="card">Active Courses<b>{s.activeCourses ?? "-"}</b></div>
      <div className="card">Pending Feedback<b>{s.pendingFeedback ?? "-"}</b></div>
    </div>
  );
}

/* ---------- Content ---------- */
function Content() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [msg, setMsg] = useState(null);
  const dq = useDebounced(q);

  const load = useCallback(() => {
    const p = new URLSearchParams({ q: dq, type });
    api(`/api/admin/content?${p}`).then(setRows).catch((e) => setMsg({ err: e.message }));
  }, [dq, type]);

  useEffect(load, [load]);
  useEffect(() => { api("/api/admin/courses").then(setCourses).catch(() => {}); }, []);

  async function upload(e) {
    e.preventDefault();
    setMsg(null);
    const form = new FormData(e.target);
    try {
      await api("/api/admin/content", { method: "POST", body: form });
      e.target.reset();
      setMsg({ ok: "File uploaded successfully" });
      load();
    } catch (err) {
      setMsg({ err: err.message });
    }
  }

  async function remove(id) {
    if (!confirm("Delete this item?")) return;
    await api(`/api/admin/content/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <form className="form" onSubmit={upload}>
        <b>Add New Material</b>
        <input name="title" placeholder="Material title" required />
        <textarea name="description" placeholder="Description" rows={2} />
        <select name="type" required defaultValue="">
          <option value="" disabled>File type</option>
          <option>PDF</option><option>Video</option><option>Quiz</option>
        </select>
        <select name="course_id" defaultValue="">
          <option value="">No course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="file" name="file" required />
        <button className="btn">Upload File</button>
        {msg?.ok && <span className="ok">{msg.ok}</span>}
        {msg?.err && <span className="err">{msg.err}</span>}
      </form>

      <div className="bar">
        <input placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option>PDF</option><option>Video</option><option>Quiz</option>
        </select>
      </div>
      <table>
        <thead><tr><th>Title</th><th>Course</th><th>Type</th><th>Uploaded</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><a href={r.file_path} target="_blank" rel="noreferrer">{r.title}</a></td>
              <td>{r.course || "-"}</td><td>{r.type}</td><td>{date(r.created_at)}</td><td>{r.status}</td>
              <td><button className="btn red" onClick={() => remove(r.id)}>Delete</button></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6}>No content found</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ---------- Students ---------- */
function Students() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const dq = useDebounced(q);

  const load = useCallback(() => {
    api(`/api/admin/students?${new URLSearchParams({ q: dq, status })}`).then(setRows).catch(() => {});
  }, [dq, status]);
  useEffect(load, [load]);

  async function setUserStatus(id, next) {
    await api(`/api/admin/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  return (
    <>
      <div className="bar">
        <input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Registered</th><th>Courses</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td><td>{s.name}</td><td>{s.email}</td><td>{date(s.created_at)}</td>
              <td>{s.courses_enrolled}</td><td>{s.status}</td>
              <td>
                {s.status === "active"
                  ? <button className="btn grey" onClick={() => setUserStatus(s.id, "suspended")}>Suspend</button>
                  : <button className="btn" onClick={() => setUserStatus(s.id, "active")}>Activate</button>}
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={7}>No students found</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ---------- Feedback ---------- */
function Feedback() {
  const [d, setD] = useState(null);
  const load = useCallback(() => { api("/api/admin/feedback").then(setD).catch(() => {}); }, []);
  useEffect(load, [load]);

  async function review(id) {
    await api(`/api/admin/feedback/${id}`, { method: "PATCH" });
    load();
  }
  if (!d) return <p>Loading...</p>;
  return (
    <>
      <div className="cards" style={{ marginBottom: 16 }}>
        <div className="card">Pending<b>{d.pending}</b></div>
        <div className="card">Reviewed<b>{d.reviewed}</b></div>
        <div className="card">Average rating<b>{d.avgRating ?? "-"}</b></div>
      </div>
      <table>
        <thead><tr><th>Student</th><th>Category</th><th>Rating</th><th>Message</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {d.items.map((f) => (
            <tr key={f.id}>
              <td>{f.name}</td><td>{f.category}</td><td>{f.rating}/5</td><td>{f.message}</td>
              <td>{date(f.created_at)}</td><td>{f.status}</td>
              <td>{f.status === "pending" && <button className="btn" onClick={() => review(f.id)}>Mark reviewed</button>}</td>
            </tr>
          ))}
          {!d.items.length && <tr><td colSpan={7}>No feedback yet</td></tr>}
        </tbody>
      </table>
    </>
  );
}

/* ---------- Page ---------- */
const TABS = [
  ["dashboard", "Dashboard", Dashboard],
  ["content", "All Content", Content],
  ["students", "Students", Students],
  ["feedback", "Feedback", Feedback],
];

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const Active = TABS.find((t) => t[0] === tab)[2];
  return (
    <div className="adm">
      <aside>
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>{label}</button>
        ))}
      </aside>
      <main>
        <h1>{TABS.find((t) => t[0] === tab)[1]}</h1>
        <Active />
      </main>
    </div>
  );
}
