import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";
import { db } from "../firebase"; // твой firebase.js
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
  const [search, setSearch] = useState("");
  const [allGroups, setAllGroups] = useState([]);

  const currentUserId = parseInt(sessionStorage.getItem("currentUserId"));
  const currentUserName = sessionStorage.getItem("currentUserName");

  const COLORS = ["#d1d5db", "#9ca3af"];

  useEffect(() => {
    async function fetchData() {
      try {
        const dbRef = ref(db);

        // Получаем группы
        const groupsSnap = await get(ref(db, "groups"));
        const groupsData = groupsSnap.val() ? Object.values(groupsSnap.val()) : [];

        // Получаем студентов
        const studentsSnap = await get(ref(db, "students"));
        const studentsData = studentsSnap.val() ? Object.values(studentsSnap.val()) : [];

        setAllGroups(groupsData);
        setGroups(groupsData.filter((g) => g.main_teacher_id === currentUserId));
        setStudents(studentsData);
      } catch (err) {
        console.error("Firebase read error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentUserId]);

  const chartData = [
    { name: "Your Groups", value: groups.length },
    { name: "Other", value: allGroups.length - groups.length },
  ];

  const getStudentCount = (groupId) => {
    return students.filter((s) => s.group_id === groupId).length;
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredGroups = groups.filter((g) => {
    const lowerSearch = search.toLowerCase();
    const matchGroupName = g.name.toLowerCase().includes(lowerSearch);
    const groupStudents = students.filter((s) => s.group_id === g.id);
    const matchStudent = groupStudents.some((s) =>
      s.name.toLowerCase().includes(lowerSearch)
    );
    return matchGroupName || matchStudent;
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg3.gif')" }}
    >
      <h1 className="text-3xl font-semibold text-white mb-2">
        Welcome, {currentUserName}
      </h1>

      <p className="text-white/70 text-sm mb-6">Select a group to view students</p>

      <input
        type="text"
        placeholder="Search group..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xl p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 mb-6 backdrop-blur-xl"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl mb-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/10 border border-white/20 p-5 rounded-xl animate-pulse"
            >
              <div className="h-5 bg-white/30 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-white/20 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl mb-12">
          {filteredGroups.map((g) => {
            const count = getStudentCount(g.id);
            const maxStudents = g.capacity;
            const percent = Math.min((count / maxStudents) * 100, 100);

            return (
              <div
                key={g.id}
                onClick={() => navigate(`/dashboard/${g.id}`)}
                className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-xl shadow cursor-pointer hover:bg-white/20 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg font-semibold mb-3 backdrop-blur-xl animate-[fadeIn_0.4s_ease]">
                  {getInitials(g.name)}
                </div>

                <h2 className="text-xl text-white font-medium">{g.name}</h2>

                <p className="text-white/60 text-sm mt-1">Students: {count}</p>

                <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                  <div
                    className="h-2 bg-white rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <p className="text-white/40 text-xs mt-1">
                  {count} / {maxStudents} capacity
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="w-full max-w-xl bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-xl">
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

      <p className="text-white/50 text-sm mt-10">© 2026 Academic Dashboard</p>
    </div>
  );
}
