import { Card, Row, Col } from "react-bootstrap";
import AssetInfoField from "./AssetInfoField";
import QRSection from "./QRSection";
import ActionButtons from "./ActionButtons";
import "../Style/bienes-registrados.css";

function formatCurrency(value) {
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(number);
}


export default function AssetDetailCard({ activo }) {
  if (!activo) return null;

  const ubicacion = activo.ubicacion ?? {};
  const producto = activo.producto ?? {};
  const ubicacionStr = [ubicacion.campus, ubicacion.edificio, ubicacion.aula]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="inv-asset-detail-card shadow-sm border-0">
      <Card.Header className="inv-asset-detail-card__header">
        <span className="inv-asset-card__headerLabel">Etq. bien:</span>{" "}
        <span className="inv-asset-card__headerValue">
          {activo.codigo_interno}
        </span>
      </Card.Header>

      <Card.Body className="inv-asset-detail-card__body">
        <Row>
          <Col xs={12} md={6} className="inv-asset-detail-card__col">
            <AssetInfoField label="Número de serie:" value={activo.numero_serie} />
            <AssetInfoField
              label="Tipo de activo:"
              value={producto.tipo_activo ?? activo.tipo_activo}
            />
            <AssetInfoField label="Ubicación:" value={ubicacionStr || undefined} />
            <AssetInfoField label="Descripción:" value={activo.descripcion} stack />
          </Col>
          <Col xs={12} md={6} className="inv-asset-detail-card__col">
            <AssetInfoField label="Propietario:" value={activo.propietario} />
            <AssetInfoField label="Estado:" value={activo.estatus} />
            <AssetInfoField label="Costo:" value={formatCurrency(activo.costo)} />
            <AssetInfoField label="Fecha de alta:" value={activo.fecha_alta} />
          </Col>
        </Row>

        <QRSection activo={activo} />
        <ActionButtons />
      </Card.Body>
    </Card>
  );
}
