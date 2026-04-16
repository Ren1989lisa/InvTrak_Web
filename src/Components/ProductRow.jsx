import StatusBadge from "./StatusBadge";

function PencilIcon() {
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
        d="M15.232 5.232a2.5 2.5 0 1 1 3.536 3.536L9.2 18.336l-4.2.664.664-4.2 9.568-9.568Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
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
        d="M4 7h16m-2 0-.8 11.2A2 2 0 0 1 15.2 20H8.8a2 2 0 0 1-1.99-1.8L6 7m3 0V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductRow({ row, onEdit, onDelete }) {
  return (
    <tr>
      <td>{row.nombre}</td>
      <td>{row.marca}</td>
      <td>{row.modelo}</td>
      <td>
        <StatusBadge status={row.estatus} />
      </td>
      <td>
        <div className="inv-product-row__actions">
          <button
            type="button"
            className="inv-action-icon-btn"
            aria-label={`Editar producto ${row.nombre}`}
            title="Editar"
            onClick={() => onEdit?.(row)}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className="inv-action-icon-btn"
            aria-label={`Eliminar producto ${row.nombre}`}
            title="Eliminar"
            onClick={() => onDelete?.(row)}
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}
