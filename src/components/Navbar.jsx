import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useUserAuth } from "../authentication/UserAuthContext";
import { Link, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Navbar = () => {
  const { user } = useUserAuth();
  const location = useLocation();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userDetails, setUserDetails] = useState({});

  // Fetch user details from Firestore
  useEffect(() => {
    if (user && Object.keys(user).length !== 0) {
      const fetchUserDetails = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        } else {
          // console.log("No such document!");
        }
      };
      fetchUserDetails().catch(() => setUserDetails({}));
    }
  }, [user]);

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        // console.log("User signed out.");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };
  const isOnCanvas = location.pathname === "/canvas";
  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

  return (
    <nav className="fixed z-50 min-w-full flex items-center justify-between bg-gray-200 py-2 px-4 shadow-md">
      <div className="flex items-center">
        <Link to={user ? "/home" : "/"}>
          <img src="/logo.svg" alt="logo" width="150" className="mr-10" />
        </Link>
      </div>
      <div className="links flex flex-row items-center gap-8">
        {user ? (
          <>
            <div className="relative">
              <button onClick={toggleDropdown} className="focus:outline-none">
                {userDetails.profile_picture ? (
                  <img
                    src={userDetails.profile_picture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <FaUserCircle size="3em" className="-my-5" color="#A9A9A9" />
                )}
              </button>
              {dropdownVisible && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                  <div className="px-4 py-2 flex flex-col items-center">
                    <FaUserCircle size="3em" className="" color="#A9A9A9" />
                    <div className="text-sm">{userDetails.fullName}</div>
                    {/* <div className="text-xs text-gray-500">
                      Occupation: {userDetails.occupation}
                    </div>
                    <div className="text-xs text-gray-500">
                      Permission: {userDetails.permission || "Edit/Review"}
                    </div> */}
                  </div>
                  <div className="px-4 py-2">
                    <div className="text-xs font-bold text-center">Team Members</div>
                    {/* Map through team members here */}
                  </div>
                  {/* <div className="px-4 py-2 flex flex-col">
                    <button className="text-sm w-full text-left">
                      Edit profile information
                    </button>
                    <button className="text-sm w-full text-left mt-2">
                      View/edit document access
                    </button>
                  </div> */}
                  <div className="flex flex-row justify-center text-lg text-white transition-colors duration-200">
                    <button
                      onClick={handleSignOut}
                      className="bg-red-400 hover:bg-red-500 rounded-2 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      Sign Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {isOnCanvas && (
              <div className="relative">
                <button onClick={toggleDropdown} className="focus:outline-none">
                  <FaUserCircle size="2em" />
                </button>
                {dropdownVisible && (
                  <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                    <div className="px-4 py-2 flex flex-col items-center">
                      <FaUserCircle className="w-24 h-24 text-gray-300" />
                      <div className="text-sm">{"Guest"}</div>
                      <div className="text-xs text-gray-500">
                        Permission: Edit/Review
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Link
              to="/demo"
              className="text-lg text-gray-700 hover:text-blue-500 transition-colors duration-200"
            >
              {isOnCanvas ? "Get Registered" : "Test Around Without Login"}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
