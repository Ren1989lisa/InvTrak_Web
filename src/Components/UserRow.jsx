import UserActions from "./UserActions";

export default function UserRow({ usuario, onSelect, onEdit }) {
  const handleSelect = () => {
    onSelect?.(usuario);
  };

  return (
    <tr
      className="inv-users-table__rowClickable"
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
    >
      <td>{usuario.id_usuario}</td>
      <td>{usuario.nombre_completo}</td>
      <td className="text-capitalize">{usuario.rol}</td>
      <td>{usuario.departamento}</td>
      <td>
        <UserActions onEdit={() => onEdit?.(usuario)} />
      </td>
    </tr>
  );
}

