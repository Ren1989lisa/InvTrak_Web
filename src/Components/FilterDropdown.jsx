import { Dropdown } from "react-bootstrap";

export default function FilterDropdown({
  value = "todos",
  onSelect,
}) {
  const label = value === "todos" ? "Filtros" : `Rol: ${value}`;

  return (
    <Dropdown onSelect={(key) => onSelect?.(key)}>
      <Dropdown.Toggle
        variant="light"
        className="inv-btn inv-btn--secondary inv-users-filterBtn"
      >
        {label}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item eventKey="todos">Todos</Dropdown.Item>
        <Dropdown.Item eventKey="admin">Admin</Dropdown.Item>
        <Dropdown.Item eventKey="usuario">Usuario</Dropdown.Item>
        <Dropdown.Item eventKey="tecnico">Técnico</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

