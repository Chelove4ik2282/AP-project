import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon, PlusIcon } from "@heroicons/react/24/solid";

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
} from "recharts";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({});
  const [chartType, setChartType] = useState("bar");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const { groupId } = useParams();
  const currentUserName = sessionStorage.getItem("currentUserName");

  useEffect(() => {
    fetch("/students.json")
      .then(res => res.json())
      .then((data) => {
        setStudents(data.filter(s => s.group_id === parseInt(groupId)));
        setLoading(false);
      });
  }, [groupId]);

  const handleDelete = (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };

  const handleSave = (student) => {
    if (editingStudent) {
      setStudents(students.map(s => s.id === student.id ? { ...student } : s));
      setEditingStudent(null);
    }
  };

  const saveNewStudent = (student) => {
    const maxId = students.length ? Math.max(...students.map(s => s.id)) : 0;
    const newStud = { ...student, id: maxId + 1, group_id: parseInt(groupId) };
    setStudents([...students, newStud]);
    setAddingStudent(false);
    setNewStudent({});
  };

  // subjects derived from students data
  const subjects = Array.from(
    new Set(
      students.flatMap(s =>
        Object.keys(s).filter(k => !['id','name','main_teacher_id','group_id'].includes(k))
      )
    )
  );

  const topPerSubject = {};
  subjects.forEach(subj => {
    let maxScore = -Infinity;
    let topStudent = null;
    students.forEach(s => {
      const score = (s[subj] ?? 0);
      if (score > maxScore) {
        maxScore = score;
        topStudent = s.id;
      }
    });
    topPerSubject[subj] = topStudent;
  });

  const chartData = subjects.map(subj => {
    const values = students.map(s => s[subj] ?? 0);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { subject: subj, average: Number(avg.toFixed(1)) };
  });

  const radarData = chartData;

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students];
  if (sortConfig.key) {
    sortedStudents.sort((a,b) => {
      const getVal = (obj, key) => {
        if (key === 'average') {
          const vals = subjects.map(sub => obj[sub] ?? 0);
          return vals.length ? vals.reduce((x,y)=>x+y,0)/vals.length : 0;
        }
        // default: by property (name or subject column)
        const val = obj[key];
        if (typeof val === 'string') return val.toLowerCase();
        return val ?? 0;
      };

      let aVal = getVal(a, sortConfig.key);
      let bVal = getVal(b, sortConfig.key);

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ============ FIXED MODAL ===============
  const StudentModal = ({
    student,
    setStudent,
    handleSave,
    adding = false,
    allSubjects = [],
    onClose
  }) => {

    const [localStudent, setLocalStudent] = useState({ name: '', ...student });

    useEffect(() => {
      // when student prop changes (e.g. different student selected), update local state
      setLocalStudent({ name: '', ...student });
    }, [student]);

    const subjectsList = Array.from(
      new Set([...allSubjects, ...Object.keys(localStudent)
        .filter(k => !['id','name','main_teacher_id','group_id'].includes(k))])
    );

    const onSaveClick = () => {
      // ensure name exists
      if (!localStudent.name || !localStudent.name.trim()) {
        alert('Please provide a name');
        return;
      }

      // ensure numeric subject fields are numbers (or undefined)
      const cleaned = { ...localStudent };
      subjectsList.forEach(subj => {
        if (cleaned[subj] === '') cleaned[subj] = undefined;
        if (typeof cleaned[subj] === 'string') cleaned[subj] = parseInt(cleaned[subj]) || 0;
      });

      handleSave(cleaned);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 w-96 shadow-xl border border-white/30 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">
              {adding ? 'Add Student' : 'Edit Student'}
            </h2>
            <button onClick={onClose}>
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          <input
            type="text"
            className="p-2 rounded-md bg-white/90 text-black focus:outline-none"
            value={localStudent.name}
            onChange={(e) => setLocalStudent({ ...localStudent, name: e.target.value })}
            placeholder="Name"
          />

          {subjectsList.map(subj => (
            <div key={subj} className="flex flex-col">
              <label className="text-white mb-1">{subj}</label>
              <input
                type="number"
                className="p-2 rounded-md bg-white/90 text-black focus:outline-none"
                value={localStudent[subj] ?? ''}
                onChange={(e) =>
                  setLocalStudent({
                    ...localStudent,
                    [subj]: e.target.value === '' ? '' : e.target.value
                  })
                }
                placeholder={subj}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white"
            >
              Cancel
            </button>

            <button
              onClick={onSaveClick}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white flex items-center gap-1"
            >
              <CheckIcon className="w-5 h-5" /> Save
            </button>
          </div>
        </motion.div>
      </div>
    )
  }
  // =========================================

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg3.gif')" }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-6xl bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30 relative"
      >
        <div className="absolute top-4 left-10 z-50 flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-20 object-contain drop-shadow-lg"/>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Welcome, {currentUserName}
        </h1>

        <div className="flex justify-end mb-4 gap-3">
          <button
            onClick={() => {
              setAddingStudent(true);
              setNewStudent({ name: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
          >
            <PlusIcon className="w-5 h-5"/> Add Student
          </button>

          <button
            onClick={() => setAddingSubject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
          >
            <PlusIcon className="w-5 h-5"/> Add Subject
          </button>
        </div>

        {loading ? (
          <p className="text-white text-center">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-white text-center">You have no students assigned.</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-white border-collapse">
  <thead>
    <tr className="border-b border-white/30">

      {/* NAME */}
      <th
        onClick={() => requestSort("name")}
        className="px-4 py-2 text-left cursor-pointer select-none"
      >
        <div className="inline-flex items-center gap-1">
          Name
          <span className={`text-sm ${sortConfig.key === "name" && sortConfig.direction === "asc" ? "text-white font-bold" : "text-white/50"}`}>▲</span>
          <span className={`text-sm ${sortConfig.key === "name" && sortConfig.direction === "desc" ? "text-white font-bold" : "text-white/50"}`}>▼</span>
        </div>
      </th>

      {/* SUBJECTS */}
      {subjects.map((subj) => (
        <th
          key={subj}
          onClick={() => requestSort(subj)}
          className="px-4 py-2 text-center cursor-pointer select-none"
        >
          <div className="inline-flex items-center gap-1 justify-center w-full">
            {subj}
            <span className={`text-sm ${sortConfig.key === subj && sortConfig.direction === "asc" ? "text-white font-bold" : "text-white/50"}`}>▲</span>
            <span className={`text-sm ${sortConfig.key === subj && sortConfig.direction === "desc" ? "text-white font-bold" : "text-white/50"}`}>▼</span>
          </div>
        </th>
      ))}

      {/* AVERAGE */}
      <th
        onClick={() => requestSort("average")}
        className="px-4 py-2 text-center cursor-pointer select-none"
      >
        <div className="inline-flex items-center gap-1 justify-center">
          Average
          <span className={`text-sm ${sortConfig.key === "average" && sortConfig.direction === "asc" ? "text-white font-bold" : "text-white/50"}`}>▲</span>
          <span className={`text-sm ${sortConfig.key === "average" && sortConfig.direction === "desc" ? "text-white font-bold" : "text-white/50"}`}>▼</span>
        </div>
      </th>

      <th className="px-4 py-2 text-center">Actions</th>
    </tr>
  </thead>

  <tbody>
    {sortedStudents.map((s, idx) => {
      const scores = subjects.map((subj) => s[subj] ?? 0);
      const avg = scores.length
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : "0.0";

      return (
        <tr
          key={s.id}
          className={`border-b border-white/20 ${
            idx % 2 === 0 ? "bg-white/10" : "bg-white/5"
          }`}
        >
          <td className="px-4 py-2">{s.name}</td>

          {subjects.map((subj) => {
            const isTop = topPerSubject[subj] === s.id;
            return (
              <td
                key={subj}
                className={`px-4 py-2 text-center relative ${
                  isTop ? "bg-green-600/30 rounded-md font-bold" : ""
                }`}
              >
                {s[subj] ?? "-"}
                {isTop && (
                  <span className="absolute top-0 right-1 text-yellow-300 font-bold">
                    ★
                  </span>
                )}
              </td>
            );
          })}

          <td className="px-4 py-2 text-center font-semibold">{avg}</td>

          <td className="px-4 py-2 text-center flex justify-center gap-2">
            <button
              onClick={() => setEditingStudent(s)}
              className="p-1 rounded-md transition group"
            >
              <PencilIcon className="w-5 h-5 text-white group-hover:text-gray-400" />
            </button>
            <button
              onClick={() => handleDelete(s.id)}
              className="p-1 rounded-md transition group"
            >
              <TrashIcon className="w-5 h-5 text-white group-hover:text-gray-400" />
            </button>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

            </div>

            <div className="flex justify-center gap-4 mb-4">
              <button onClick={() => setChartType("bar")} className={`px-4 py-2 rounded-md font-semibold ${chartType === 'bar' ? 'bg-green-600 text-white' : 'bg-white/20 text-white'}`}>Bar Chart</button>
              <button onClick={() => setChartType("radar")} className={`px-4 py-2 rounded-md font-semibold ${chartType === 'radar' ? 'bg-green-600 text-white' : 'bg-white/20 text-white'}`}>Polygon (Radar)</button>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
              {chartType === "bar" ? (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#ffffff40"/>
                      <XAxis dataKey="subject" stroke="white"/>
                      <YAxis stroke="white"/>
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10 }}/>
                      <Bar dataKey="average" isAnimationActive={true} maxBarSize={140}>
                        {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill="#ffffffcc"/>))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid/>
                      <PolarAngleAxis dataKey="subject" stroke="white"/>
                      <PolarRadiusAxis stroke="white"/>
                      <Radar name="Group Average" dataKey="average" stroke="#3e3e3ecc" fill="#ffffff55" fillOpacity={0.5}/>
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10 }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {editingStudent && (
        <StudentModal
          student={editingStudent}
          setStudent={setEditingStudent}
          handleSave={handleSave}
          allSubjects={subjects}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {addingStudent && (
        <StudentModal
          student={newStudent}
          setStudent={setNewStudent}
          handleSave={saveNewStudent}
          adding={true}
          allSubjects={subjects}
          onClose={() => {
            setAddingStudent(false);
            setNewStudent({});
          }}
        />
      )}

      {addingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 w-80 shadow-xl border border-white/30 flex flex-col gap-4"
          >
            <h2 className="text-white text-xl font-bold">Add Subject</h2>

            <input
              type="text"
              className="p-2 rounded-md bg-white/90 text-black"
              placeholder="Subject name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setAddingSubject(false); setNewSubjectName(""); }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const name = newSubjectName.trim();
                  if (!name) return;

                  // add subject to all students with default 0 if not exists
                  const updated = students.map(s => ({ ...s, [name]: s[name] ?? 0 }));
                  setStudents(updated);
                  setAddingSubject(false);
                  setNewSubjectName("");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <p className="text-white/80 text-sm mt-6">© 2026 Academic Dashboard</p>
    </div>
  );
}
