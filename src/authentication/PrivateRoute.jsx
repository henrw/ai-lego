import React from "react";
import { Navigate } from "react-router-dom";
import { useUserAuth } from "./UserAuthContext";
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUserAuth();

  if (loading) return <div role="status">Loading…</div>;
  if (!user?.uid) {
    return <Navigate to="/" />;
  }
  return children;
};

export default ProtectedRoute;
