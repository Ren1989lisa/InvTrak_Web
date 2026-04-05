import { useMemo, useState, useRef } from "react";
import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { BsCloudUpload } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import { useUsers } from "../context/UsersContext";
import { getStoredReportes, updateReporteTecnico } from "../reportesStorage";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { ESTATUS_ACTIVO } from "../config/estatusActivo";
import { ESTATUS_MANTENIMIENTO } from "../config/databaseEnums";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/reporte-tecnico.css";

const ESTATUS_FINAL_OPTIONS = [
  { value: ESTATUS_MANTENIMIENTO.PENDIENTE, label: "Pendiente" },
  { value: ESTATUS_MANTENIMIENTO.EN_PROCESO, label: "En proceso" },
  { value: ESTATUS_MANTENIMIENTO.EN_MANTENIMIENTO, label: "En mantenimiento" },
  { value: ESTATUS_MANTENIMIENTO.RESUELTO, label: "Resuelto" },
];

export default function ReporteTecnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [estatusFinal, setEstatusFinal] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [accionesRealizadas, setAccionesRealizadas] = useState("");
  const [archivos, setArchivos] = useState([]);
  const fileInputRef = useRef(null);

  const { currentUser, setCurrentUserId, menuItems } = useUsers();

  const reportes = useMemo(() => getStoredReportes(), []);
  const activos = useMemo(() => getStoredActivos(), []);
  const idReporte = Number(id);

  const reporte = useMemo(
    () => reportes.find((r) => Number(r?.id_reporte) === idReporte),
    [reportes, idReporte]
  );

  const activo = useMemo(
    () => activos.find((a) => Number(a?.id_activo) === Number(reporte?.id_activo)),
    [activos, reporte]
  );

  const etiquetaBien = useMemo(
    () => activo?.etiqueta_bien ?? reporte?.folio ?? "",
    [activo, reporte]
  );

  const isTecnicoAsignado = useMemo(
    () => Number(reporte?.id_tecnico_asignado) === Number(currentUser?.id_usuario),
    [reporte, currentUser]
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target?.files ?? []);
    if (files.length === 0) return;
    const newPreviews = files.map((f) => {
      const url = URL.createObjectURL(f);
      return { file: f, url };
    });
    setArchivos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [...prev, ...newPreviews];
    });
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveArchivo = (idx) => {
    setArchivos((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const removed = prev[idx];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files ?? []).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length === 0) return;
    const newPreviews = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setArchivos((prev) => [...prev, ...newPreviews]);
    setErrorMessage("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!estatusFinal?.trim()) {
      setErrorMessage("Selecciona el estatus final.");
      return;
    }

    const fotosBase64 = await Promise.all(archivos.map((a) => fileToBase64(a.file)));
    updateReporteTecnico(idReporte, {
      estatus: estatusFinal,
      diagnostico: diagnostico.trim(),
      acciones_realizadas: accionesRealizadas.trim(),
      fotos_trabajo: fotosBase64,
    });

    const idActivo = Number(reporte?.id_activo);
    if (idActivo) {
      const todosActivos = getStoredActivos();
      const normalizar = (s) => String(s ?? "").trim().toUpperCase();
      const actualizados = todosActivos.map((a) =>
        Number(a?.id_activo) === idActivo &&
        normalizar(a?.estatus) === ESTATUS_ACTIVO.MANTENIMIENTO
          ? { ...a, estatus: ESTATUS_ACTIVO.RESGUARDADO }
          : a
      );
      saveActivos(actualizados);
    }

    setSuccessMessage("Reporte técnico guardado correctamente.");
    setTimeout(() => navigate(`/reporte/${idReporte}`), 1200);
  };

  if (!reporte) {
    return (
      <div className="inv-page">
        <Container fluid className="inv-content px-3 px-md-4 py-3">
          <p className="text-muted">Reporte no encontrado.</p>
          <Button variant="primary" onClick={() => navigate("/mis-reparaciones")}>
            Volver
          </Button>
        </Container>
      </div>
    );
  }

  if (!isTecnicoAsignado) {
    return (
      <div className="inv-page">
        <Container fluid className="inv-content px-3 px-md-4 py-3">
          <Alert variant="warning">No tienes permiso para editar este reporte.</Alert>
          <Button variant="primary" onClick={() => navigate("/mis-reparaciones")}>
            Volver
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="inv-page inv-reporte-tecnico-page">
      <NavbarMenu
        title="Reporte Técnico"
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
          setCurrentUserId(null);
          navigate("/");
        }}
      />

      <Container fluid className="inv-content inv-reporte-tecnico-content px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-reporte-tecnico-back"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        {errorMessage && (
          <Alert variant="danger" className="mt-2" dismissible onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" className="mt-2">{successMessage}</Alert>
        )}

        <Card className="inv-reporte-tecnico-card shadow-sm border-0">
          <Card.Body className="inv-reporte-tecnico-card__body">
            <Row>
              <Col xs={12} md={6}>
                <FormInput
                  label="Etiqueta del bien"
                  name="etiqueta"
                  value={etiquetaBien}
                  disabled
                />
              </Col>
              <Col xs={12} md={6}>
                <FormSelect
                  label="Estatus Final"
                  name="estatusFinal"
                  value={estatusFinal}
                  onChange={(e) => setEstatusFinal(e.target.value)}
                  options={ESTATUS_FINAL_OPTIONS}
                  placeholder="Selecciona final"
                />
              </Col>
            </Row>

            <FormInput
              label="Diagnóstico"
              name="diagnostico"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              as="textarea"
              rows={4}
              placeholder="Describe los detalles del Diagnóstico"
            />

            <FormInput
              label="Acciones realizadas"
              name="accionesRealizadas"
              value={accionesRealizadas}
              onChange={(e) => setAccionesRealizadas(e.target.value)}
              as="textarea"
              rows={4}
              placeholder="Describe las Acciones realizadas"
            />

            <div className="inv-reporte-tecnico-upload mb-3">
              <label className="form-label inv-reporte-tecnico-upload__label">
                Subir Imágenes o videos
              </label>
              <div
                className="inv-reporte-tecnico-upload-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="d-none"
                  onChange={handleFileChange}
                />
                <BsCloudUpload className="inv-reporte-tecnico-upload-icon" />
                <span>Arrastra o selecciona una Imagen o video</span>
              </div>
              {archivos.length > 0 && (
                <div className="inv-reporte-tecnico-thumbnails">
                  {archivos.map((item, idx) => (
                    <div
                      key={idx}
                      className="inv-reporte-tecnico-thumb"
                      onClick={() => handleRemoveArchivo(idx)}
                    >
                      {item.file?.type?.startsWith("video/") ? (
                        <video src={item.url} className="inv-reporte-tecnico-thumb-media" muted />
                      ) : (
                        <img
                          src={item.url}
                          alt={`Preview ${idx + 1}`}
                          className="inv-reporte-tecnico-thumb-media"
                        />
                      )}
                      <span className="inv-reporte-tecnico-thumb-remove">×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="inv-reporte-tecnico-actions">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Guardar
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
