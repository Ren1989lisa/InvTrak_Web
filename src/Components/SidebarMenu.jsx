import { useEffect, useMemo } from "react";
import UserProfileCard from "./UserProfileCard";
import SidebarItem from "./SidebarItem";
import PrimaryButton from "./PrimaryButton";
import { useUsers } from "../context/UsersContext";

export default function SidebarMenu({
  open,
  onClose,
  userName = "Administrador",
  items = [],
  onLogout,
  onViewProfile,
}) {
  const { currentUser } = useUsers();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const displayUserName = useMemo(() => {
    const toText = (value) => (value ?? "").toString().trim();
    const isLikelyIdentifier = (value) => {
      if (!value) return true;
      if (value.includes("@")) return true;
      return /\d/.test(value) && !/\s/.test(value);
    };

    const candidates = [
      toText(currentUser?.nombre),
      toText(currentUser?.nombre_completo),
      toText(currentUser?.nombreCompleto),
      toText(userName),
    ];

    for (const candidate of candidates) {
      if (!candidate || isLikelyIdentifier(candidate)) continue;
      return candidate;
    }

    return "Usuario";
  }, [currentUser?.nombre, currentUser?.nombreCompleto, currentUser?.nombre_completo, userName]);

  return (
    <>
      <div
        className={`inv-sidebar__overlay${open ? " inv-sidebar__overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside className={`inv-sidebar${open ? " inv-sidebar--open" : ""}`}>
        <div className="inv-sidebar__inner">
          <UserProfileCard name={displayUserName} onViewProfile={onViewProfile} />

          <nav className="inv-sidebar__nav" aria-label="Menu principal">
            {items.map((item) => (
              <SidebarItem
                key={item.route}
                icon={item.icon}
                label={item.label}
                route={item.route}
                onClick={onClose}
              />
            ))}
          </nav>

          <div className="inv-sidebar__footer">
            <PrimaryButton
              variant="danger"
              label="Cerrar sesion"
              onClick={onLogout}
              className="w-100 inv-sidebar__logoutBtn"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
