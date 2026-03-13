export default function StatusBadge({ status }) {
  const normalized = (status ?? "").toString().toLowerCase();
  const isActive = normalized === "activo";

  return (
    <span
      className={`inv-status-badge ${
        isActive ? "inv-status-badge--active" : "inv-status-badge--inactive"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}
