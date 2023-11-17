import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from "./App";
import Knowledge from "./routes/Knowledge";
import Navbar from "./components/Navbar";
import "./index.css"

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/knowledge" element={<Knowledge />} />
    </Routes>
  </BrowserRouter>
);
