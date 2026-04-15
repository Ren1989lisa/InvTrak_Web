import { Card, Table } from "react-bootstrap";
import UserRow from "./UserRow";

export default function UsersTable({
  usuarios = [],
  onUserSelect,
  onUserEdit,
  onUserDelete,
  canEdit = true,
}) {
  return (
    <Card className="inv-users-card shadow-sm border-0">
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0 inv-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Departamento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <UserRow
                key={usuario.id_usuario}
                usuario={usuario}
                onSelect={onUserSelect}
                onEdit={onUserEdit}
                onDelete={onUserDelete}
                canEdit={canEdit}
              />
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

