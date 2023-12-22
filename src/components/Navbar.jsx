import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { useUserAuth } from "../authentication/UserAuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { user } = useUserAuth();

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("User signed out.");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <nav className="flex items-center justify-between bg-gray-200 py-2 px-4 shadow-md">
      <div className="flex items-center">
        {/* Wrap the image in a Link component */}
        <Link to="/home">
          <img src="/logo.svg" alt="logo" width="150" className="mr-10" />
        </Link>
      </div>
      <div className="links flex gap-8">
        {user ? (
          <>
            <Link
              to="/home"
              className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
            >
              About us
            </Link>
            <Link
              to="/knowledge"
              className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
            >
              Knowledge Base
            </Link>
            <Link
              to="/projects"
              className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
            >
              Projects
            </Link>
            <Link
              to="/contact"
              className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
            >
              Contact us
            </Link>
            <div className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200">
              <button
                onClick={handleSignOut}
                className="bg-red-400 rounded-lg px-1"
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <Link
            to="/canvas"
            className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
          >
            Test Around Without Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
