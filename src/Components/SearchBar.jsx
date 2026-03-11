import { Button, Col, Form, Row } from "react-bootstrap";

export default function SearchBar({
  value,
  onChange,
  onImport,
  onFilters,
  placeholder = "Buscar...",
}) {
  return (
    <Row className="align-items-center g-2 inv-controls">
      <Col xs={12} md>
        <Form.Control
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="inv-search"
        />
      </Col>

      <Col xs="auto">
        <Button
          type="button"
          variant="light"
          className="inv-btn inv-btn--secondary"
          onClick={onImport}
        >
          Importar en excel
        </Button>
      </Col>

      <Col xs="auto">
        <Button
          type="button"
          variant="light"
          className="inv-btn inv-btn--secondary"
          onClick={onFilters}
        >
          Filtros
        </Button>
      </Col>
    </Row>
  );
}
