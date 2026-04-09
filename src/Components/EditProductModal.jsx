import { useEffect, useState } from "react";
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

export default function EditProductModal({ show, product, onClose, onSave, onDelete }) {
  const [estatus, setEstatus] = useState("Activo");

  useEffect(() => {
    if (!show || !product) return;
    setEstatus(product.estatus ?? "Activo");
  }, [show, product]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!product) return;

    onSave?.({
      id_producto: product.id_producto,
      estatus,
    });
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-edit-product-modal">
      <Modal.Header closeButton className="inv-edit-product-modal__header">
        <Modal.Title>Editar producto</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSave}>
        <Modal.Body className="inv-edit-product-modal__body">
          <Form.Group className="mb-3">
            <Form.Label className="inv-edit-label">
              Nombre <LockIcon />
            </Form.Label>
            <Form.Control
              value={product?.nombre ?? ""}
              disabled
              className="inv-catalog-input"
              readOnly
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-edit-label">
              Marca <LockIcon />
            </Form.Label>
            <Form.Control
              value={product?.marca ?? ""}
              disabled
              className="inv-catalog-input"
              readOnly
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-edit-label">
              Modelo <LockIcon />
            </Form.Label>
            <Form.Control
              value={product?.modelo ?? ""}
              disabled
              className="inv-catalog-input"
              readOnly
            />
          </Form.Group>

          <div className="inv-edit-status">
            <span className="inv-edit-label inv-edit-status__title">Estado</span>
            <Form.Check
              type="switch"
              id="edit-product-status"
              label={estatus === "Activo" ? "Activo" : "Inactivo"}
              checked={estatus === "Activo"}
              onChange={(e) => setEstatus(e.target.checked ? "Activo" : "Inactivo")}
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="inv-edit-product-modal__footer">
          <PrimaryButton
            variant="danger"
            label="Eliminar"
            className="inv-catalog-btn inv-catalog-btn--delete"
            onClick={() => onDelete?.(product?.id_producto)}
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
