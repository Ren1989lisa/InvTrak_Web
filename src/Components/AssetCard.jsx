import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import { getEstadoDisplay } from "../config/estatusActivo";
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

export default function AssetCard({ activo }) {
  const navigate = useNavigate();
  const ubicacion = activo?.ubicacion ?? {};
  const producto = activo?.producto ?? {};

  const handleClick = () => {
    navigate(`/activo/${activo?.id_activo}`);
  };

  return (
    <Card
      className="inv-asset-card shadow-sm border-0 h-100"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Card.Header className="inv-asset-card__header">
        <span className="inv-asset-card__headerLabel">Etq. bien:</span>{" "}
        <span className="inv-asset-card__headerValue">
          {activo?.codigo_interno}
        </span>
      </Card.Header>

      <Card.Body className="inv-asset-card__body">
        <div className="inv-field">
          <span className="inv-field__label">Tipo de activo:</span>
          <span className="inv-field__value">
            {producto?.tipo_activo ?? activo?.tipo_activo}
          </span>
        </div>

        <div className="inv-field inv-field--stack">
          <span className="inv-field__label">Descripción:</span>
          <span className="inv-field__value">{activo?.descripcion}</span>
        </div>

        <div className="inv-field">
          <span className="inv-field__label">Fecha de alta:</span>
          <span className="inv-field__value">{activo?.fecha_alta}</span>
        </div>

        <div className="inv-field inv-field--stack">
          <span className="inv-field__label">Ubicación:</span>
          <span className="inv-field__value">
            {ubicacion?.campus} {ubicacion?.edificio} {ubicacion?.aula}
          </span>
        </div>

        <div className="inv-field inv-field__split">
          <div className="inv-field__col">
            <span className="inv-field__label">Costo:</span>
            <span className="inv-field__value">
              {formatCurrency(activo?.costo)}
            </span>
          </div>
          <div className="inv-field__col">
            <span className="inv-field__label">Estado:</span>
            <span className="inv-field__value">{getEstadoDisplay(activo)}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
