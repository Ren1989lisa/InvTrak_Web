import { useEffect, useMemo, useState } from "react";
import { Alert, Form, Modal } from "react-bootstrap";
import PrimaryButton from "./PrimaryButton";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

export default function AddLocationModal({ show, onClose, onSave, locations = [] }) {
  const [campus, setCampus] = useState("");
  const [edificio, setEdificio] = useState("");
  const [aula, setAula] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setCampus("");
    setEdificio("");
    setAula("");
    setDescripcion("");
    setError("");
  }, [show]);

  const campusOptions = useMemo(
    () => [...new Set(locations.map((item) => item.campus).filter(Boolean))],
    [locations]
  );

  const buildingOptions = useMemo(() => {
    const selectedCampus = normalize(campus);
    if (!selectedCampus) {
      return [...new Set(locations.map((item) => item.edificio).filter(Boolean))];
    }
    return [
      ...new Set(
        locations
          .filter((item) => normalize(item.campus) === selectedCampus)
          .map((item) => item.edificio)
          .filter(Boolean)
      ),
    ];
  }, [locations, campus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      campus: campus.trim(),
      edificio: edificio.trim(),
      aula: aula.trim(),
      descripcion: descripcion.trim(),
    };

    if (!payload.campus || !payload.edificio || !payload.aula) {
      setError("Campus, edificio y aula/laboratorio son obligatorios.");
      return;
    }

    onSave?.(payload);
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-add-location-modal">
      <Modal.Header closeButton className="inv-add-product-modal__header">
        <Modal.Title>Agregar Ubicación</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="inv-add-product-modal__body">
          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Form.Group className="mb-3">
            <Form.Label>Campus *</Form.Label>
            <Form.Control
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              list="catalog-campus-options"
              placeholder="Ingrese el campus"
              className="inv-catalog-input"
            />
            <datalist id="catalog-campus-options">
              {campusOptions.map((option) => (
                <option value={option} key={option} />
              ))}
            </datalist>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Edificio *</Form.Label>
            <Form.Control
              value={edificio}
              onChange={(e) => setEdificio(e.target.value)}
              list="catalog-building-options"
              placeholder="Ingrese el edificio"
              className="inv-catalog-input"
            />
            <datalist id="catalog-building-options">
              {buildingOptions.map((option) => (
                <option value={option} key={option} />
              ))}
            </datalist>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Aula/Laboratorio *</Form.Label>
            <Form.Control
              value={aula}
              onChange={(e) => setAula(e.target.value)}
              placeholder="Ingrese el aula o laboratorio"
              className="inv-catalog-input"
            />
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese los detalles y características"
              className="inv-catalog-input inv-catalog-textarea"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="inv-add-product-modal__footer">
          <PrimaryButton
            variant="light"
            label="Cancelar"
            className="inv-catalog-btn inv-catalog-btn--cancel"
            onClick={onClose}
          />
          <PrimaryButton
            type="submit"
            variant="primary"
            label="Guardar"
            className="inv-catalog-btn inv-catalog-btn--save"
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
