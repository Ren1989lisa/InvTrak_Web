import { formatCurrency } from "../utils/format";

export default function AssetReportSelectableCard({ asset, reporte, selected = false, onSelect }) {
  const producto = asset?.producto ?? {};
  const ubicacion = asset?.ubicacion ?? {};
  const tipo = producto?.tipo_activo ?? asset?.tipo_activo ?? "-";
  const descripcion = producto?.modelo ?? asset?.descripcion ?? "-";
  const ubicacionTexto = [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={`inv-assign-asset-card${selected ? " inv-assign-asset-card--selected" : ""}`}
      onClick={() => onSelect?.({ asset, reporte })}
    >
      <div className="inv-assign-asset-card__top">
        <span className="inv-assign-asset-card__tag">
          Etq. bien: {asset?.etiqueta_bien || "N/A"} - NO:{asset?.id_activo ?? "-"}
        </span>
      </div>

      <div className="inv-assign-asset-card__body">
        <p>
          <strong>Tipo de activo:</strong> {tipo}
        </p>
        <p>
          <strong>Descripción:</strong> {descripcion}
        </p>
        <p>
          <strong>Ubicación:</strong> {ubicacionTexto || "-"}
        </p>
        <div className="inv-assign-asset-card__footer">
          <span className="inv-assign-asset-card__cost">{formatCurrency(asset?.costo)}</span>
          <span className="inv-assign-asset-card__badge inv-assign-asset-card__badge--reportado">
            Reportado
          </span>
        </div>
      </div>
    </button>
  );
}
