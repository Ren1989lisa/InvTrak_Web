import { Form } from "react-bootstrap";
import { FaLock } from "react-icons/fa";

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  disabled = false,
  error,
  isInvalid,
  feedback,
  placeholder = "Seleccionar...",
  className,
}) {
  const hasError = error ?? feedback ?? isInvalid;
  const errorMessage = error ?? feedback;

  const selectClassName = `inv-register__input${
    disabled ? " inv-register__input--disabledWithIcon" : ""
  }${className ? ` ${className}` : ""}`.trim();

  return (
    <Form.Group className="mb-3">
      <Form.Label className="inv-register__label">{label}</Form.Label>
      <div className="position-relative">
        <Form.Select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          isInvalid={!!hasError}
          className={selectClassName}
        >
          <option value="">{placeholder}</option>
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
      {errorMessage ? (
        <Form.Control.Feedback type="invalid">{errorMessage}</Form.Control.Feedback>
      ) : null}
    </Form.Group>
  );
}

