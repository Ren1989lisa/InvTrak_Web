import UserActions from "./UserActions";

export default function UserRow({ usuario, onSelect, onEdit, onDelete, canEdit = true }) {
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
      <td>{usuario.nombre ?? usuario.nombre_completo}</td>
      <td className="text-capitalize">{usuario.rol}</td>
      <td>{usuario.area ?? usuario.departamento}</td>
      <td>
        <UserActions 
          canEdit={canEdit}
          onEdit={() => onEdit?.(usuario)} 
          onDelete={() => onDelete?.(usuario)}
        />
      </td>
    </tr>
  );
}

