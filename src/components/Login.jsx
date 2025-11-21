import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/users.json");
      const users = await res.json();

      const user = users.find(u => u.login === login && u.password === password);

      if (!user) {
        setError("Invalid login or password");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("currentUserId", user.id);
      sessionStorage.setItem("currentUserName", user.name);

      navigate("/dashboard");
    } catch (err) {
      setError("Cannot load users.json");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: "url('/bg3.gif')" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30"
      > 
        <img
          src="/logo.png"
          alt="Logo"
          className="w-30  mx-auto mb-4 drop-shadow-xl"
        />

        {/* <h1 className="text-3xl font-bold text-center text-white mb-6">
          Student Academic Performance Dashboard
        </h1> */}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-white text-sm font-medium">Login</label>
            <input
              type="text"
              className="w-full mt-1 p-3 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
            {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-white text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full mt-1 p-3 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-800 hover:to-purple-700 text-white font-semibold text-lg shadow-lg transition flex items-center justify-center"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
              />
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="text-center text-white/80 text-sm mt-6">
          © 2026 Academic Dashboard
        </p>
      </motion.div>
    </div>
  );
}
