import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = parseInt(sessionStorage.getItem("currentUserId"));
  const currentUserName = sessionStorage.getItem("currentUserName");

  // Цвета диаграммы — серые, ненавязчивые
  const COLORS = ["#d1d5db", "#9ca3af"];

  useEffect(() => {
    // Загружаем группы
    fetch("/groups.json")
      .then((res) => res.json())
      .then((groupsData) => {
        setGroups(groupsData.filter((g) => g.main_teacher_id === currentUserId));
      });

    // Загружаем студентов
    fetch("/students.json")
      .then((res) => res.json())
      .then((studentsData) => {
        setStudents(studentsData);
        setLoading(false);
      });
  }, [currentUserId]);

  // Данные для диаграммы
  const chartData = [
    { name: "Your Groups", value: groups.length },
    { name: "Other", value: 5 - groups.length },
  ];

  // Функция подсчета количества студентов в группе
  const getStudentCount = (groupId) => {
    return students.filter((s) => s.group_id === groupId).length;
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg3.gif')" }}
    >
      <h1 className="text-3xl font-semibold text-white mb-2">
        Welcome, {currentUserName}
      </h1>

      <p className="text-white/70 text-sm mb-8">
        Select a group to view students
      </p>

      {loading ? (
        <p className="text-white">Loading groups...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl mb-12">
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => navigate(`/dashboard/${g.id}`)}
              className="bg-white/10 backdrop-blur-xl border border-white/20 
                         p-5 rounded-xl shadow cursor-pointer 
                         hover:bg-white/20 transition-all"
            >
              <h2 className="text-xl text-white font-medium">{g.name}</h2>
              <p className="text-white/60 text-sm mt-1">
                Students: {getStudentCount(g.id)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ---- DIAGRAM BELOW ---- */}
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-xl">
        <h3 className="text-center text-lg text-white mb-4 font-medium">
          Your Group Distribution
        </h3>

        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-white/50 text-sm mt-10">
        © 2026 Academic Dashboard
      </p>
    </div>
  );
}
