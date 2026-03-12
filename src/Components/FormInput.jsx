import { Form } from "react-bootstrap";

export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
  return (
    <Form.Group className="mb-3">
      <Form.Label className="inv-register__label">{label}</Form.Label>
      <Form.Control
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="inv-register__input"
      />
    </Form.Group>
  );
}

