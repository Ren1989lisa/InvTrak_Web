import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App.jsx";
import { UsersProvider } from "./context/UsersContext";

createRoot(document.getElementById("root")).render(
  <UsersProvider>
    <App />
  </UsersProvider>
);