import UserActions from "./UserActions";

export default function UserRow({ usuario }) {
  return (
    <tr>
      <td>{usuario.id_usuario}</td>
      <td>{usuario.nombre_completo}</td>
      <td className="text-capitalize">{usuario.rol}</td>
      <td>{usuario.departamento}</td>
      <td>
        <UserActions />
      </td>
    </tr>
  );
}

