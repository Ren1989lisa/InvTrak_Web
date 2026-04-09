import { Form, Modal } from "react-bootstrap";
import PrimaryButton from "./PrimaryButton";

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 10V7a5 5 0 1 1 10 0v3m-9 0h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EditLocationModal({ show, location, onClose, onSave, onDelete }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location) return;

    onSave?.({
      id_ubicacion: location.id_ubicacion,
    });
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-edit-location-modal">
      <Modal.Header closeButton className="inv-edit-product-modal__header">
        <Modal.Title>Editar Ubicación</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="inv-edit-product-modal__body">
          <Form.Group className="mb-3">
            <Form.Label className="inv-edit-label">
              Campus <LockIcon />
            </Form.Label>
            <Form.Control value={location?.campus ?? ""} disabled readOnly className="inv-catalog-input" />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-edit-label">
              Edificio <LockIcon />
            </Form.Label>
            <Form.Control
              value={location?.edificio ?? ""}
              disabled
              readOnly
              className="inv-catalog-input"
            />
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label className="inv-edit-label">
              Aula/Laboratorio <LockIcon />
            </Form.Label>
            <Form.Control value={location?.aula ?? ""} disabled readOnly className="inv-catalog-input" />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="inv-edit-product-modal__footer">
          <PrimaryButton
            variant="danger"
            label="Eliminar"
            className="inv-catalog-btn inv-catalog-btn--delete"
            onClick={() => onDelete?.(location?.id_ubicacion)}
          />
          <PrimaryButton
            variant="light"
            label="Cancelar"
            className="inv-catalog-btn inv-catalog-btn--cancel"
            onClick={onClose}
          />
          <PrimaryButton
            type="submit"
            variant="primary"
            label="Editar"
            className="inv-catalog-btn inv-catalog-btn--save"
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
