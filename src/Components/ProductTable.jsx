import { Card, Table } from "react-bootstrap";
import ProductRow from "./ProductRow";

export default function ProductTable({ rows, onEdit, onDelete }) {
  return (
    <Card className="inv-catalog-table-card shadow-sm border-0">
      <Card.Body className="p-0">
        <Table responsive hover className="mb-0 inv-catalog-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <ProductRow key={row.id_producto} row={row} onEdit={onEdit} onDelete={onDelete} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
