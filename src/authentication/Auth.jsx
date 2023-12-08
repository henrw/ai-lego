import React, { useEffect, useState } from "react";
import app from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const auth = getAuth();

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
              // User is signed in, see docs for a list of available properties
              // https://firebase.google.com/docs/reference/js/auth.user
              const uid = user.uid;
              // ...
            } else {
              // User is signed out
              // ...
            }
          });
    }, []);

    return (
        <AuthContext.Provider
            value={{currentUser}}
        >
            {children}
        </AuthContext.Provider>
    );
};