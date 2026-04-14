import { Container } from "react-bootstrap";
import ActivoQR from "../Components/ActivoQR";

export default function ActivoQRDemo() {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="h3 mb-2">Demo de QR de activo</h1>
        <p className="text-muted mb-0">
          Ejemplo de uso del componente reutilizable con un activo fijo.
        </p>
      </div>

      <ActivoQR activoId={5} />
    </Container>
  );
}
