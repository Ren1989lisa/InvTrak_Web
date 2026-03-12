import { createContext, useContext, useEffect, useMemo, useState } from "react";
import usuariosSeed from "../data/usuarios.json";

const STORAGE_KEY = "invtrack_users";

const UsersContext = createContext(null);

function loadUsers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return Array.isArray(usuariosSeed) ? usuariosSeed : [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return Array.isArray(usuariosSeed) ? usuariosSeed : [];
  }
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const addUser = (user) => {
    setUsers((prev) => [...prev, user]);
  };

  const value = useMemo(
    () => ({
      users,
      addUser,
      setUsers,
    }),
    [users]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsers must be used within UsersProvider");
  }
  return ctx;
}

