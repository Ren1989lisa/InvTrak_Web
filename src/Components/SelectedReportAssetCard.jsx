function MonitorIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function SelectedReportAssetCard({ asset }) {
  if (!asset) return null;
  const producto = asset?.producto ?? {};
  const tipo = producto?.tipo_activo ?? asset?.tipo_activo ?? "-";
  const modelo = producto?.modelo ?? "-";
  const ubicacion = asset?.ubicacion ?? {};
  const ubicacionTexto = [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="inv-selected-asset inv-selected-asset--report">
      <div className="inv-selected-asset__qr inv-selected-asset__qr--monitor">
        <MonitorIcon />
      </div>
      <div className="inv-selected-asset__info">
        <p>
          <strong>Etq. bien:</strong> {asset?.codigo_interno || "-"} - NO:{asset?.id_activo ?? "-"}
        </p>
        <p>
          {tipo} {modelo}
        </p>
        <p>{ubicacionTexto || "-"}</p>
      </div>
    </div>
  );
}
