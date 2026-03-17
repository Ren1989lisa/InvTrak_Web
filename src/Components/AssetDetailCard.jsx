import { useRef, useCallback } from "react";
import { Card, Row, Col } from "react-bootstrap";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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

function getOwnerDisplay(activo) {
  const ownerName = (activo?.propietario ?? "").toString().trim();
  const assignmentState = (activo?.estado_asignacion ?? "").toString().trim().toLowerCase();
  const assetStatus = (activo?.estatus ?? "").toString().trim().toLowerCase();

  if (!ownerName || assignmentState === "pendiente de asignacion") {
    return "pendiente de asignacion";
  }

  if (assignmentState === "pendiente de confirmacion") {
    return "pendiente de confirmacion";
  }

  if (assignmentState === "resguardado" || assetStatus === "resguardado") {
    return ownerName;
  }

  // Si hay propietario pero no existe estado explícito, asumimos pendiente de confirmación.
  return "pendiente de confirmacion";
}


export default function AssetDetailCard({ activo }) {
  const cardRef = useRef(null);

  const captureCard = useCallback(async () => {
    if (!cardRef.current || !activo) return null;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return canvas;
  }, [activo]);

  const handleDownloadPDF = useCallback(async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
    const imgW = pdf.internal.pageSize.getWidth();
    const imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    pdf.save(`activo-${activo?.codigo_interno ?? "activo"}.pdf`);
  }, [activo, captureCard]);

  const handleDownloadJPG = useCallback(async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `activo-${activo?.codigo_interno ?? "activo"}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }, [activo, captureCard]);

  const handlePrint = useCallback(async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Imprimir activo</title></head>
      <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
        <img src="${imgData}" alt="QR" style="max-width:100%;height:auto;" />
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  }, [captureCard]);

  if (!activo) return null;

  const ubicacion = activo.ubicacion ?? {};
  const producto = activo.producto ?? {};
  const ubicacionStr = [ubicacion.campus, ubicacion.edificio, ubicacion.aula]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div ref={cardRef}>
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
                <AssetInfoField label="Propietario:" value={getOwnerDisplay(activo)} />
                <AssetInfoField label="Estado:" value={activo.estatus} />
                <AssetInfoField label="Costo:" value={formatCurrency(activo.costo)} />
                <AssetInfoField label="Fecha de alta:" value={activo.fecha_alta} />
              </Col>
            </Row>

            <QRSection activo={activo} />
          </Card.Body>
        </Card>
      </div>

      <ActionButtons
        onDownloadPDF={handleDownloadPDF}
        onDownloadJPG={handleDownloadJPG}
        onPrint={handlePrint}
      />
    </>
  );
}
