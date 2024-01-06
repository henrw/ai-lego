// SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useUserAuth } from "./UserAuthContext";
import { db } from "../firebase"; // Ensure you have this import
import { doc, setDoc } from "firebase/firestore"; // Import Firestore document set function

const SignUp = () => {
  const [fullName, setFullName] = useState(""); // Add state for full name
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useUserAuth();
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await signUp(email, password);
      // Create a Firestore user document
      await setDoc(doc(db, "users", response.user.uid), {
        fullName, // Save the full name
        email, // Save the email
        // Initialize other fields with default values or empty strings
        occupation: "",
        experienceLevel: "",
        employer: "",
        department: "",
        profile_picture: "",
      });
      navigate("/home", { state: { newUser: true } });
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="flex h-[calc(100vh-112px)]">
      <div className="m-auto flex flex-col items-center ">
        <div className="text-2xl font-bold m-7">Signup</div>

        {error && <div className="text-red-500">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="flex flex-row my-1">
            <div className="mr-auto px-2">Full Name</div>
            <input
              type="text"
              placeholder="Enter Your Full Name"
              onChange={(e) => setFullName(e.target.value)}
              className="px-2 py-1 border rounded"
            />
          </label>
          <label className="flex flex-row my-1">
            <div className="mr-auto px-2">Email</div>
            <input
              type="email"
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
              className="px-2 py-1 border rounded"
            />
          </label>

          <label className="flex flex-row my-1">
            <div className="mr-auto px-2">Password</div>
            <input
              type="password"
              placeholder="Create Password"
              onChange={(e) => setPassword(e.target.value)}
              className="px-2 py-1 border rounded"
            />
          </label>

          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              class="border border-blue-500 hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-1 px-2 hover:border-transparent rounded"
            >
              Sign Up
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          Already have an account?
          <Link to="/" className=" text-blue-500">
            {" "}
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
