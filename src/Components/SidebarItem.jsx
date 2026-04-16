import { NavLink } from "react-router-dom";

function Icon({ name }) {
  const common = { className: "inv-sidebar-item__icon", viewBox: "0 0 24 24" };

  switch (name) {
    case "grid":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
          />
        </svg>
      );
    case "users":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          />
        </svg>
      );
    case "box":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M21 16V8c0-.4-.2-.77-.53-.95l-8-4a1.06 1.06 0 0 0-.94 0l-8 4A1.06 1.06 0 0 0 3 8v8c0 .4.2.77.53.95l8 4c.3.15.64.15.94 0l8-4c.33-.18.53-.55.53-.95zM12 5.2 17.8 8 12 10.8 6.2 8 12 5.2zM5 9.7l6 3V19l-6-3V9.7zm14 6.3-6 3v-6.3l6-3V16z"
          />
        </svg>
      );
    case "folder":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 4l2 2h8c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h6z"
          />
        </svg>
      );
    case "report":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 3h18v2H3V3zm2 4h14v14H5V7zm2 2v10h10V9H7zm2 2h6v2H9v-2zm0 3h6v2H9v-2z"
          />
        </svg>
      );
    case "clock":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 11h-5V6h2v5h3v2z"
          />
        </svg>
      );
    case "returns":
      return (
        <svg {...common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 6h12v2H4V6zm0 5h12v2H4v-2zm0 5h8v2H4v-2zm13 3-4-4h3V9h2v6h3l-4 4z"
          />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.25" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
  }
}

export default function SidebarItem({ icon, label, route, onClick }) {
  return (
    <NavLink
      to={route}
      className={({ isActive }) =>
        `inv-sidebar-item${isActive ? " inv-sidebar-item--active" : ""}`
      }
      onClick={onClick}
    >
      <Icon name={icon} />
      <span className="inv-sidebar-item__label">{label}</span>
    </NavLink>
  );
}
