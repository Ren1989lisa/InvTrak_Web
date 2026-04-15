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
          rows={filteredLocations}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <PaginationComponent />
      </div>
    </>
  );
}
