import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Alert } from "react-bootstrap";
import GoogleButton from "react-google-button";
import { useUserAuth } from "./UserAuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { logIn, googleSignIn } = useUserAuth();
  const navigate = useNavigate();

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

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    try {
      await googleSignIn();
      navigate("/home");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-112px)]">
      <div className="m-auto flex flex-col items-center ">
        <div className="text-2xl font-bold m-7">Login</div>

        {error && <div className="text-red-500">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col">
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
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className="px-2 py-1 border rounded"
            />
          </label>

          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="border border-blue-500 hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-1 px-2 hover:border-transparent rounded"
            >
              Log In
            </button>
          </div>
        </form>

        <hr className="my-4" />

        {/* <div className="flex justify-center">
          <GoogleButton
            className="g-btn"
            type="dark"
            onClick={handleGoogleSignIn}
          />
        </div> */}

        <div className="text-center mt-3">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-500">
            {" "}
            Join for Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
