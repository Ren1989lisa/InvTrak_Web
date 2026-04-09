import { Modal, Button } from "react-bootstrap";

export default function DeleteConfirmModal({
  show,
  onHide,
  onConfirm,
  userName,
  isDeleting = false,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>¿Eliminar usuario?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          ¿Estás seguro de eliminar a <strong>{userName}</strong>?
        </p>
        <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.9rem" }}>
          Esta acción no se puede deshacer.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
