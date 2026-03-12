import { FaEdit, FaTrash } from "react-icons/fa";

export default function UserActions({ onEdit, onDelete }) {
  return (
    <div className="inv-user-actions">
      <button
        type="button"
        className="inv-user-actions__btn"
        aria-label="Editar usuario"
        onClick={() => onEdit?.()}
      >
        <FaEdit />
      </button>
      <button
        type="button"
        className="inv-user-actions__btn"
        aria-label="Eliminar usuario"
        onClick={() => onDelete?.()}
      >
        <FaTrash />
      </button>
    </div>
  );
}

