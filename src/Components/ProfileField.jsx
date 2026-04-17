function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  // Detecta fechas en formato ISO yyyy-MM-dd o yyyy-MM-ddTHH:mm...
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }
  return String(value);
}

export default function ProfileField({ label, value }) {
  const displayValue = formatFieldValue(value);

  return (
    <div className="inv-profile-field">
      <span className="inv-field__label">{label}</span>
      <span className="inv-field__value">{displayValue}</span>
    </div>
  );
}

