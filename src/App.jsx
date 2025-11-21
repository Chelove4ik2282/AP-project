import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Login";
import DashboardPage from "./components/Dashboard";
import GroupsPage from "./components/GroupsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/dashboard/:groupId" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
