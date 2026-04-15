import { FaEdit, FaTrash } from "react-icons/fa";

export default function UserActions({ onEdit, onDelete, canEdit = true }) {
  const handleEdit = (e) => {
    e.stopPropagation();
    if (!canEdit) return;
    onEdit?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div className="inv-user-actions">
      {canEdit ? (
        <button
          type="button"
          className="inv-user-actions__btn"
          aria-label="Editar usuario"
          onClick={handleEdit}
        >
          <FaEdit />
        </button>
      ) : null}
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

