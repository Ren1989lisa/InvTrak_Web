function QrIcon() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 3h7v7H3V3Zm0 11h7v7H3v-7Zm11-11h7v7h-7V3Zm3 11h1v1h-1v-1Zm-3 0h1v3h-1v-3Zm6 2h1v1h-1v-1Zm-3 2h4v3h-7v-4h3v1Zm-3-3h2v1h-2v-1Zm4-1h3v1h-3v-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SelectedAssetCard({ asset }) {
  if (!asset) return null;
  const producto = asset?.producto ?? {};
  const tipo = producto?.tipo_activo ?? asset?.tipo_activo ?? "-";
  const ubicacion = asset?.ubicacion ?? {};
  const ubicacionTexto = [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="inv-selected-asset">
      <div className="inv-selected-asset__qr">
        <QrIcon />
      </div>
      <div className="inv-selected-asset__info">
        <p>
          <strong>Etq. bien:</strong> {asset?.etiqueta_bien || "-"}
        </p>
        <p>
          <strong>Tipo de activo:</strong> {tipo}
        </p>
        <p>{ubicacionTexto || "-"}</p>
      </div>
    </div>
  );
}
