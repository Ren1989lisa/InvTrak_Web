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
  error,
  isInvalid,
  feedback,
  as,
  rows,
  list,
  className,
  leftIcon,
  ...rest
}) {
  const hasError = error ?? feedback ?? isInvalid;
  const errorMessage = error ?? feedback;

  const inputClassName = `inv-register__input${
    disabled ? " inv-register__input--disabledWithIcon" : ""
  }${className ? ` ${className}` : ""}`.trim();

  return (
    <Form.Group className="mb-3">
      <Form.Label className="inv-register__label">{label}</Form.Label>
      <div className="position-relative">
        {leftIcon ? (
          <div className="d-flex align-items-center" style={{ position: "relative" }}>
            <span
              className="position-absolute start-0 translate-middle-y ms-3 text-secondary"
              style={{ top: "50%", zIndex: 1, pointerEvents: "none" }}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
            <Form.Control
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              isInvalid={!!hasError}
              as={as}
              rows={rows}
              list={list}
              className={inputClassName}
              style={leftIcon ? { paddingLeft: "2.25rem" } : undefined}
              {...rest}
            />
          </div>
        ) : (
          <Form.Control
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            isInvalid={!!hasError}
            as={as}
            rows={rows}
            list={list}
            className={inputClassName}
            {...rest}
          />
        )}
        {disabled && !leftIcon ? (
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

