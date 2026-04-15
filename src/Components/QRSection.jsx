import { QRCodeCanvas } from "qrcode.react";

export default function QRSection({ activo }) {
  if (!activo) return null;

  const value = JSON.stringify(activo);

  return (
    <div className="inv-qr-section">
      <QRCodeCanvas value={value} size={200} level="M" className="inv-qr-section__code" />
    </div>
  );
}
