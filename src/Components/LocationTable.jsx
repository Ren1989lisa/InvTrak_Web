import { Card, Table } from "react-bootstrap";
import LocationRow from "./LocationRow";

export default function LocationTable({ rows, onEdit, onDelete }) {
  return (
    <Card className="inv-catalog-table-card shadow-sm border-0">
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0 inv-catalog-table">
          <thead>
            <tr>
              <th>Campus</th>
              <th>Edificio</th>
              <th>Aula/laboratorio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <LocationRow key={row.id_ubicacion} row={row} onEdit={onEdit} onDelete={onDelete} />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted">
                  No hay ubicaciones que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
