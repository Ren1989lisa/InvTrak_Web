import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { fetchActivoQrBlob } from "../services/qrService";
import { ApiError } from "../api/apiClient";

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "No autorizado";
    if (error.status === 404) return "QR no encontrado";
    if (error.status === 0) return "Error de red";
  }

  if (typeof error?.status === "number") {
    if (error.status === 401) return "No autorizado";
    if (error.status === 404) return "QR no encontrado";
    if (error.status === 0) return "Error de red";
  }

  const message = (error?.message ?? "").toString().trim();
  if (message) {
    if (message.toLowerCase().includes("red")) return "Error de red";
    return message;
  }

  return "No se pudo cargar el QR";
}

function QrBody({ loading, error, qrUrl, onRetry, showRetryOnSuccess }) {
  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center py-4">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="mt-3 text-muted">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="w-100 mb-0">
        <div className="fw-semibold mb-2">{error}</div>
        <div className="d-flex justify-content-end">
          <Button
            type="button"
            variant="outline-danger"
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </div>
      </Alert>
    );
  }

  if (!qrUrl) {
    return null;
  }

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <img
        src={qrUrl}
        alt="QR del activo"
        className="img-fluid rounded border bg-white p-2"
        style={{ maxWidth: 320 }}
      />
      {showRetryOnSuccess ? (
        <Button
          type="button"
          variant="outline-primary"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}

export default function ActivoQR({
  activoId,
  baseUrl,
  token,
  className = "",
  showFrame = true,
}) {
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const objectUrlRef = useRef("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const revokeCurrentUrl = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };

    async function loadQr() {
      if (activoId === null || activoId === undefined || String(activoId).trim() === "") {
        revokeCurrentUrl();
        setQrUrl("");
        setLoading(false);
        setError("Debes proporcionar un activoId válido.");
        return;
      }

      setLoading(true);
      setError("");
      revokeCurrentUrl();
      setQrUrl("");

      try {
        const blob = await fetchActivoQrBlob(activoId, {
          baseUrl,
          token,
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) {
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        objectUrlRef.current = nextUrl;
        setQrUrl(nextUrl);
      } catch (err) {
        if (!active || controller.signal.aborted) {
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQr();

    return () => {
      active = false;
      controller.abort();
      revokeCurrentUrl();
    };
  }, [activoId, baseUrl, token, retryCount]);

  const handleRetry = () => {
    setRetryCount((current) => current + 1);
  };

  const body = (
    <QrBody
      loading={loading}
      error={error}
      qrUrl={qrUrl}
      onRetry={handleRetry}
      showRetryOnSuccess={showFrame}
    />
  );

  if (!showFrame) {
    return <div className={`d-flex flex-column align-items-center gap-3 ${className}`.trim()}>{body}</div>;
  }

  return (
    <Card className={`shadow-sm border-0 ${className}`.trim()}>
      <Card.Body className="p-4">
        <div className="d-flex flex-column align-items-center gap-3">
          <div className="text-center">
            <Card.Title className="mb-1">Código QR del activo</Card.Title>
            <Card.Text className="text-muted mb-0">
              Activo ID: {activoId ?? "Sin seleccionar"}
            </Card.Text>
          </div>
          {body}
        </div>
      </Card.Body>
    </Card>
  );
}
