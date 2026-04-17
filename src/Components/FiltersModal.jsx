import { useMemo, useState } from "react";
import { Alert, Button, Col, Form, Modal, Offcanvas, Row } from "react-bootstrap";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function splitLocationText(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!text) {
    return { campus: "", edificio: "", aula: "" };
  }

  const parts = text.split(" ");
  if (parts.length >= 3) {
    return {
      campus: parts.slice(0, -2).join(" "),
      edificio: parts[parts.length - 2],
      aula: parts[parts.length - 1],
    };
  }

  if (parts.length === 2) {
    return {
      campus: parts[0],
      edificio: parts[1],
      aula: "",
    };
  }

  return {
    campus: parts[0],
    edificio: "",
    aula: "",
  };
}

function normalizeLocationOption(raw, index) {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const text = raw.trim().replace(/\s+/g, " ");
    if (!text) return null;
    const split = splitLocationText(text);
    return {
      key: `loc-${index}`,
      campus: split.campus,
      edificio: split.edificio,
      aula: split.aula,
      completa: text,
    };
  }

  const rawCampus = String(raw?.campus ?? "").trim();
  const rawEdificio = String(raw?.edificio ?? "").trim();
  const rawAula = String(raw?.aula ?? "").trim();
  const completa = String(
    raw?.completa ??
      raw?.displayText ??
      raw?.ubicacion ??
      [rawCampus, rawEdificio, rawAula].filter(Boolean).join(" ")
  )
    .trim()
    .replace(/\s+/g, " ");

  if (!completa) return null;

  const split = splitLocationText(completa);
  const campus = rawCampus || split.campus;
  const edificio = rawEdificio || split.edificio;
  const aula = rawAula || split.aula;

  return {
    key: String(raw?.id ?? `loc-${index}`),
    campus,
    edificio,
    aula,
    completa,
  };
}

export default function FiltersModal({
  show,
  onHide,
  onApply,
  onClear,
  ubicaciones = [],
  estatusOptions = [],
  productoOptions = [],
}) {
  const [ubicacion, setUbicacion] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [estatus, setEstatus] = useState("");
  const [producto, setProducto] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedEdificio, setSelectedEdificio] = useState("");
  const [selectedAula, setSelectedAula] = useState("");
  const [locationError, setLocationError] = useState("");

  const locationOptions = useMemo(() => {
    const unique = new Map();

    (Array.isArray(ubicaciones) ? ubicaciones : []).forEach((item, index) => {
      const option = normalizeLocationOption(item, index);
      if (!option) return;

      const key = normalizeText(option.completa);
      if (unique.has(key)) return;
      unique.set(key, option);
    });

    return Array.from(unique.values());
  }, [ubicaciones]);

  const campusOptions = useMemo(() => {
    const unique = new Map();
    locationOptions.forEach((item) => {
      if (!item.campus) return;
      const key = normalizeText(item.campus);
      if (!unique.has(key)) unique.set(key, item.campus);
    });
    return Array.from(unique.values());
  }, [locationOptions]);

  const edificioOptions = useMemo(() => {
    const campusKey = normalizeText(selectedCampus);
    const unique = new Map();

    locationOptions
      .filter((item) => normalizeText(item.campus) === campusKey)
      .forEach((item) => {
        if (!item.edificio) return;
        const key = normalizeText(item.edificio);
        if (!unique.has(key)) unique.set(key, item.edificio);
      });

    return Array.from(unique.values());
  }, [locationOptions, selectedCampus]);

  const aulaOptions = useMemo(() => {
    const campusKey = normalizeText(selectedCampus);
    const edificioKey = normalizeText(selectedEdificio);
    const unique = new Map();

    locationOptions
      .filter(
        (item) =>
          normalizeText(item.campus) === campusKey &&
          normalizeText(item.edificio) === edificioKey
      )
      .forEach((item) => {
        if (!item.aula) return;
        const key = normalizeText(item.aula);
        if (!unique.has(key)) unique.set(key, item.aula);
      });

    return Array.from(unique.values());
  }, [locationOptions, selectedCampus, selectedEdificio]);

  function handleApply() {
    const filters = {
      ubicacion,
      estatus: estatus || null,
      producto: producto || null,
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
      precioMin: precioMin ? Number(precioMin) : null,
      precioMax: precioMax ? Number(precioMax) : null,
    };
    onApply?.(filters);
    onHide?.();
  }

  function handleClear() {
    setUbicacion("");
    setEstatus("");
    setProducto("");
    setFechaDesde("");
    setFechaHasta("");
    setPrecioMin("");
    setPrecioMax("");
    setSelectedCampus("");
    setSelectedEdificio("");
    setSelectedAula("");
    setLocationError("");
    onClear?.();
    onHide?.();
  }

  function handleOpenLocationModal() {
    setLocationError("");

    const selectedOption = locationOptions.find(
      (item) => normalizeText(item.completa) === normalizeText(ubicacion)
    );

    setSelectedCampus(selectedOption?.campus ?? "");
    setSelectedEdificio(selectedOption?.edificio ?? "");
    setSelectedAula(selectedOption?.aula ?? "");
    setShowLocationModal(true);
  }

  function handleSaveLocation() {
    setLocationError("");

    if (!locationOptions.length) {
      setLocationError("No hay ubicaciones disponibles.");
      return;
    }

    if (!selectedCampus || !selectedEdificio || !selectedAula) {
      setLocationError("Debes seleccionar campus, edificio y aula/laboratorio.");
      return;
    }

    const selectedOption = locationOptions.find(
      (item) =>
        normalizeText(item.campus) === normalizeText(selectedCampus) &&
        normalizeText(item.edificio) === normalizeText(selectedEdificio) &&
        normalizeText(item.aula) === normalizeText(selectedAula)
    );

    const completeLocation =
      selectedOption?.completa ||
      [selectedCampus, selectedEdificio, selectedAula].filter(Boolean).join(" ");

    if (!completeLocation) {
      setLocationError("No fue posible guardar la ubicacion seleccionada.");
      return;
    }

    setUbicacion(completeLocation);
    setShowLocationModal(false);
  }

  return (
    <>
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
                    <Form.Control
                      type="date"
                      value={fechaDesde}
                      onChange={(event) => setFechaDesde(event.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="date"
                      value={fechaHasta}
                      onChange={(event) => setFechaHasta(event.target.value)}
                    />
                  </Col>
                </Row>
              </div>
            </div>

            <hr />

            <div className="filters-section">
              <h5 className="filters-section__label">Precio</h5>
              <div className="filters-section__content">
                <Form.Label>Minimo</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Ingrese la cantidad"
                  min="0"
                  value={precioMin}
                  onChange={(event) => {
                    const v = event.target.value;
                    if (v === "" || Number(v) >= 0) setPrecioMin(v);
                  }}
                />
                <Form.Label className="mt-2">Maximo</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Ingrese la cantidad"
                  min="0"
                  value={precioMax}
                  onChange={(event) => {
                    const v = event.target.value;
                    if (v === "" || Number(v) >= 0) setPrecioMax(v);
                  }}
                />
              </div>
            </div>

            <hr />

            {productoOptions.length > 0 ? (
              <>
                <div className="filters-section">
                  <h5 className="filters-section__label">Producto</h5>
                  <div className="filters-section__content">
                    <Form.Select
                      value={producto}
                      onChange={(event) => setProducto(event.target.value)}
                    >
                      <option value="">Todos los productos</option>
                      {productoOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                <hr />
              </>
            ) : null}

            {estatusOptions.length > 0 ? (
              <>
                <div className="filters-section">
                  <h5 className="filters-section__label">Estado</h5>
                  <div className="filters-section__content">
                    <Form.Select
                      value={estatus}
                      onChange={(event) => setEstatus(event.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      {estatusOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                <hr />
              </>
            ) : null}

            <div className="filters-section">
              <h5 className="filters-section__label">Ubicacion</h5>
              <div className="filters-section__content">
                <Button
                  type="button"
                  variant="light"
                  className="filters-location-picker"
                  onClick={handleOpenLocationModal}
                >
                  <span className="filters-location-picker__value">
                    {ubicacion || "Seleccione la ubicacion"}
                  </span>
                  <span className="filters-location-picker__icon">v</span>
                </Button>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4 justify-content-start">
              <Button variant="danger" onClick={handleClear} className="btn-clear">
                Borrar seleccion
              </Button>
              <Button variant="primary" onClick={handleApply} className="btn-apply">
                Aplicar
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal
        centered
        show={showLocationModal}
        onHide={() => setShowLocationModal(false)}
        dialogClassName="filters-location-modal"
      >
        <Modal.Header closeButton className="filters-location-modal__header">
          <Modal.Title>Ubicacion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="filters-location-modal__body">
          {locationError ? <Alert variant="danger">{locationError}</Alert> : null}

          <Form.Group className="mb-3">
            <Form.Label>Campus *</Form.Label>
            <Form.Select
              value={selectedCampus}
              onChange={(event) => {
                setSelectedCampus(event.target.value);
                setSelectedEdificio("");
                setSelectedAula("");
                setLocationError("");
              }}
            >
              <option value="">Ingrese el campus</option>
              {campusOptions.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Edificio *</Form.Label>
            <Form.Select
              value={selectedEdificio}
              onChange={(event) => {
                setSelectedEdificio(event.target.value);
                setSelectedAula("");
                setLocationError("");
              }}
              disabled={!selectedCampus}
            >
              <option value="">Ingrese el edificio</option>
              {edificioOptions.map((edificio) => (
                <option key={edificio} value={edificio}>
                  {edificio}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label>Aula/Laboratorio *</Form.Label>
            <Form.Select
              value={selectedAula}
              onChange={(event) => {
                setSelectedAula(event.target.value);
                setLocationError("");
              }}
              disabled={!selectedEdificio}
            >
              <option value="">Ingrese el aula o laboratorio</option>
              {aulaOptions.map((aula) => (
                <option key={aula} value={aula}>
                  {aula}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="filters-location-modal__footer">
          <Button variant="light" onClick={() => setShowLocationModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveLocation}>
            Guardar seleccion
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
