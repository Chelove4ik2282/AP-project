import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, ref, set, remove } from "firebase/database";
import { db } from "../firebase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrashIcon } from "@heroicons/react/24/solid";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allGroups, setAllGroups] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCapacity, setNewGroupCapacity] = useState(20);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const currentUserId = parseInt(sessionStorage.getItem("currentUserId"));
  const currentUserName = sessionStorage.getItem("currentUserName");
  const COLORS = ["#d1d5db", "#9ca3af"];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const groupsSnap = await get(ref(db, "groups"));
        const groupsData = groupsSnap.val() ? Object.values(groupsSnap.val()) : [];
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

  const getStudentCount = (groupId) =>
    students.filter((s) => s.group_id === groupId).length;

  const getInitials = (name) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const filteredGroups = groups.filter((g) => {
    const lowerSearch = search.toLowerCase();
    const matchGroupName = g.name.toLowerCase().includes(lowerSearch);
    const groupStudents = students.filter((s) => s.group_id === g.id);
    const matchStudent = groupStudents.some((s) =>
      s.name.toLowerCase().includes(lowerSearch)
    );
    return matchGroupName || matchStudent;
  });

  async function createGroup() {
    if (!newGroupName.trim()) return alert("Enter group name");

    try {
      const newId = Date.now();
      const groupObj = {
        id: newId,
        name: newGroupName,
        capacity: Number(newGroupCapacity),
        main_teacher_id: currentUserId,
      };
      await set(ref(db, `groups/${newId}`), groupObj);
      setGroups((prev) => [...prev, groupObj]);
      setAllGroups((prev) => [...prev, groupObj]);
      setShowAddModal(false);
      setNewGroupName("");
      setNewGroupCapacity(20);
    } catch (err) {
      console.error("Error creating group:", err);
    }
  }

  const deleteGroup = async (groupId) => {
    try {
      await remove(ref(db, `groups/${groupId}`));
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setAllGroups((prev) => prev.filter((g) => g.id !== groupId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);
      setGroups(arrayMove(groups, oldIndex, newIndex));
    }
  };

  const SortableItem = ({ group }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: group.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : 1, // скрываем оригинал при перетаскивании
    };

    const count = getStudentCount(group.id);
    const maxStudents = group.capacity;
    const percent = Math.min((count / maxStudents) * 100, 100);

    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={style}
        className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-xl shadow cursor-pointer hover:bg-white/20 transition-all relative"
      >
        <div onClick={() => navigate(`/dashboard/${group.id}`)} className="flex flex-col">
          <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg font-semibold mb-3 backdrop-blur-xl">
            {getInitials(group.name)}
          </div>
          <h2 className="text-xl text-white font-medium">{group.name}</h2>
          <p className="text-white/60 text-sm mt-1">Students: {count}</p>
          <div className="w-full bg-white/20 rounded-full h-2 mt-3">
            <div className="h-2 bg-white rounded-full transition-all" style={{ width: `${percent}%` }}></div>
          </div>
          <p className="text-white/40 text-xs mt-1">{count} / {maxStudents} capacity</p>
        </div>
        <button
          onClick={() => setConfirmDeleteId(group.id)}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/30 hover:bg-red-500/60 transition-shadow shadow-sm hover:shadow-md text-white"
          title="Delete Group"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg3.gif')" }}>
      <h1 className="text-3xl font-semibold text-white mb-2">Welcome, {currentUserName}</h1>
      <p className="text-white/70 text-sm mb-6">Select a group to view students</p>

      <input
        type="text"
        placeholder="Search group..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xl p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 mb-6 backdrop-blur-xl"
      />

      <button
        onClick={() => setShowAddModal(true)}
        className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium mb-8 transition"
      >
        + Add New Group
      </button>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/10 border border-white/20 p-5 rounded-xl animate-pulse">
              <div className="h-5 bg-white/30 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-white/20 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={(e) => setActiveId(e.active.id)}
        >
          <SortableContext items={filteredGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl mb-12">
              {filteredGroups.map((group) => (
                <SortableItem key={group.id} group={group} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-xl shadow cursor-pointer w-full max-w-xl">
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg font-semibold mb-3">
                    {getInitials(groups.find((g) => g.id === activeId)?.name)}
                  </div>
                  <h2 className="text-xl text-white font-medium">{groups.find((g) => g.id === activeId)?.name}</h2>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <div className="w-full max-w-xl bg-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-xl">
        <h3 className="text-center text-lg text-white mb-4 font-medium">Your Group Distribution</h3>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
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

      {/* Add Group Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white/10 border border-white/20 p-6 rounded-xl w-80 shadow-xl text-white">
            <h2 className="text-lg font-semibold mb-4 text-center">Create Group</h2>
            <input type="text" placeholder="Group name..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full p-2 rounded bg-white/10 border border-white/20 mb-3" />
            <input type="number" placeholder="Capacity" value={newGroupCapacity} min={1} onChange={(e) => setNewGroupCapacity(e.target.value)} className="w-full p-2 rounded bg-white/10 border border-white/20 mb-4" />
            <div className="flex gap-2">
              <button onClick={createGroup} className="flex-1 p-2 bg-green-500/60 hover:bg-green-500 rounded transition font-medium">Create</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 p-2 bg-red-500/60 hover:bg-red-500 rounded transition font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white/10 border border-white/20 p-6 rounded-xl w-80 shadow-xl text-white">
            <h2 className="text-lg font-semibold mb-4 text-center">Delete Group</h2>
            <p className="text-center mb-4">Are you sure you want to delete this group?</p>
            <div className="flex gap-2">
              <button onClick={() => deleteGroup(confirmDeleteId)} className="flex-1 p-2 bg-red-500/60 hover:bg-red-500 rounded transition font-medium">Delete</button>
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 p-2 bg-gray-500/60 hover:bg-gray-500 rounded transition font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-white/50 text-sm mt-10">© 2026 Academic Dashboard</p>
    </div>
  );
}
