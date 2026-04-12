import { Modal, Button } from "react-bootstrap";

function resumenActivo(activo) {
  const producto =
    activo?.producto?.completo ??
    activo?.producto?.tipo_activo ??
    activo?.tipo_activo ??
    "";
  const etiqueta = activo?.etiqueta_bien ?? "";
  if (etiqueta && producto) return `${etiqueta} · ${producto}`;
  return etiqueta || producto || "este bien";
}

export default function DeleteActivoModal({
  show,
  onHide,
  onConfirm,
  activo,
  isDeleting = false,
}) {
  const linea = resumenActivo(activo);

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" className="inv-delete-activo-modal">
      <Modal.Header closeButton className="inv-delete-activo-modal__header border-0 pb-0">
        <Modal.Title as="h5" className="d-flex align-items-center gap-2">
          <span className="inv-delete-activo-modal__icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9zm3 2v8h2v-8H9zm4 0v8h2v-8h-2z"
                fill="currentColor"
              />
            </svg>
          </span>
          Eliminar bien del inventario
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <p className="mb-2">
          Vas a eliminar permanentemente{" "}
          <strong className="text-dark">{linea}</strong>.
        </p>
        <p className="text-muted mb-0 small">
          Esta acción no se puede deshacer. Asegúrate de que el código de etiqueta coincida con el bien
          físico antes de confirmar.
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button variant="light" className="inv-delete-activo-modal__cancel" onClick={onHide} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting} className="px-4">
          {isDeleting ? "Eliminando…" : "Eliminar definitivamente"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
