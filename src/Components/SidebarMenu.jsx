import { useEffect } from "react";
import UserProfileCard from "./UserProfileCard";
import SidebarItem from "./SidebarItem";
import PrimaryButton from "./PrimaryButton";

export default function SidebarMenu({
  open,
  onClose,
  userName = "Administrador",
  items = [],
  onLogout,
  onViewProfile,
}) {

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
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

  return (
    <>
      <div
        className={`inv-sidebar__overlay${open ? " inv-sidebar__overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside className={`inv-sidebar${open ? " inv-sidebar--open" : ""}`}>
        <div className="inv-sidebar__inner">

          <UserProfileCard
            name={userName}
            onViewProfile={onViewProfile}
          />

          <nav className="inv-sidebar__nav" aria-label="Menú principal">
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
              label="Cerrar Sesión"
              onClick={onLogout}
              className="w-100 inv-sidebar__logoutBtn"
            />
          </div>

        </div>
      </aside>
    </>
  );
}