import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useUserAuth } from "./UserAuthContext";
import Footer from "../components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { logIn, user } = useUserAuth();
  const navigate = useNavigate();

  if (user?.uid) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await logIn(email, password);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex">

      <div className="flex-1 flex flex-col justify-center px-16 py-20 bg-gray-50">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            Responsible AI,<br />by design.
          </h1>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            AI LEGO helps cross-functional teams proactively identify and address
            ethical risks in AI systems — before they ship.
          </p>
          <div className="space-y-4">
            {[
              ["Build", "Map your AI pipeline stage by stage with modular blocks."],
              ["Simulate", "Generate stakeholder personas and evaluate potential harms with AI."],
              ["Collaborate", "Leave evaluations and share projects with your team."],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <div>
                  <span className="font-semibold text-gray-700">{title} — </span>
                  <span className="text-gray-500">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[420px] flex flex-col justify-center px-12 py-20 bg-white border-l border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign in</h2>
        <p className="text-sm text-gray-400 mb-8">Welcome back.</p>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className="mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Sign in
          </button>
        </form>
        <div className="mt-6 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-500 mb-3">New to AI LEGO?</p>
          <Link
            to="/signup"
            className="block w-full py-2.5 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            Sign up
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
