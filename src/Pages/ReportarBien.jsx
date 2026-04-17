import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BsClipboard2Fill, BsImage } from "react-icons/bs";
import { FiUploadCloud } from "react-icons/fi";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import { useUsers } from "../context/UsersContext";
import { usePendientesResguardo } from "../hooks/usePendientesResguardo";
import { getStoredActivos } from "../activosStorage";
import { getStoredResguardos } from "../resguardosStorage";
import { createReporte, getPrioridadesMap, getReportes } from "../services/reporteService";
import { reportarBienSchema } from "../utils/schemas";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/reportar-bien.css";

const PRIORIDAD_IDS_DEFAULT = {
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
};

const TIPO_FALLA_OPTIONS = [
  { value: "PANTALLA", label: "Pantalla" },
  { value: "BATERIA", label: "Bateria" },
  { value: "TECLADO", label: "Teclado" },
  { value: "CARGADOR", label: "Cargador" },
  { value: "SOFTWARE", label: "Software" },
  { value: "CONECTIVIDAD", label: "Conectividad" },
  { value: "OTRO", label: "Otro" },
];

const PRIORIDAD_OPTIONS = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

function normalizeText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function getEtiquetaBien(activo) {
  return (activo?.etiqueta_bien ?? activo?.etiquetaBien ?? "").toString().trim();
}

function getActivoId(activo) {
  const rawId = activo?.id_activo ?? activo?.idActivo ?? activo?.id;
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : null;
}

function isResguardadoActivo(activo) {
  const estatus = String(activo?.estatus ?? "").trim().toUpperCase();
  return estatus === "RESGUARDADO";
}

function isConfirmedResguardo(value) {
  if (value === true) return true;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text.includes("confirm");
}

function getCreateErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  const backendMessage = String(error?.message ?? "").trim();
  const hasGenericAxiosMessage = backendMessage.toLowerCase().includes("request failed with status code");

  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 403) return "No tienes permisos para crear reportes.";
  if (status === 404) return "No se encontro el activo o la prioridad seleccionada.";
  if (status === 400) {
    return hasGenericAxiosMessage
      ? "Datos invalidos. Revisa la informacion capturada."
      : backendMessage || "Datos invalidos. Revisa la informacion capturada.";
  }
  if (status === 500) {
    return hasGenericAxiosMessage
      ? "No fue posible crear el reporte. Revisa el backend e intenta de nuevo."
      : backendMessage || "No fue posible crear el reporte.";
  }
  if (status === 0) return "Error de red. Verifica tu conexion.";
  return hasGenericAxiosMessage ? "No fue posible crear el reporte." : backendMessage || "No fue posible crear el reporte.";
}

export default function ReportarBien() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prioridadIdsByNombre, setPrioridadIdsByNombre] = useState(PRIORIDAD_IDS_DEFAULT);
  const fileInputRef = useRef(null);

  const { currentUser, logout, menuItems, defaultRoute } = useUsers();
  const {
    resguardos: resguardosApi,
    isLoading: isLoadingMisBienes,
    error: misBienesError,
    refresh: refreshMisBienes,
  } = usePendientesResguardo(currentUser);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(reportarBienSchema),
    defaultValues: {
      etiqueta: "",
      tipoFalla: "",
      prioridad: "MEDIA",
      descripcion: "",
    },
  });

  const activos = useMemo(() => getStoredActivos(), []);
  const resguardosLocales = useMemo(() => getStoredResguardos(), []);

  useEffect(() => {
    let active = true;

    async function hydratePrioridades() {
      const nextMap = { ...PRIORIDAD_IDS_DEFAULT };

      try {
        const backendMap = await getPrioridadesMap();
        if (!active) return;

        Object.entries(backendMap ?? {}).forEach(([key, id]) => {
          if ((key === "ALTA" || key === "MEDIA" || key === "BAJA") && Number.isFinite(Number(id))) {
            nextMap[key] = id;
          }
        });
      } catch {
        // Fallback: inferir desde reportes existentes cuando /prioridad no esté disponible.
        try {
          const reportes = await getReportes();
          if (!active || !Array.isArray(reportes) || !reportes.length) {
            setPrioridadIdsByNombre(nextMap);
            return;
          }

          reportes.forEach((reporte) => {
            const key = String(reporte?.prioridad ?? "").trim().toUpperCase();
            const id = Number(reporte?.prioridad_id ?? reporte?.prioridadId);
            if (!Number.isFinite(id) || id <= 0) return;
            if (key === "ALTA" || key === "MEDIA" || key === "BAJA") {
              nextMap[key] = id;
            }
          });
        } catch {
          // Si todo falla, se conservan IDs por defecto.
        }
      }

      setPrioridadIdsByNombre(nextMap);
    }

    hydratePrioridades();
    return () => {
      active = false;
    };
  }, []);

  const misBienesLocal = useMemo(() => {
    const idUsuario = Number(
      currentUser?.id_usuario ?? currentUser?.idUsuario ?? currentUser?.id ?? Number.NaN
    );
    if (!Number.isFinite(idUsuario)) return [];

    const idsDesdeResguardos = new Set(
      resguardosLocales
        .filter((resguardo) => Number(resguardo?.id_usuario ?? resguardo?.idUsuario) === idUsuario)
        .map((resguardo) => Number(resguardo?.id_activo ?? resguardo?.idActivo ?? resguardo?.activoId))
        .filter((idActivo) => Number.isFinite(idActivo))
    );

    return activos.filter((activo) => {
      const idActivo = Number(activo?.id_activo ?? activo?.idActivo);
      const assigned =
        Number(activo?.id_usuario_asignado) === idUsuario ||
        idsDesdeResguardos.has(idActivo);
      return assigned;
    });
  }, [activos, resguardosLocales, currentUser?.id_usuario, currentUser?.idUsuario, currentUser?.id]);

  const misBienesReportables = useMemo(() => {
    const fromApi = new Map();

    if (Array.isArray(resguardosApi) && resguardosApi.length > 0) {
      resguardosApi.forEach((resguardo) => {
        const confirmado = isConfirmedResguardo(resguardo?.confirmado);
        const activo = resguardo?.activo;
        if (!confirmado || !activo) return;
        if (!isResguardadoActivo(activo)) return;

        const id = getActivoId(activo);
        const etiqueta = getEtiquetaBien(activo);
        const key = Number.isFinite(id) ? `id-${id}` : `etq-${normalizeText(etiqueta)}`;
        if (!key || fromApi.has(key)) return;
        fromApi.set(key, activo);
      });

      return Array.from(fromApi.values());
    }

    if (misBienesError) {
      return misBienesLocal.filter(isResguardadoActivo);
    }

    return [];
  }, [resguardosApi, misBienesError, misBienesLocal]);

  const etiquetaOptions = useMemo(() => {
    const unique = new Map();

    misBienesReportables.forEach((activo) => {
      const etiqueta = getEtiquetaBien(activo);
      if (!etiqueta) return;
      const key = normalizeText(etiqueta);
      if (unique.has(key)) return;
      unique.set(key, { value: etiqueta, label: etiqueta });
    });

    return Array.from(unique.values());
  }, [misBienesReportables]);

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target?.files ?? []).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    setArchivos((prev) => [...prev, ...nextFiles].slice(0, 6));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const nextFiles = Array.from(event.dataTransfer?.files ?? []).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    setArchivos((prev) => [...prev, ...nextFiles].slice(0, 6));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeArchivo = (index) => {
    setArchivos((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage("");
    setSuccessMessage("");

    const etiquetaSeleccionada = String(data.etiqueta ?? "").trim();
    const activo = misBienesReportables.find(
      (item) => normalizeText(getEtiquetaBien(item)) === normalizeText(etiquetaSeleccionada)
    );

    if (!activo) {
      setErrorMessage("La etiqueta no corresponde a ninguno de tus bienes registrados.");
      return;
    }

    const activoId = getActivoId(activo);
    if (!Number.isFinite(activoId) || activoId <= 0) {
      setErrorMessage("No fue posible identificar el activo seleccionado.");
      return;
    }

    if (!archivos.length) {
      setErrorMessage("Debes subir al menos una evidencia fotografica o de video.");
      return;
    }

    const prioridadNombre = String(data.prioridad ?? "MEDIA").trim().toUpperCase();
    const prioridadId = Number(prioridadIdsByNombre?.[prioridadNombre]);

    if (!Number.isFinite(prioridadId) || prioridadId <= 0) {
      setErrorMessage("No fue posible determinar la prioridad del reporte.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReporte({
        activoId,
        tipoFalla: data.tipoFalla,
        descripcion: data.descripcion,
        prioridadId,
        archivos,
      });

      setSuccessMessage("Reporte creado correctamente.");
      setArchivos([]);
      reset({
        etiqueta: "",
        tipoFalla: "",
        prioridad: "MEDIA",
        descripcion: "",
      });
      refreshMisBienes();
      window.dispatchEvent(new CustomEvent("invtrack-reportes-changed"));
    } catch (error) {
      setErrorMessage(getCreateErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleCancel = () => {
    navigate(defaultRoute);
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Creacion de Reporte Tecnico"
        onMenuClick={() => setOpenSidebar((value) => !value)}
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

      <Container fluid className="inv-content px-3 px-md-4 py-3 inv-reportar-container">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(defaultRoute)}
        >
          ← Regresar
        </Button>

        {successMessage ? (
          <div className="inv-reportar-toast">
            <span className="inv-reportar-toast__icon">✓</span>
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setErrorMessage("")}
            className="mt-2"
          >
            {errorMessage}
          </Alert>
        ) : null}

        {isLoadingMisBienes ? (
          <Alert variant="info" className="mt-2 mb-0">
            Cargando tus activos...
          </Alert>
        ) : null}

        {misBienesError ? (
          <Alert
            variant="warning"
            dismissible
            onClose={refreshMisBienes}
            className="mt-2 mb-0 d-flex align-items-center justify-content-between gap-3"
          >
            <span>{misBienesError}</span>
            <Button variant="outline-warning" size="sm" onClick={refreshMisBienes}>
              Reintentar
            </Button>
          </Alert>
        ) : null}

        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card className="inv-reportar-card shadow-sm border-0">
              <Card.Header className="inv-reportar-card__header">
                <BsClipboard2Fill className="inv-reportar-card__icon" />
                Creacion de Reporte Tecnico
              </Card.Header>
              <Card.Body className="inv-reportar-card__body">
                <Form onSubmit={onSubmit}>
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Controller
                        name="etiqueta"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormSelect
                            label="Etiqueta del activo"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={etiquetaOptions}
                            placeholder="Selecciona la etiqueta del activo"
                            className="inv-reportar-select"
                            error={fieldState.error?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Col>

                    <Col xs={12} md={6}>
                      <Controller
                        name="tipoFalla"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormSelect
                            label="Tipo de falla"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={TIPO_FALLA_OPTIONS}
                            placeholder="Selecciona el tipo de falla"
                            className="inv-reportar-select"
                            error={fieldState.error?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Controller
                        name="prioridad"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormSelect
                            label="Prioridad"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={PRIORIDAD_OPTIONS}
                            placeholder="Selecciona la prioridad"
                            className="inv-reportar-select"
                            error={fieldState.error?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Col>
                  </Row>

                  <Controller
                    name="descripcion"
                    control={control}
                    render={({ field, fieldState }) => (
                      <FormInput
                        label="Descripcion de problema"
                        name={field.name}
                        as="textarea"
                        rows={4}
                        placeholder="Describe los detalles del problema..."
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="inv-reportar-textarea"
                        error={fieldState.error?.message}
                        disabled={isSubmitting}
                      />
                    )}
                  />

                  <Form.Group className="mt-4">
                    <Form.Label>Subir imagenes o videos</Form.Label>
                    <div
                      className="inv-reportar-upload"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="d-none"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                      />
                      <FiUploadCloud className="inv-reportar-upload-icon" />
                      <span>Arrastra o selecciona una imagen o video</span>
                    </div>

                    <div className="inv-reportar-thumbnails">
                      {archivos.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="inv-reportar-thumb">
                          <BsImage className="inv-reportar-thumb-icon" />
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="inv-reportar-thumb-remove"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeArchivo(index);
                            }}
                            disabled={isSubmitting}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(2 - archivos.length, 0) }).map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="inv-reportar-thumb inv-reportar-thumb--empty"
                        >
                          <BsImage className="inv-reportar-thumb-icon" />
                        </div>
                      ))}
                    </div>
                  </Form.Group>

                  <div className="inv-reportar-actions">
                    <Button
                      type="button"
                      variant="danger"
                      className="inv-reportar-cancel"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="inv-reportar-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Enviando..." : "Enviar reporte"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
