import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "./UserAuthContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { randomAvatarSeed } from "../utils/avatar";
import Footer from "../components/Footer";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useUserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await signUp(email, password);
      await setDoc(doc(db, "users", response.user.uid), {
        fullName,
        email,
        occupation: "",
        experienceLevel: "",
        profile_picture: "",
        avatarSeed: randomAvatarSeed(),
        projectIds: [],
      });
      navigate("/home", { state: { newUser: true } });
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
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Create account</h2>
        <p className="text-sm text-gray-400 mb-8">Get started for free.</p>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              onChange={(e) => setFullName(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
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
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/" className="text-blue-500 hover:underline">Sign in</Link>
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default SignUp;
