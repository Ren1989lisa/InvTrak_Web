import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Form, Row } from "react-bootstrap";
import PrimaryButton from "../../Components/PrimaryButton";
import LocationTable from "../../Components/LocationTable";
import PaginationComponent from "../../Components/PaginationComponent";

export default function LocationTabContent({
  successMessage,
  errorMessage,
  locationSearch,
  setLocationSearch,
  campusFilter,
  setCampusFilter,
  campusOptions,
  filteredLocations,
  onAddClick,
  onEdit,
  onDelete,
  isLoading = false,
}) {
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [locationSearch, campusFilter, filteredLocations.length]);

  const totalPages = Math.max(1, Math.ceil(filteredLocations.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLocations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLocations, currentPage]);

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
          Cargando ubicaciones...
        </Alert>
      ) : null}

      <Row className="align-items-center g-2 mt-2 inv-catalog-actions">
        <Col xs={12} md="auto">
          <PrimaryButton
            variant="primary"
            label="+ Agregar ubicación"
            className="inv-catalog-actions__addBtn"
            onClick={onAddClick}
          />
        </Col>

        <Col>
          <Form.Control
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="Ingrese nombre del edificio, aula o laboratorio..."
            className="inv-search inv-catalog-input"
          />
        </Col>

        <Col xs={12} md="auto" className="d-flex align-items-center gap-2">
          <span className="inv-catalog-actions__statusLabel">Campus:</span>
          <Form.Select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="inv-catalog-select"
          >
            <option value="todo">Todo</option>
            {campusOptions.map((campus) => (
              <option key={campus} value={campus.toLowerCase()}>
                {campus}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <div className="mt-3">
        <LocationTable
          rows={paginatedRows}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <PaginationComponent
          currentPage={currentPage}
          totalItems={filteredLocations.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
