import { Form } from "react-bootstrap";

const OPTIONS = [
  { value: "todo", label: "Todo" },
  { value: "cambio_estatus", label: "Cambio de estatus" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "asignacion", label: "Asignación" },
  { value: "reporte", label: "Reporte" },
];

export default function HistoryFilter({ value = "todo", onChange }) {
  return (
    <Form.Select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="inv-history-filter-select"
      aria-label="Filtrar por tipo de evento"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Form.Select>
  );
}
