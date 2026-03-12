import { createContext, useContext, useEffect, useMemo, useState } from "react";
import usuariosSeed from "../data/usuarios.json";

const STORAGE_KEY = "invtrack_users";
const STORAGE_CURRENT_USER_KEY = "invtrack_current_user_id";

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

function loadCurrentUserId() {
  try {
    const raw = window.localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [currentUserId, setCurrentUserId] = useState(loadCurrentUserId);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId === null || currentUserId === undefined) {
      window.localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_CURRENT_USER_KEY, String(currentUserId));
  }, [currentUserId]);

  const addUser = (user) => {
    setUsers((prev) => [...prev, user]);
  };

  const currentUser =
    users.find((u) => Number(u?.id_usuario) === Number(currentUserId)) ?? users[0] ?? null;

  const value = useMemo(
    () => ({
      users,
      addUser,
      setUsers,
      currentUser,
      currentUserId,
      setCurrentUserId,
    }),
    [users, currentUser, currentUserId]
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

