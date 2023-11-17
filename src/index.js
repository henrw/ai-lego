import { render } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from "./App";
import Knowledge from "./routes/Knowledge";
import Navbar from "./components/Navbar";
import "./index.css"

const rootElement = document.getElementById("root");
render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/knowledge" element={<Knowledge />} />
    </Routes>
  </BrowserRouter>,
  rootElement
);