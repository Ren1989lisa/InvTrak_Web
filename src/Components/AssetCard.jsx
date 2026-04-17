import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import { getEstadoDisplay } from "../config/estatusActivo";
import { formatCurrency, formatDate } from "../utils/format";
import "../Style/bienes-registrados.css";

export default function AssetCard({ activo, canEdit = false, onEdit = null }) {
  const navigate = useNavigate();
  const ubicacionStr = activo?.ubicacion?.completa ??
    [activo?.ubicacion?.campus, activo?.ubicacion?.edificio, activo?.ubicacion?.aula]
      .filter(Boolean)
      .join(" ");

  const productoStr = activo?.producto?.completo ??
    activo?.producto?.tipo_activo ??
    activo?.tipo_activo ??
    "";
  const fechaAsignacion = activo?.fecha_asignacion ?? activo?.fechaAsignacion ?? null;
  const fechaDisplay = fechaAsignacion || activo?.fecha_alta || "";
  const fechaLabel = fechaAsignacion ? "Fecha de asignacion:" : "Fecha de alta:";

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
          {activo?.etiqueta_bien}
        </span>
      </Card.Header>

      <Card.Body className="inv-asset-card__body">
        <div className="inv-field">
          <span className="inv-field__label">Producto:</span>
          <span className="inv-field__value">
            {productoStr}
          </span>
        </div>

        <div className="inv-field inv-field--stack">
          <span className="inv-field__label">Descripción:</span>
          <span className="inv-field__value">{activo?.descripcion}</span>
        </div>

        <div className="inv-field">
          <span className="inv-field__label">{fechaLabel}</span>
          <span className="inv-field__value">{formatDate(fechaDisplay)}</span>
        </div>

        <div className="inv-field inv-field--stack">
          <span className="inv-field__label">Ubicación:</span>
          <span className="inv-field__value">
            {ubicacionStr}
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

        {canEdit ? (
          <div className="inv-asset-card__actions">
            <button
              type="button"
              className="inv-asset-card__edit-btn"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onEdit?.(activo);
              }}
            >
              Editar
            </button>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
