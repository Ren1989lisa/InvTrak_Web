import { FaEdit, FaTrash } from "react-icons/fa";

export default function UserActions({ onEdit, onDelete }) {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className="inv-user-actions">
      <button
        type="button"
        className="inv-user-actions__btn"
        aria-label="Editar usuario"
        onClick={handleEdit}
      >
        <FaEdit />
      </button>
      <button
        type="button"
        className="inv-user-actions__btn"
        aria-label="Eliminar usuario"
        onClick={handleDelete}
      >
        <FaTrash />
      </button>
    </div>
  );
}

