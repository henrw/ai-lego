import OpenAIKeyField from './OpenAIKeyField';
import React, { useState, useEffect } from "react";
import { useUserAuth } from "../authentication/UserAuthContext";
import { Link, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ACCOUNT_ROLES, profileAvatar, randomAvatarSeed, roleLabel } from "../utils/avatar";
import { db } from "../firebase";

const Navbar = () => {
  const { user, logOut } = useUserAuth();
  const location = useLocation();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userDetails, setUserDetails] = useState({});

  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState("");
  useEffect(() => {
    setUserDetails({}); setDropdownVisible(false); setProfileError("");
    if (!user?.uid) return;
    return onSnapshot(doc(db, "users", user.uid), snapshot => {
      setUserDetails(snapshot.data() || {});
    }, () => setProfileError("Could not load your profile."));
  }, [user?.uid]);
  const saveProfile = async changes => {
    if (!user?.uid || profilePending) return;
    setProfilePending(true); setProfileError("");
    try { await updateDoc(doc(db, "users", user.uid), changes); }
    catch { setProfileError("Could not save your profile. Please retry."); }
    finally { setProfilePending(false); }
  };

  const handleSignOut = () => {
    logOut()
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
              <button onClick={toggleDropdown} aria-label="Account menu" aria-expanded={dropdownVisible} className="focus:outline-none">
                <img src={profileAvatar(userDetails, user.uid)} alt="Account profile" className="w-8 h-8 rounded-full" />
              </button>
              {dropdownVisible && (
                <div className="absolute right-0 mt-2 py-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-md shadow-xl z-20">
                  <div className="px-4 py-2 flex flex-col items-center">
                    <img src={profileAvatar(userDetails, user.uid)} alt="Your avatar" className="w-12 h-12 rounded-full mb-2" />
                    <div className="text-sm">{userDetails.fullName}</div>
                    {/* <div className="text-xs text-gray-500">
                      Occupation: {userDetails.occupation}
                    </div>
                    <div className="text-xs text-gray-500">
                      Permission: {userDetails.permission || "Edit/Review"}
                    </div> */}
                  </div>
                  <div className="px-4 py-2">
                    <OpenAIKeyField />
                    <label htmlFor="account-role" className="text-xs font-semibold">Your role</label>
                    <select id="account-role" value={userDetails.occupation || ""} disabled={profilePending}
                      onChange={event => saveProfile({ occupation: event.target.value })} className="w-full border rounded p-1 text-sm mt-1">
                      <option value="">Select a role</option>
                      {ACCOUNT_ROLES.map(role => <option key={role} value={role}>{role === "Admin" ? role : `${roleLabel(role)} · ${role}`}</option>)}
                      {userDetails.occupation && !ACCOUNT_ROLES.includes(userDetails.occupation) && <option value={userDetails.occupation}>{userDetails.occupation}</option>}
                    </select>
                    <button disabled={profilePending} onClick={() => saveProfile({ avatarSeed: randomAvatarSeed(), profile_picture: "" })}
                      className="text-sm text-blue-600 mt-3">{profilePending ? "Saving…" : "Randomize avatar"}</button>
                    {profileError && <p role="alert" className="text-xs text-red-600 mt-2">{profileError}</p>}
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
                <button onClick={toggleDropdown} aria-label="Account menu" aria-expanded={dropdownVisible} className="focus:outline-none">
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
