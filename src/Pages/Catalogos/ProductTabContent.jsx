import { Alert, Col, Form, Row } from "react-bootstrap";
import PrimaryButton from "../../Components/PrimaryButton";
import ProductTable from "../../Components/ProductTable";
import PaginationComponent from "../../Components/PaginationComponent";

export default function ProductTabContent({
  successMessage,
  errorMessage,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  filteredRows,
  onAddClick,
  onEdit,
  onDelete,
}) {
  return (
    <>
      {successMessage ? (
        <Alert variant="success" className="mt-3 mb-2">
          {successMessage}
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="danger" className="mt-3 mb-2">
          {errorMessage}
        </Alert>
      ) : null}

      <Row className="align-items-center g-2 mt-2 inv-catalog-actions">
        <Col xs={12} md="auto">
          <PrimaryButton
            variant="primary"
            label="+ Agregar producto"
            className="inv-catalog-actions__addBtn"
            onClick={onAddClick}
          />
        </Col>

        <Col>
          <Form.Control
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ingrese nombre del producto, marca o modelo"
            className="inv-search inv-catalog-input"
          />
        </Col>

        <Col xs={12} md="auto" className="d-flex align-items-center gap-2">
          <span className="inv-catalog-actions__statusLabel">Estatus:</span>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="inv-catalog-select"
          >
            <option value="todo">Todo</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </Form.Select>
        </Col>
      </Row>

      <div className="mt-3">
        <ProductTable
          rows={filteredRows}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <PaginationComponent />
      </div>
    </>
  );
}
