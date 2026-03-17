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
    <div className="inv-history__filterWrap">
      <Form.Label className="inv-history__filterLabel mb-1">Tipo de evento</Form.Label>
      <Form.Select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="inv-history__filterSelect"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
    </div>
  );
}
