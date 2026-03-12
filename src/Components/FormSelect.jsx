import { Form } from "react-bootstrap";
import { FaLock } from "react-icons/fa";

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  disabled = false,
}) {
  const selectClassName = `inv-register__input${
    disabled ? " inv-register__input--disabledWithIcon" : ""
  }`;

  return (
    <Form.Group className="mb-3">
      <Form.Label className="inv-register__label">{label}</Form.Label>
      <div className="position-relative">
        <Form.Select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={selectClassName}
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
        {disabled ? (
          <FaLock
            aria-hidden="true"
            className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
            style={{ pointerEvents: "none", fontSize: "0.85rem" }}
          />
        ) : null}
      </div>
    </Form.Group>
  );
}

