import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import AssetInfoField from "../Components/AssetInfoField";
import { useUsers } from "../context/UsersContext";
import { decodeQRFromFile } from "../utils/decodeQRFromFile";
import { confirmarResguardo, getResguardoByActivoId } from "../services/resguardoService";
import { getEstadoDisplay } from "../config/estatusActivo";
import "../Style/bienes-registrados.css";
import "../Style/asset-detail.css";
import "../Style/sidebar.css";
import "../Style/confirmar-resguardo.css";

function formatCurrency(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(n);
}

const CHECKLIST_ITEMS = [
  { key: "enciende", label: "Enciende" },
  { key: "pantallaFunciona", label: "Pantalla funciona" },
  { key: "tieneCargador", label: "Tiene cargador" },
  { key: "danios", label: "Daños" },
];

const EMPTY_CHECKLIST = {
  enciende: "",
  pantallaFunciona: "",
  tieneCargador: "",
  danios: "",
};

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasMissingChecklistValue(checklist) {
  return CHECKLIST_ITEMS.some(({ key }) => checklist[key] === "");
}

function checklistToEnum(value) {
  if (value === "true") return "SI";
  if (value === "false") return "NO";
  return "NA";
}

export default function ConfirmaResguardo() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [observaciones, setObservaciones] = useState("");
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");
  const [verifiedResguardo, setVerifiedResguardo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrInputRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const { currentUser, logout, menuItems } = useUsers();

  const expectedActivoId = useMemo(() => normalizeId(id), [id]);
  const activo = verifiedResguardo?.activo ?? null;
  const resguardoId = useMemo(
    () =>
      verifiedResguardo?.resguardoId ??
      verifiedResguardo?.id_resguardo ??
      verifiedResguardo?.id ??
      null,
    [verifiedResguardo]
  );
  const isChecklistComplete = !hasMissingChecklistValue(checklist);
  const canSubmit =
    Boolean(verifiedResguardo) &&
    Boolean(resguardoId) &&
    isChecklistComplete &&
    !isVerifying &&
    !isSubmitting;

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (qrPreviewUrl) {
        URL.revokeObjectURL(qrPreviewUrl);
      }
    };
  }, [qrPreviewUrl]);

  useEffect(() => {
    const shouldAutoOpen = Boolean(location.state?.autoOpenQRPicker);
    if (!shouldAutoOpen) return;
    const timerId = window.setTimeout(() => {
      qrInputRef.current?.click();
    }, 0);

    navigate(location.pathname, { replace: true, state: null });
    return () => window.clearTimeout(timerId);
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const state = location.state ?? {};
    const qrError = state.qrError ?? "";
    const validatedActivoId = state.validatedActivoId ?? null;
    if (!qrError && validatedActivoId == null) return;

    if (qrError) {
      setErrorMessage(String(qrError));
      setSuccessMessage("");
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    if (validatedActivoId != null) {
      void loadResguardoByActivoId(validatedActivoId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const resetConfirmationState = () => {
    setChecklist(EMPTY_CHECKLIST);
    setObservaciones("");
    setVerifiedResguardo(null);
  };

  const handleCheckChange = (key, value) => {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenQrPicker = () => {
    if (isVerifying || isSubmitting) return;
    qrInputRef.current?.click();
  };

  const loadResguardoByActivoId = async (activoId) => {
    if (activoId == null || activoId === "") {
      setErrorMessage("El QR no contiene un id de activo válido.");
      return;
    }

    if (expectedActivoId != null && String(expectedActivoId) !== String(activoId)) {
      setErrorMessage("El código QR no corresponde a este bien");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const resguardo = await getResguardoByActivoId(activoId);

      if (!resguardo) {
        setErrorMessage("QR no encontrado");
        return;
      }

      const backendActivoId =
        resguardo?.activoId ??
        resguardo?.id_activo ??
        resguardo?.activo?.id_activo ??
        null;
      if (backendActivoId != null && String(backendActivoId) !== String(activoId)) {
        setErrorMessage("El código QR no corresponde a este bien");
        return;
      }

      if (resguardo.confirmado === true || resguardo.fechaDevolucion) {
        setErrorMessage("Este resguardo ya fue confirmado.");
        return;
      }

      setVerifiedResguardo(resguardo);
      setChecklist(EMPTY_CHECKLIST);
      setObservaciones("");
    } catch (error) {
      console.error("Error al validar QR:", error);
      if (error?.status === 404) {
        setErrorMessage("QR no encontrado");
      } else if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      } else if (error?.status === 403) {
        setErrorMessage("Sin permisos");
      } else if (error?.status === 0) {
        setErrorMessage("Error de red");
      } else {
        setErrorMessage(error?.message || "No fue posible validar el QR.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQrFileChange = async (event) => {
    const input = event.target;
    const file = input?.files?.[0];
    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");

    resetConfirmationState();
    const previewUrl = URL.createObjectURL(file);
    setQrPreviewUrl(previewUrl);

    const result = await decodeQRFromFile(file);
    if (!result) {
      setErrorMessage("No se pudo leer el QR. Selecciona una imagen válida.");
      if (input) {
        input.value = "";
      }
      return;
    }

    await loadResguardoByActivoId(result.activoId);
    if (input) {
      input.value = "";
    }
  };

  const handleConfirmar = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!verifiedResguardo || !resguardoId) {
      setErrorMessage("Primero debes validar el QR del activo.");
      return;
    }

    if (!isChecklistComplete) {
      setErrorMessage("Completa el checklist antes de continuar");
      return;
    }

    setIsSubmitting(true);

    try {
      const datos = {
        resguardoId: Number(resguardoId),
        enciende: checklistToEnum(checklist.enciende),
        pantallaFunciona: checklistToEnum(checklist.pantallaFunciona),
        tieneCargador: checklistToEnum(checklist.tieneCargador),
        danios: checklistToEnum(checklist.danios),
        observaciones: observaciones.trim(),
      };

      const formData = new FormData();
      formData.append(
        "datos",
        new Blob([JSON.stringify(datos)], { type: "application/json" })
      );

      await confirmarResguardo(formData);
      setSuccessMessage("Resguardo confirmado correctamente.");

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/mis-bienes", {
          replace: true,
          state: { resguardoConfirmedToast: true },
        });
      }, 1400);
    } catch (error) {
      console.error("Error al confirmar resguardo:", error);
      if (error?.status === 404) {
        setErrorMessage("No se encontró el resguardo a confirmar.");
      } else if (error?.status === 400) {
        setErrorMessage("Datos inválidos.");
      } else if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      } else if (error?.status === 403) {
        setErrorMessage("Sin permisos");
      } else if (error?.status === 0) {
        setErrorMessage("Error de red");
      } else {
        setErrorMessage(error?.message || "No fue posible confirmar el resguardo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ubicacion = activo?.ubicacion ?? {};
  const producto = activo?.producto ?? {};
  const ubicacionStr =
    ubicacion.completa ||
    [ubicacion.campus, ubicacion.edificio, ubicacion.aula].filter(Boolean).join(" ");
  const productoStr =
    producto.completo || producto.tipo_activo || activo?.tipo_activo || "";

  return (
    <div className="inv-page inv-page--detail">
      <NavbarMenu
        title="Confirmar resguardo"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={menuItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          if (currentUser) navigate(`/perfil/${currentUser.id_usuario}`);
          else navigate("/perfil");
        }}
        onLogout={() => {
          setOpenSidebar(false);
          logout();
          navigate("/login");
        }}
      />

      <Container fluid className="inv-content inv-content--detail px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        {errorMessage ? (
          <Alert variant="danger" className="mt-2" dismissible onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert variant="success" className="mt-2">
            {successMessage}
          </Alert>
        ) : null}

        {isVerifying ? (
          <Alert variant="info" className="mt-2 d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Validando QR...</span>
          </Alert>
        ) : null}

        <Row className="justify-content-center mt-3">
          <Col xs={12} md={10} lg={8}>
            <Card className="inv-confirmar-card shadow-sm border-0">
              <Card.Header className="inv-confirmar-card__header">
                Etq. bien: {activo?.etiqueta_bien || "Pendiente de escaneo"}
              </Card.Header>
              <Card.Body className="inv-confirmar-card__body">
                <Row>
                  <Col xs={12} md={6}>
                    <AssetInfoField
                      label="Número de serie:"
                      value={activo?.numero_serie}
                    />
                    <AssetInfoField
                      label="Producto:"
                      value={productoStr || undefined}
                    />
                    <AssetInfoField
                      label="Estado:"
                      value={activo ? getEstadoDisplay(activo) : "Pendiente"}
                    />
                    <AssetInfoField
                      label="Ubicación:"
                      value={ubicacionStr || undefined}
                    />
                    <AssetInfoField
                      label="Costo:"
                      value={formatCurrency(activo?.costo)}
                    />
                    <AssetInfoField
                      label="Descripción:"
                      value={activo?.descripcion}
                    />
                    <AssetInfoField
                      label="Fecha de alta:"
                      value={activo?.fecha_alta}
                    />
                  </Col>
                </Row>

                {!verifiedResguardo ? (
                  <div className="inv-confirmar-upload">
                  <div className="d-flex justify-content-end mb-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleOpenQrPicker}
                      disabled={isVerifying || isSubmitting}
                    >
                      Subir QR
                    </Button>
                  </div>
                  <div
                    className="inv-confirmar-upload-zone"
                    onClick={handleOpenQrPicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenQrPicker();
                      }
                    }}
                  >
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleQrFileChange}
                    />
                    {qrPreviewUrl ? (
                      <img
                        src={qrPreviewUrl}
                        alt="Vista previa del QR"
                        className="inv-confirmar-preview"
                      />
                    ) : (
                      <span>Arrastra o selecciona la imagen del QR</span>
                    )}
                  </div>
                  <p className="inv-confirmar-hint">
                    El QR debe contener únicamente el id del activo.
                  </p>
                  </div>
                ) : null}

                {verifiedResguardo ? (
                  <>
                <div className="inv-confirmar-checklist">
                  {CHECKLIST_ITEMS.map(({ key, label }) => (
                    <div key={key} className="inv-confirmar-checklist__row">
                      <Form.Label className="inv-confirmar-checklist__label">
                        {label}
                      </Form.Label>
                      <div className="inv-confirmar-checklist__radios">
                        <Form.Check
                          type="radio"
                          name={key}
                          id={`${key}-si`}
                          label="Sí"
                          value="true"
                          checked={checklist[key] === "true"}
                          onChange={() => handleCheckChange(key, "true")}
                        />
                        <Form.Check
                          type="radio"
                          name={key}
                          id={`${key}-no`}
                          label="No"
                          value="false"
                          checked={checklist[key] === "false"}
                          onChange={() => handleCheckChange(key, "false")}
                        />
                        <Form.Check
                          type="radio"
                          name={key}
                          id={`${key}-na`}
                          label="No aplica"
                          value="na"
                          checked={checklist[key] === "na"}
                          onChange={() => handleCheckChange(key, "na")}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="inv-confirmar-observaciones">
                  <Form.Label className="inv-confirmar-checklist__label">
                    Observaciones
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={observaciones}
                    onChange={(event) => setObservaciones(event.target.value)}
                    placeholder="Agrega observaciones opcionales sobre el estado del bien"
                    className="inv-confirmar-textarea"
                  />
                </div>

                


                <div className="inv-confirmar-actions">
                  <Button
                    variant="success"
                    size="lg"
                    className="inv-confirmar-btn"
                    onClick={handleConfirmar}
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? "Confirmando..." : "Confirmar resguardo"}
                  </Button>
                </div>
                  </>
                ) : (
                  <Alert variant="secondary" className="mt-3 mb-0">
                    Selecciona el QR del bien asignado para desbloquear el checklist.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
