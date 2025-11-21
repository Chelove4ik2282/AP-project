import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);

  const currentUserId = parseInt(sessionStorage.getItem("currentUserId"));
  const currentUserName = sessionStorage.getItem("currentUserName");
 
  useEffect(() => {
    fetch("/students.json")
      .then(res => res.json())
      .then((data) => {
        setStudents(data.filter(s => s.main_teacher_id === currentUserId));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [currentUserId]);
 
  const handleDelete = (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents(students.filter(s => s.id !== studentId));
    }
  };
 
  const handleSave = () => {
    if (editingStudent) {
      setStudents(students.map(s =>
        s.id === editingStudent.id ? editingStudent : s
      ));
      setEditingStudent(null);
    }
  };
 
  const subjects = Array.from(
    new Set(students.flatMap(s => Object.keys(s).filter(k => !['id','name','main_teacher_id'].includes(k))))
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg3.gif')" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Welcome, {currentUserName}
        </h1>

        {loading ? (
          <p className="text-white text-center">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-white text-center">You have no students assigned.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-white border-collapse">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="px-4 py-2 text-left">Name</th>
                  {subjects.map(subj => (
                    <th key={subj} className="px-4 py-2 text-center">{subj}</th>
                  ))}
                  <th className="px-4 py-2 text-center">Average</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const scores = subjects.map(subj => s[subj] ?? 0);
                  const avg = (scores.reduce((a,b) => a+b,0) / scores.length).toFixed(1);

                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-white/20 ${idx % 2 === 0 ? "bg-white/10" : "bg-white/5"}`}
                    >
                      <td className="px-4 py-2">{s.name}</td>
                      {subjects.map(subj => (
                        <td key={subj} className="px-4 py-2 text-center">{s[subj] ?? '-'}</td>
                      ))}
                      <td className="px-4 py-2 text-center font-semibold">{avg}</td>
                      <td className="px-4 py-2 text-center flex justify-center gap-2">
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="p-1 rounded-md transition group"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5 text-white transition group-hover:text-gray-400" />
                        </button>

                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1 rounded-md transition group"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5 text-white transition group-hover:text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
 
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 w-96 shadow-xl border border-white/30 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl font-bold">Edit Student</h2>
              <button onClick={() => setEditingStudent(null)}>
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            <input
              type="text"
              className="p-2 rounded-md bg-white/90 text-black focus:outline-none"
              value={editingStudent.name}
              onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
              placeholder="Name"
            />

            {subjects.map(subj => (
              <div key={subj} className="flex flex-col">
                <label className="text-white mb-1">{subj}</label>
                <input
                  type="number"
                  className="p-2 rounded-md bg-white/90 text-black focus:outline-none"
                  value={editingStudent[subj] ?? ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      [subj]: e.target.value === '' ? undefined : parseInt(e.target.value),
                    })
                  }
                  placeholder={subj}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white flex items-center gap-1"
              >
                <CheckIcon className="w-5 h-5" /> Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <p className="text-white/80 text-sm mt-6">© 2026 Academic Dashboard</p>
    </div>
  );
}
