import { useState } from "react";
import { Offcanvas, Button, Form, Row, Col } from "react-bootstrap";

export default function FiltersModal({
  show,
  onHide,
  onApply,
  onClear,
  ubicaciones = [],
  tipos = [],
  estados = [],
}) {
  const [etiqueta, setEtiqueta] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  function handleApply() {
    const filters = {
      etiqueta: etiqueta.trim(),
      tipo,
      estado,
      ubicacion,
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
      precioMin: precioMin ? Number(precioMin) : null,
      precioMax: precioMax ? Number(precioMax) : null,
    };
    onApply?.(filters);
    onHide?.();
  }

  function handleClear() {
    setEtiqueta("");
    setTipo("");
    setEstado("");
    setUbicacion("");
    setFechaDesde("");
    setFechaHasta("");
    setPrecioMin("");
    setPrecioMax("");
    onClear?.();
    onHide?.();
  }

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" className="filters-panel">
      <Offcanvas.Header closeButton className="filters-panel__header">
        <Offcanvas.Title className="filters-panel__title">Filtros</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form>
          <div className="filters-section">
            <h5 className="filters-section__label">Fecha</h5>
            <div className="filters-section__content p-2">
              <Row>
                <Col>
                  <Form.Control type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </Col>
                <Col>
                  <Form.Control type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </Col>
              </Row>
            </div>
          </div>

          <hr />

          <div className="filters-section">
            <h5 className="filters-section__label">Precio</h5>
            <div className="filters-section__content">
              <Form.Label>Min</Form.Label>
              <Form.Control type="number" placeholder="Ingrese la cantidad" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} />
              <Form.Label className="mt-2">Max</Form.Label>
              <Form.Control type="number" placeholder="Ingrese la cantidad" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
            </div>
          </div>

          <hr />

          <div className="filters-section">
            <h5 className="filters-section__label">Ubicación</h5>
            <div className="filters-section__content">
              <Form.Select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}>
                <option value="">Seleccione la ubicación</option>
                {ubicaciones.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Form.Select>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4 justify-content-start">
            <Button variant="danger" onClick={handleClear} className="btn-clear">Borrar selección</Button>
            <Button variant="primary" onClick={handleApply} className="btn-apply">Aplicar</Button>
          </div>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
