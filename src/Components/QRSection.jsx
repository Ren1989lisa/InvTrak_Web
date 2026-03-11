import { QRCodeSVG } from "qrcode.react";

//Seccion que muestra el código QR del activo (datos en JSON)
export default function QRSection({ activo }) {
  if (!activo) return null;

  const value = JSON.stringify(activo);

  return (
    <div className="inv-qr-section">
      <QRCodeSVG value={value} size={200} level="M" className="inv-qr-section__code" />
    </div>
  );
}
