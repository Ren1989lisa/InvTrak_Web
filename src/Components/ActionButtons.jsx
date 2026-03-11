import { Button } from "react-bootstrap";

/**
 * Botones de acción del detalle: PDF, JPG, Imprimir.
 * Lógica de descarga puede conectarse después.
 */
export default function ActionButtons({ onDownloadPDF, onDownloadJPG, onPrint }) {
  const handlePrint = () => {
    if (typeof onPrint === "function") {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="inv-action-buttons">
      <Button
        type="button"
        variant="light"
        className="inv-btn inv-btn--secondary"
        onClick={onDownloadPDF}
      >
        Descargar en PDF
      </Button>
      <Button
        type="button"
        variant="light"
        className="inv-btn inv-btn--secondary"
        onClick={onDownloadJPG}
      >
        Descargar en JPG
      </Button>
      <Button
        type="button"
        variant="light"
        className="inv-btn inv-btn--secondary"
        onClick={handlePrint}
      >
        Imprimir
      </Button>
    </div>
  );
}
