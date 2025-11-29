import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/solid";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function StudentModal({
  student = {},
  allSubjects = [],
  onClose,
  onSave,
  adding = false,
}) {
  const [local, setLocal] = useState({ name: "", ...student });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLocal({ name: "", ...student });
    setErrors({});
  }, [student]);

  const subjectsList = useMemo(() => {
    const keys = new Set(allSubjects);
    Object.keys(local).forEach((k) => {
      if (!["id", "name", "photo", "group_id", "history"].includes(k)) {
        keys.add(k);
      }
    });
    return [...keys].sort();
  }, [allSubjects, local]);

  // Преобразуем историю для графика
  const historyData = useMemo(() => {
    const hist = local.history || {};
    const subs = Object.keys(hist).filter((s) => hist[s]?.length > 0);
    if (subs.length === 0) return [];

    const maxL = 3; // максимум 3 оценки
    return Array.from({ length: maxL }).map((_, i) => {
      const obj = { name: `Test ${i + 1}` };
      subs.forEach((s) => {
        const val = hist[s]?.[i];
        obj[s] = val !== undefined && val !== null ? val : null;
      });
      return obj;
    });
  }, [local.history]);

  const lineColors = useMemo(() => {
    const colors = ["#00ff99", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a8dadc", "#ff8fab"];
    const subjects = Object.keys(local.history || {});
    return subjects.reduce((acc, sub, idx) => {
      acc[sub] = colors[idx % colors.length];
      return acc;
    }, {});
  }, [local.history]);

  const validate = () => {
    const newErrors = {};
    if (!local.name.trim()) newErrors.name = "Name is required";

    subjectsList.forEach((sub) => {
      const val = local[sub];
      if (val !== "" && val !== undefined && val !== null) {
        const num = Number(val);
        if (isNaN(num)) newErrors[sub] = "Must be a number";
        else if (num < 0 || num > 100) newErrors[sub] = "Must be 0-100";
      }
      const hist = local.history?.[sub] || [];
      hist.forEach((v, i) => {
        if (v !== null && (isNaN(Number(v)) || v < 0 || v > 100)) {
          newErrors[`${sub}-${i}`] = "Must be 0-100";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = () => {
    if (!validate()) return;

    const cleaned = { ...local };
    cleaned.history = cleaned.history || {};

    subjectsList.forEach((sub) => {
      const val = cleaned[sub];
      if (val === "" || val === undefined || val === null) {
        delete cleaned[sub];
      } else {
        const num = Number(val);
        cleaned[sub] = isNaN(num) ? 0 : Math.max(0, Math.min(100, num));

        if (!cleaned.history[sub]) cleaned.history[sub] = [];
        let hist = [...cleaned.history[sub]];

        // Добавляем новую оценку в историю, максимум 3
        if (num !== hist[hist.length - 1]) {
          hist.push(num);
          if (hist.length > 3) hist.shift(); // оставляем только 3 последних
        }
        cleaned.history[sub] = hist;
      }
    });

    if (!cleaned.photo || !cleaned.photo.trim()) delete cleaned.photo;
    onSave(cleaned);
  };

  const removeSubject = (sub) => {
    setLocal((prev) => {
      const updated = { ...prev };
      delete updated[sub];
      if (updated.history && updated.history[sub]) {
        const newHistory = { ...updated.history };
        delete newHistory[sub];
        updated.history = newHistory;
      }
      return updated;
    });
  };

  const handleGradeChange = (sub, value) => {
    setLocal((prev) => ({ ...prev, [sub]: value }));
    setErrors((prev) => ({ ...prev, [sub]: null }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]"
      onClick={onClose}
    >
      <motion.div
  initial={{ scale: 0.94, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  onClick={(e) => e.stopPropagation()}
  className="w-full max-w-4xl rounded-2xl 
             bg-white/10 backdrop-blur-xl
             border border-white/15 shadow-2xl p-6 text-white
             max-h-[90vh] overflow-auto"
>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 top-0 rounded-[10px] backdrop-blur-sm pb-4 -mt-2 pt-4 z-10">
          <h2 className="pl-[20px] text-2xl font-bold text-white bg-clip-text text-transparent">
            {adding ? "Add New Student" : "Edit Student"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-all hover:rotate-90 duration-300"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT FORM — обновлённая версия */}
<div className="flex flex-col gap-5">
  
  {/* Name */}
  <div className="bg-white/10 p-4 rounded-xl border border-white/10">
    <label className="block text-sm font-medium mb-1 text-white/90">Full Name *</label>
    <input
      type="text"
      placeholder="Enter student name"
      value={local.name}
      onChange={(e) => {
        setLocal({ ...local, name: e.target.value });
        setErrors({ ...errors, name: null });
      }}
      className={`w-full p-3 rounded-lg bg-white/90 text-black placeholder:text-gray-500 outline-none 
      focus:ring-2 focus:ring-green-500 transition ${errors.name ? "ring-2 ring-red-500" : ""}`}
    />
    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
  </div>

  {/* Photo */}
  <div className="bg-white/10 p-4 rounded-xl border border-white/10">
    <label className="block text-sm font-medium mb-1 text-white/90">Photo URL</label>
    <input
      type="url"
      placeholder="https://example.com/photo.jpg"
      value={local.photo || ""}
      onChange={(e) => setLocal({ ...local, photo: e.target.value })}
      className="w-full p-3 rounded-lg bg-white/90 text-black placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500 transition"
    />

    {local.photo && (
      <img
        src={local.photo}
        alt="Preview"
        className="w-24 h-24 rounded-full object-cover shadow-lg border border-white/20 mx-auto mt-3"
        onError={(e) => (e.target.style.display = "none")}
      />
    )}
  </div>

  {/* SUBJECTS */}
  <div className="bg-white/10 p-4 rounded-xl border border-white/10">
    <label className="block text-sm font-medium mb-2 text-white/90">Subject Grades (0-100)</label>

    <div className="flex flex-col gap-3 max-h-72 overflow-auto pr-1">
      {subjectsList.length === 0 ? (
        <p className="text-white/60 text-sm text-center py-3">No subjects available</p>
      ) : (
        subjectsList.map((sub) => {
          const hist = local.history?.[sub] || [];
          const weeks = Math.max(hist.length, local[sub] !== undefined ? 1 : 0);

          return (
            <div key={sub} className="flex flex-col gap-1 bg-white/5 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-28 text-sm text-white/90 truncate" title={sub}>{sub}</span>

                {/* main input*/}
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0-100"
                  value={local[sub] ?? ""}
                  onChange={(e) => /^\d{0,3}(\.\d?)?$/.test(e.target.value) && handleGradeChange(sub, e.target.value)}
                  className={`flex-1 p-2 rounded-md bg-white/95 text-black text-[13px] placeholder:text-gray-400 outline-none 
                  focus:ring-2 focus:ring-green-500 ${errors[sub] ? "ring-2 ring-red-500" : ""}`}
                />
                
                {/* delete btn */}
                {local[sub] && (
                  <button onClick={() => removeSubject(sub)} className="p-1 rounded-md hover:bg-red-500/30 text-red-400 transition">
                    <TrashIcon className="w-4 h-4"/>
                  </button>
                )}
              </div>

              {/* history block */}
              {weeks > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <input
                      key={i}
                      type="number"
                      min="0" max="100"
                      placeholder={`T${i+1}`}
                      value={hist[i] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocal(prev => {
                          let u = {...prev};
                          if(!u.history) u.history = {};
                          if(!u.history[sub]) u.history[sub] = [];
                          u.history[sub][i] = val ? Number(val) : null;
                          if(u.history[sub].length>3) u.history[sub].shift();
                          return u;
                        });
                      }}
                      className="w-16 p-1.5 rounded-md bg-white/80 text-black text-xs outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  </div>
  
</div>


          {/* RIGHT SIDE */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* STATISTICS */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl border border-white/10">
              <h3 className="font-semibold mb-3 text-white/90 flex items-center gap-2">
                📊 Current Performance
              </h3>

              {subjectsList.some(
                (s) => local[s] !== undefined && local[s] !== ""
              ) ? (
                <div className="grid grid-cols-2 gap-3">
                  {subjectsList
                    .filter((s) => local[s] !== undefined && local[s] !== "")
                    .map((sub) => {
                      const grade = Number(local[sub] || 0);
                      const color =
                        grade >= 70
                          ? "text-green-400"
                          : grade >= 50
                          ? "text-yellow-400"
                          : "text-red-400";
                      return (
                        <div
                          key={sub}
                          className="flex justify-between items-center bg-white/5 p-2 rounded-lg"
                        >
                          <span className="text-sm text-white/80">{sub}</span>
                          <span className={`font-bold ${color}`}>{grade}</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-white/60 text-sm">No grades entered yet.</p>
              )}
            </div>

            {/* CHART */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 p-4 rounded-xl border border-white/10">
              <h3 className="font-semibold mb-3 text-white/90 flex items-center gap-2">
                📈 Progress History
              </h3>

              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#ffffff80" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#ffffff80" style={{ fontSize: "12px" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                    {Object.keys(local.history || {}).map((s) => (
                      <Line
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stroke={lineColors[s] || "#00ff99"}
                        strokeWidth={2}
                        dot={{ r: 3, fill: lineColors[s] || "#00ff99" }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-white/60 text-sm">No history data available yet.</p>
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3   bottom-0  backdrop-blur-sm pt-4 pr-5 -mb-2 pb-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-green-500/30"
              >
                <CheckIcon className="w-5 h-5" />
                {adding ? "Add Student" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
