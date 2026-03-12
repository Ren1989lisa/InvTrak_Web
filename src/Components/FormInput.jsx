import { Form } from "react-bootstrap";
import { FaLock } from "react-icons/fa";

export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  const inputClassName = `inv-register__input${
    disabled ? " inv-register__input--disabledWithIcon" : ""
  }`;

  return (
    <Form.Group className="mb-3">
      <Form.Label className="inv-register__label">{label}</Form.Label>
      <div className="position-relative">
        <Form.Control
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
        />
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

