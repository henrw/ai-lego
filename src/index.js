import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from "./App";
import Knowledge from "./routes/Knowledge";
import Navbar from "./components/Navbar";
import Login from './authentication/Login';
import SignUp from './authentication/SignUp';
import { AuthProvider } from './authentication/Auth';
import "./index.css"
import PrivateRoute from './authentication/PrivateRoute';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <AuthProvider>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/knowledge" element={<Knowledge />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>

);
