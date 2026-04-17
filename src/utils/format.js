export function formatCurrency(value) {
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(number);
}

export function formatDate(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }
  return String(value);
}
