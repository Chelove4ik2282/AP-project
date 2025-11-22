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
  const [chartType, setChartType] = useState("bar"); // "bar" или "radar"
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

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
      setStudents(students.map(s => s.id === student.id ? student : s));
      setEditingStudent(null);
    }
  };

  const saveNewStudent = (student) => {
    const maxId = Math.max(...students.map(s => s.id), 0);
    const newStud = { ...student, id: maxId + 1, group_id: parseInt(groupId) };
    setStudents([...students, newStud]);
    setAddingStudent(false);
    setNewStudent({});
  };

  const subjects = Array.from(
    new Set(
      students.flatMap(s =>
        Object.keys(s).filter(k => !['id','name','main_teacher_id','group_id'].includes(k))
      )
    )
  );

  // Лучший ученик по предмету
  const topPerSubject = {};
  subjects.forEach(subj => {
    let maxScore = -1;
    let topStudent = null;
    students.forEach(s => {
      const score = s[subj] ?? 0;
      if (score > maxScore) {
        maxScore = score;
        topStudent = s.id;
      }
    });
    topPerSubject[subj] = topStudent;
  });

  // Данные для диаграмм
  const chartData = subjects.map(subj => {
    const values = students.map(s => s[subj] ?? 0);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { subject: subj, average: Number(avg.toFixed(1)) };
  });

  const radarData = chartData;

  // Сортировка
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students];
  if (sortConfig.key) {
    sortedStudents.sort((a,b) => {
      let aVal = sortConfig.key === 'average'
        ? subjects.map(sub => a[sub] ?? 0).reduce((x,y)=>x+y,0)/subjects.length
        : a[sortConfig.key];
      let bVal = sortConfig.key === 'average'
        ? subjects.map(sub => b[sub] ?? 0).reduce((x,y)=>x+y,0)/subjects.length
        : b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Модальное окно для редактирования/добавления
  const StudentModal = ({ student, setStudent, handleSave, adding = false, allSubjects = [] }) => {
    // Локальная копия, чтобы таблица не обновлялась при каждом вводе
    const [localStudent, setLocalStudent] = useState({ ...student });

    const subjectsList = Array.from(
      new Set([...allSubjects, ...Object.keys(localStudent).filter(k => !['id','name','main_teacher_id','group_id'].includes(k))])
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 w-96 shadow-xl border border-white/30 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">{adding ? 'Add Student' : 'Edit Student'}</h2>
            <button onClick={() => setStudent(null)}>
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
                    [subj]: e.target.value === '' ? undefined : parseInt(e.target.value)
                  })
                }
                placeholder={subj}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setStudent(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white">
              Cancel
            </button>
            <button
              onClick={() => handleSave(localStudent)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white flex items-center gap-1"
            >
              <CheckIcon className="w-5 h-5" /> Save
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

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

        {/* Add new student button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setAddingStudent(true); setNewStudent({ name: '' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
          >
            <PlusIcon className="w-5 h-5"/> Add Student
          </button>
        </div>

        {loading ? (
          <p className="text-white text-center">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-white text-center">You have no students assigned.</p>
        ) : (
          <>
            {/* Таблица */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-white border-collapse">
                <thead>
                  <tr className="border-b border-white/30">
                    <th onClick={() => requestSort("name")} className="px-4 py-2 text-left cursor-pointer select-none flex items-center gap-1">
                      Name
                      <span className={`text-sm ${sortConfig.key === "name" && sortConfig.direction === "asc" ? 'text-white font-bold' : 'text-white/50'}`}>▲</span>
                      <span className={`text-sm ${sortConfig.key === "name" && sortConfig.direction === "desc" ? 'text-white font-bold' : 'text-white/50'}`}>▼</span>
                    </th>

                    {subjects.map(subj => (<th key={subj} className="px-4 py-2 text-center">{subj}</th>))}

                    <th onClick={() => requestSort("average")} className="px-4 py-2 text-center cursor-pointer select-none flex items-center gap-1 justify-center">
                      Average
                      <span className={`text-sm ${sortConfig.key === "average" && sortConfig.direction === "asc" ? 'text-white font-bold' : 'text-white/50'}`}>▲</span>
                      <span className={`text-sm ${sortConfig.key === "average" && sortConfig.direction === "desc" ? 'text-white font-bold' : 'text-white/50'}`}>▼</span>
                    </th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((s, idx) => {
                    const scores = subjects.map(subj => s[subj] ?? 0);
                    const avg = (scores.reduce((a,b) => a+b,0) / scores.length).toFixed(1);

                    return (
                      <tr key={s.id} className={`border-b border-white/20 ${idx % 2 === 0 ? "bg-white/10" : "bg-white/5"}`}>
                        <td className="px-4 py-2">{s.name}</td>
                        {subjects.map((subj) => {
                          const isTop = topPerSubject[subj] === s.id;
                          return (
                            <td key={subj} className={`px-4 py-2 text-center relative ${isTop ? 'bg-green-600/30 rounded-md font-bold' : ''}`}>
                              {s[subj] ?? '-'}
                              {isTop && <span className="absolute top-0 right-1 text-yellow-300 font-bold">★</span>}
                            </td>
                          )
                        })}
                        <td className="px-4 py-2 text-center font-semibold">{avg}</td>
                        <td className="px-4 py-2 text-center flex justify-center gap-2">
                          <button onClick={() => setEditingStudent(s)} className="p-1 rounded-md transition group">
                            <PencilIcon className="w-5 h-5 text-white group-hover:text-gray-400"/>
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1 rounded-md transition group">
                            <TrashIcon className="w-5 h-5 text-white group-hover:text-gray-400"/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Кнопка переключения диаграммы */}
            <div className="flex justify-center gap-4 mb-4">
              <button onClick={() => setChartType("bar")} className={`px-4 py-2 rounded-md font-semibold ${chartType === 'bar' ? 'bg-green-600 text-white' : 'bg-white/20 text-white'}`}>Bar Chart</button>
              <button onClick={() => setChartType("radar")} className={`px-4 py-2 rounded-md font-semibold ${chartType === 'radar' ? 'bg-green-600 text-white' : 'bg-white/20 text-white'}`}>Polygon (Radar)</button>
            </div>

            {/* Диаграммы */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
              {chartType === "bar" ? (
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#ffffff40"/>
                      <XAxis dataKey="subject" stroke="white"/>
                      <YAxis stroke="white"/>
                      <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10 }}/>
                      <Bar dataKey="average" isAnimationActive={true}>
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
        <StudentModal student={editingStudent} setStudent={setEditingStudent} handleSave={handleSave} allSubjects={subjects} />
      )}

      {addingStudent && (
        <StudentModal student={newStudent} setStudent={setNewStudent} handleSave={saveNewStudent} adding={true} allSubjects={subjects} />
      )}

      <p className="text-white/80 text-sm mt-6">© 2026 Academic Dashboard</p>
    </div>
  );
}
