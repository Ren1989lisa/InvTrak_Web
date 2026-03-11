import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Dashboard from "./Pages/DashBoard";
import ForgotPassword from "./Pages/ForgotPassword";
import BienesRegistrados from "./Pages/BienesRegistrados";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/bienes-registrados" element={<BienesRegistrados />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;