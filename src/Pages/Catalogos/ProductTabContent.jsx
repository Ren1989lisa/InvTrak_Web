import { useEffect, useMemo, useState } from "react";
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
  isLoading = false,
}) {
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, filteredRows.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  return (
    <>
      {successMessage ? (
        <Alert variant="success" className="mt-3 mb-2" dismissible>
          {successMessage}
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="danger" className="mt-3 mb-2" dismissible>
          {errorMessage}
        </Alert>
      ) : null}

      {isLoading ? (
        <Alert variant="info" className="mt-3 mb-2">
          Cargando productos...
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
          rows={paginatedRows}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <PaginationComponent
          currentPage={currentPage}
          totalItems={filteredRows.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
