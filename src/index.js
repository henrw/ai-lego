import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import App from "./App";
import Knowledge from "./routes/Knowledge";
import Home from "./authentication/Home";
import Navbar from "./components/Navbar";
import Login from "./authentication/Login";
import SignUp from "./authentication/SignUp";
import Canvas from "./components/Canvas";
import { UserAuthContextProvider } from "./authentication/UserAuthContext";
import PrivateRoute from "./authentication/PrivateRoute";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <UserAuthContextProvider>
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Default route for unauthenticated users */}
        <Route path="/" element={<Login />} />

        {/* Protected route for authenticated users */}
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        />

        {/* Other routes */}
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/knowledge" element={<Knowledge />} />
        {/* ... other routes if any */}
      </Routes>
    </BrowserRouter>
  </UserAuthContextProvider>
);
