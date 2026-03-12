import { Form } from "react-bootstrap";

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
}) {
  return (
    <Form.Group className="mb-3">
      <Form.Label className="inv-register__label">{label}</Form.Label>
      <Form.Select
        name={name}
        value={value}
        onChange={onChange}
        className="inv-register__input"
      >
        <option value="">Seleccionar...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
}

