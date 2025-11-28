import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts";

import StudentModal from "./StudentModal";

import { db } from "../firebase";
import { ref, get, set, update, remove, push } from "firebase/database";

export default function Dashboard() {
  const { groupId } = useParams();
  const currentUserName = sessionStorage.getItem("currentUserName") || "Teacher";

  // --- core data ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // UI state
  const [editingStudent, setEditingStudent] = useState(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({});
  const [chartType, setChartType] = useState("bar");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // filters & UI controls
  const [searchQuery, setSearchQuery] = useState("");
  const [minAverage, setMinAverage] = useState(0);

  // localStorage-backed states with safe defaults
  const [visibleSubjects, setVisibleSubjects] = useState(() => {
    try {
      const raw = localStorage.getItem("visibleSubjects");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const raw = localStorage.getItem("columnOrder");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  // local UI toggles
  const [showSubjectControls, setShowSubjectControls] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // student id for confirm

  // --- load students from Realtime Database ---
  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const studentsRef = ref(db, "students");
    get(studentsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const allStudents = snapshot.val();
          const filtered = Object.entries(allStudents)
            .filter(([id, s]) => s.group_id === parseInt(groupId))
            .map(([id, s]) => ({
              id,
              ...s,
              history: s.history ?? generateHistoryFromScores(s),
            }));
          setStudents(filtered);
        } else {
          setStudents([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setFetchError(err.message || "Unknown error");
        setStudents([]);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  // persist theme
  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // --- Derived subjects list from students data ---
  const allSubjects = useMemo(() => {
    const setS = new Set();
    students.forEach((s) => {
      Object.keys(s).forEach((k) => {
        if (!["id", "name", "main_teacher_id", "group_id", "photo", "history"].includes(k)) {
          setS.add(k);
        }
      });
    });
    const arr = Array.from(setS);
    if (columnOrder && Array.isArray(columnOrder)) {
      const ordered = [
        ...columnOrder.filter((c) => arr.includes(c)),
        ...arr.filter((a) => !columnOrder.includes(a)),
      ];
      return ordered;
    }
    return arr;
  }, [students, columnOrder]); 

  useEffect(() => {
    if (visibleSubjects === null && allSubjects.length) {
      const obj = {};
      allSubjects.forEach((s) => (obj[s] = true));
      setVisibleSubjects(obj);
      try {
        localStorage.setItem("visibleSubjects", JSON.stringify(obj));
      } catch {}
    }
  }, [allSubjects]);
 

  useEffect(() => {
    if (!columnOrder && allSubjects.length) {
      setColumnOrder(allSubjects);
      try {
        localStorage.setItem("columnOrder", JSON.stringify(allSubjects));
      } catch {}
    }
  }, [allSubjects]);
 

  useEffect(() => {
    if (columnOrder) {
      try {
        localStorage.setItem("columnOrder", JSON.stringify(columnOrder));
      } catch {}
    }
  }, [columnOrder]);

  
  useEffect(() => {
    if (visibleSubjects) {
      try {
        localStorage.setItem("visibleSubjects", JSON.stringify(visibleSubjects));
      } catch {}
    }
  }, [visibleSubjects]);

  
  function generateHistoryFromScores(s) {
    const hist = {};
    Object.keys(s).forEach((k) => {
      if (!["id", "name", "main_teacher_id", "group_id", "photo", "history"].includes(k)) {
        const cur = Number(s[k] ?? 0);
        if (isNaN(cur)) {
          hist[k] = [];
          return;
        }
        const a = Math.max(0, Math.min(100, Math.round(cur - 6)));
        const b = Math.max(0, Math.min(100, Math.round(cur - 2)));
        hist[k] = [a, b, Math.round(cur)];
      }
    });
    return hist;
  }

  const computeAverage = (student) => {
    const vals = allSubjects.map((sub) => Number(student[sub] ?? 0)).filter((n) => !isNaN(n));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const topPerSubject = useMemo(() => {
    const map = {};
    allSubjects.forEach((subj) => {
      let max = -Infinity;
      let topId = null;
      students.forEach((s) => {
        const v = Number(s[subj] ?? -Infinity);
        if (!isNaN(v) && v > max) {
          max = v;
          topId = s.id;
        }
      });
      map[subj] = topId;
    });
    return map;
  }, [allSubjects, students]);

  
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedStudents = useMemo(() => {
    let arr = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      arr = arr.filter((s) => (s.name || "").toLowerCase().includes(q));
    }

    if (minAverage > 0) {
      arr = arr.filter((s) => computeAverage(s) >= minAverage);
    }

    if (sortConfig.key) {
      arr.sort((a, b) => {
        const get = (obj, key) => {
          if (key === "average") return computeAverage(obj);
          const v = obj[key];
          if (typeof v === "string") return v.toLowerCase();
          return (v ?? 0);
        };
        const aV = get(a, sortConfig.key);
        const bV = get(b, sortConfig.key);
        if (aV < bV) return sortConfig.direction === "asc" ? -1 : 1;
        if (aV > bV) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return arr;
  }, [students, searchQuery, minAverage, sortConfig]);

  
  const handleDelete = (studentId) => setConfirmDelete(studentId);

  const confirmDeleteNow = (studentId) => {
    const studentRef = ref(db, `students/${studentId}`);
    remove(studentRef).then(() => {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setConfirmDelete(null);
    });
  };

  const handleSave = (student) => {
    if (!student || !student.id) return;
    const studentRef = ref(db, `students/${student.id}`);
    update(studentRef, student).then(() => {
      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...student } : s)));
      setEditingStudent(null);
    });
  };

  const saveNewStudent = (student) => {
    const newStudentRef = push(ref(db, "students"));
    const studentData = {
      ...student,
      id: newStudentRef.key,
      group_id: parseInt(groupId) || null,
      history: student.history ?? generateHistoryFromScores(student),
    };
    set(newStudentRef, studentData).then(() => {
      setStudents((prev) => [...prev, studentData]);
      setAddingStudent(false);
      setNewStudent({});
    });
  };
 
  const toggleSubjectVisible = (subj) => {
    const next = { ...(visibleSubjects || {}), [subj]: !visibleSubjects?.[subj] };
    setVisibleSubjects(next);
  };

  const [showModal, setShowModal] = useState(false);
const [selectedSubject, setSelectedSubject] = useState(null);

 
const addSubjectToStudents = async (name) => {
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
 
  if (allSubjects.includes(trimmed)) {
    setSelectedSubject(trimmed);
    setShowModal(true);
    setNewSubjectName("");
    return;
  }

  try { 
    const updates = {};
    students.forEach(s => {
      updates[`students/${s.id}/${trimmed}`] = 0;
    });

    await update(ref(db), updates);
 
    const updated = students.map(s => ({ ...s, [trimmed]: 0 }));
    setStudents(updated);
 
    setVisibleSubjects(prev => ({
      ...(prev || {}),
      [trimmed]: true
    }));
 
    setColumnOrder(prev => ([...(prev || []), trimmed]));
 
    setSelectedSubject(trimmed);
    setShowModal(true);

  } finally {
    setAddingSubject(false);
    setNewSubjectName("");
  }
};

const deleteSubjectFromStudents = async (subj) => {
  if (!subj) return;
  if (!confirm(`Удалить предмет "${subj}" у всех студентов?`)) return;

  try {
    // Формируем объект апдейтов — удаляем subj у каждого студента
    const updates = {};
    students.forEach(s => {
      updates[`students/${s.id}/${subj}`] = null;
    });
    await update(ref(db), updates);

    // Обновляем локально
    const updated = students.map(s => {
      const copy = { ...s };
      delete copy[subj];
      return copy;
    });

    setStudents(updated);

    // убираем из visibleSubjects
    setVisibleSubjects(prev => {
      const copy = { ...(prev || {}) };
      delete copy[subj];
      return copy;
    });

    // убираем из columnOrder
    setColumnOrder(prev => (prev || []).filter(s => s !== subj));

  } catch (e) {
    console.error("Error deleting subject:", e);
  }
};


  const moveSubject = (subj, dir) => {
    if (!columnOrder) return;
    const idx = columnOrder.indexOf(subj);
    if (idx === -1) return;
    const to = dir === "left" ? idx - 1 : idx + 1;
    if (to < 0 || to >= columnOrder.length) return;
    const copy = [...columnOrder];
    copy.splice(idx, 1);
    copy.splice(to, 0, subj);
    setColumnOrder(copy);
  };

  const exportCSV = () => {
    if (!students.length) return;
    const visible = (columnOrder || allSubjects).filter((s) => visibleSubjects?.[s] ?? true);
    const cols = ["id", "name", ...visible];
    const rows = students.map((s) => cols.map((c) => {
      const v = s[c] ?? "";
      const str = String(v).replace(/"/g, '""');
      return `"${str}"`;
    }));
    const csv = [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_group_${groupId || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const rootClass = theme === "dark" ? "text-white" : "text-gray-900";

  const TopBadge = ({ title = "Top score" }) => (
    <span className="text-yellow-300 font-bold animate-pulse" title={title}>★</span>
  );
 

  return (
    <div className={`${rootClass} min-h-screen p-6 bg-cover bg-center`} style={{ backgroundImage: "url('/bg3.gif')" }}>
      <div className="w-full max-w-7xl mx-auto">
        {/* header */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-20 object-contain drop-shadow-lg"/>
            <div>
              <h1 className="text-3xl font-bold">Academic Dashboard</h1>
              <div className={`text-sm ${theme === "dark" ? "text-white/80" : "text-gray-600"}`}>Welcome, {currentUserName}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-md">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search students..." className="bg-transparent outline-none text-current placeholder-current/60" />
              <input type="range" min="0" max="100" value={minAverage} onChange={(e) => setMinAverage(Number(e.target.value))} className="w-32" />
              <div className="text-sm w-8 text-center">{minAverage}</div>
            </div>

            <button onClick={() => setShowSubjectControls((s) => !s)} className="px-3 py-2 rounded-md bg-white/10">Subjects</button>
            <button onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")} title="Toggle theme" className="p-2 rounded-md bg-white/10">
              {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={exportCSV} className="px-3 py-2 rounded-md bg-green-600/80 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5" /> CSV
            </button>
            <button onClick={printReport} className="px-3 py-2 rounded-md bg-white/10 flex items-center gap-2">
              <PrinterIcon className="w-5 h-5" /> Print
            </button>
          </div>
        </div>

        {/* subject controls dropdown */}
        {showSubjectControls && (
          <div className="bg-white/10 p-4 rounded-md mb-4 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="New subject name" className="p-2 rounded-md text-black" />
                <button onClick={() => addSubjectToStudents(newSubjectName)} className="px-3 py-2 bg-blue-600 rounded-md">Add Subject</button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {(allSubjects || []).map((subj) => (
  <div key={subj} className="flex items-center gap-2 bg-white/5 p-2 rounded-md">
    <input type="checkbox" checked={visibleSubjects?.[subj] ?? true} onChange={() => toggleSubjectVisible(subj)} />
    <span className="font-medium">{subj}</span>

    <div className="flex items-center gap-1 ml-2">
      <button onClick={() => moveSubject(subj, "left")} className="p-1 hover:bg-white/10">
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
      <button onClick={() => moveSubject(subj, "right")} className="p-1 hover:bg-white/10">
        <ChevronRightIcon className="w-4 h-4" />
      </button>
 
      <button onClick={() => deleteSubjectFromStudents(subj)} className="p-1 hover:bg-red-600/50 text-red-400">
        <TrashIcon className="w-4 h-4"/>
      </button>
    </div>
  </div>
))}

              </div>
            </div>
          </div>
        )}

        {/* table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-xl">
          {loading ? (
            <p className="text-center py-8">Loading students...</p>
          ) : fetchError ? (
            <p className="text-center py-8 text-red-300">Error: {fetchError}</p>
          ) : students.length === 0 ? (
            <p className="text-center py-8">No students assigned.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="sticky top-0 bg-white/5 backdrop-blur-md z-10">
                    <tr className="border-b border-white/30">
                      <th className="px-4 py-3 text-left">
                        <div className="inline-flex items-center gap-2 cursor-pointer select-none" onClick={() => requestSort("name")}>
                          Name
                          {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                        </div>
                      </th>
                      {allSubjects.map((subj) => visibleSubjects?.[subj] && (
                        <th key={subj} className="px-4 py-3 text-center cursor-pointer select-none" onClick={() => requestSort(subj)}>
                          {subj}
                          {sortConfig.key === subj && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center cursor-pointer select-none" onClick={() => requestSort("average")}>
                        Avg
                        {sortConfig.key === "average" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                      </th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((s) => {
                      const avg = computeAverage(s);
                      return (
                        <tr key={s.id} className="border-b border-white/20 hover:bg-white/5">
                          <td className="px-4 py-3 flex items-center gap-2">
  {s.photo ? (
    <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-full object-cover" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold">
      {s.name ? s.name[0].toUpperCase() : "?"}
    </div>
  )}
  <span>{s.name}</span>
</td>

                          {allSubjects.map((subj) => visibleSubjects?.[subj] && (
  <td key={subj} 
      className="px-4 py-3 text-center font-semibold relative select-none"
  >
    {s[subj] ?? "-"}
    
    {/*  Letter Grade */}
    {s[subj] !== undefined && (
      <span className="ml-1 text-xs opacity-70">
        {s[subj] >= 91 ? "A" :
         s[subj] >= 81 ? "B" :
         s[subj] >= 71 ? "C" :
         s[subj] >= 61 ? "D" :
         s[subj] >= 51 ? "E" : "F"}
      </span>
    )}

    {topPerSubject[subj] === s.id && <TopBadge />}
  </td>
))}

                          <td className="px-4 py-3 text-center font-semibold">
                          {avg.toFixed(1)}
                          {avg.toFixed(1) !== undefined && (
      <span className="ml-1 text-xs opacity-70">
        {avg.toFixed(1) >= 91 ? "A" :
         avg.toFixed(1) >= 81 ? "B" :
         avg.toFixed(1) >= 71 ? "C" :
         avg.toFixed(1) >= 61 ? "D" :
         avg.toFixed(1) >= 51 ? "E" : "F"}
      </span>
    )}
    </td>
                          <td className="px-4 py-3 text-center flex gap-2 justify-center">
                            <button onClick={() => setEditingStudent(s)} className="p-1  rounded-md"><PencilIcon className="w-4 h-4 hover:text-gray-400" /></button>
                            <button onClick={() => handleDelete(s.id)} className="p-1 rounded-md"><TrashIcon className=" w-4 h-4 hover:text-gray-400" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* charts + controls */}
<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
  <div className="md:col-span-2 bg-white/5 p-4 rounded-md border border-white/10">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setChartType("bar")} className={`px-3 py-1 rounded ${chartType === "bar" ? "bg-green-600" : "bg-white/5"}`}>Bar</button>
        <button onClick={() => setChartType("radar")} className={`px-3 py-1 rounded ${chartType === "radar" ? "bg-green-600" : "bg-white/5"}`}>Radar</button>
        <button onClick={() => setChartType("line")} className={`px-3 py-1 rounded ${chartType === "line" ? "bg-green-600" : "bg-white/5"}`}>Line</button>
      </div>

      <div className="text-sm text-white/80">Subjects: {allSubjects.length}</div>
    </div>

    <div style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart
  data={allSubjects.map((subj) => {
    const vals = students.map((s) => Number(s[subj] ?? 0));
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { subject: subj, average: Number(avg.toFixed(1)) };
  })}
  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
>
  <defs>
    <linearGradient id="avgGradient" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
      <stop offset="100%" stopColor="rgba(255,255,255,1)" />
    </linearGradient>
  </defs>

  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff20" />
  <XAxis dataKey="subject" stroke={theme === "dark" ? "gray-300" : "gray-800"} />
  <YAxis stroke={theme === "dark" ? "gray-300" : "gray-800"} />
  <Tooltip contentStyle={{ backgroundColor: "rgba(187, 187, 187, 0.95)", borderRadius: 10 }}/>

  <Bar
    dataKey="average"
    isAnimationActive
    maxBarSize={100}
    radius={[12, 12, 0, 0]}
    fill="url(#avgGradient)"
  />
</BarChart>

        ) : chartType === "radar" ? (
          <RadarChart data={allSubjects.map((subj) => {
            const vals = students.map((s) => Number(s[subj] ?? 0));
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { subject: subj, average: Number(avg.toFixed(1)) };
          })}>
            <PolarGrid/>
            <PolarAngleAxis dataKey="subject"  stroke={theme === "dark" ? "gray-300" : "black"} />
            <PolarRadiusAxis stroke={theme === "dark" ? "gray-300" : "black"} />
            <Radar name="Group Average" dataKey="average" stroke="#3e3e3ecc" fill="#ffffff55" fillOpacity={0.5}/>
            <Tooltip contentStyle={{ backgroundColor: "rgba(163, 163, 163, 0.95)", borderRadius: 10 }}/>
          </RadarChart>
        ) : (
          <LineChart data={allSubjects.map((subj) => {
            const vals = students.map((s) => Number(s[subj] ?? 0));
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            return { subject: subj, average: Number(avg.toFixed(1)) };
          })} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20"/>
            <XAxis dataKey="subject" stroke={theme === "dark" ? "gray-300" : "black"} />
            <YAxis stroke={theme === "dark" ? "gray-300" : "black"} />
            <Tooltip contentStyle={{ backgroundColor: "rgba(140, 140, 140, 0.95)", borderRadius: 10 }}/>
            <Line type="monotone" dataKey="average" stroke="#525252ff" dot={{ r: 4 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  </div>

  <div className="bg-white/5 p-4 rounded-md border border-white/10">
    <h3 className="font-semibold mb-2">Group Summary</h3>
    <div className="text-sm text-white/80 mb-2">Students: {students.length}</div>
    <div className="text-sm mb-3">
      <div>Top per subject:</div>
      <ul className="list-disc ml-5 mt-2">
        {allSubjects.map((s) => {
          const vals = students.map((st) => Number(st[s] ?? 0));
          const max = vals.length ? Math.max(...vals) : 0;
          const topStudent = students.find((st) => Number(st[s] ?? 0) === max);
          return <li key={s} className="text-sm">{s}: {topStudent ? `${topStudent.name} (${topStudent[s] ?? "-"})` : "-"}</li>;
        })}
      </ul>
    </div>

    <div className="flex flex-col gap-2">
      <button className="px-3 py-2 bg-blue-600 rounded-md" onClick={() => { setAddingStudent(true); setNewStudent({ name: "" }); }}>Add Student</button>
      <button className="px-3 py-2 bg-gray-600 rounded-md" onClick={() => setAddingSubject(true)}>Add Subject</button>
    </div>
  </div>
</div>

            </>
          )}
        </motion.div>
        

        {(editingStudent || addingStudent) && (
  <StudentModal
    student={editingStudent ?? newStudent}
    adding={addingStudent}
    allSubjects={allSubjects}
    onClose={() => {
      setEditingStudent(null);
      setAddingStudent(false);
    }}
    onSave={(updatedStudent) => {
      if (editingStudent) {
        handleSave(updatedStudent);  
      } else {
        saveNewStudent(updatedStudent);  
      } 
      setEditingStudent(null);
      setAddingStudent(false);
    }}
  />
)}
        {addingSubject && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl text-white w-[300px]">
      <h2 className="text-xl font-semibold text-center mb-4">Add new subject</h2>

      <input
        type="text"
        placeholder="Subject name..."
        value={newSubjectName}
        onChange={(e) => setNewSubjectName(e.target.value)}
        className="w-full px-3 py-2 bg-white/20 rounded-md outline-none focus:bg-white/30"
      />

      <div className="flex gap-2 mt-4">
        <button 
          className="flex-1 py-2 rounded-md bg-green-500/70 hover:bg-green-500"
          onClick={() => addSubjectToStudents(newSubjectName)}
        >
          Add
        </button>
        <button 
          className="flex-1 py-2 rounded-md bg-red-500/70 hover:bg-red-500"
          onClick={() => setAddingSubject(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


        {/* confirm delete */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30 text-white flex flex-col gap-4">
              <p>Are you sure you want to delete this student?</p>
              <div className="flex gap-4 justify-end">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-white/20 rounded-md">Cancel</button>
                <button onClick={() => confirmDeleteNow(confirmDelete)} className="px-4 py-2 bg-red-600 rounded-md">Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
