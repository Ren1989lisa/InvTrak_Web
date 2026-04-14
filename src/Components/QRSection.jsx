import ActivoQR from "./ActivoQR";

function resolveActivoId(activo) {
  return activo?.id_activo ?? activo?.id ?? activo?.idActivo ?? "";
}

export default function QRSection({ activo }) {
  if (!activo) return null;

  return (
    <div className="inv-qr-section">
      <ActivoQR activoId={resolveActivoId(activo)} showFrame={false} />
    </div>
  );
}
