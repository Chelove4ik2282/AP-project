import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Login";
import DashboardPage from "./components/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
