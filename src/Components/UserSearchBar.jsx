import { Form } from "react-bootstrap";

export default function UserSearchBar({ value, onChange, placeholder = "Buscar usuario..." }) {
  return (
    <div className="inv-assign-user-search">
      <Form.Control
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="inv-assign-input"
      />
    </div>
  );
}
