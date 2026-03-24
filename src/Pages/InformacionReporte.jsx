import { useMemo, useState } from "react";
import { Button, Card, Carousel, Col, Container, Modal, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { BsInfoCircle } from "react-icons/bs";
import { BsImage } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredReportes, updateReporteEstatus } from "../reportesStorage";
import { getStoredActivos } from "../activosStorage";
import { getEstadoDisplay } from "../config/estatusActivo";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/informacion-reporte.css";

const ESTADOS_OPCIONES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "en_mantenimiento", label: "En mantenimiento" },
  { value: "resuelto", label: "Resuelto" },
];

function getEstadoLabel(estatus) {
  const opt = ESTADOS_OPCIONES.find((o) => o.value === estatus);
  return opt ? opt.label : (estatus || "Pendiente");
}

function formatFecha(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getFullYear()).slice(-2)}`;
}

export default function InformacionReporte() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showModalEstado, setShowModalEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");

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

  const isTecnicoAsignado = useMemo(
    () => Number(reporte?.id_tecnico_asignado) === Number(currentUser?.id_usuario),
    [reporte, currentUser]
  );

  const fotosEvidencia = useMemo(
    () => (Array.isArray(reporte?.fotos_evidencia) ? reporte.fotos_evidencia : []),
    [reporte]
  );

  const producto = activo?.producto ?? {};
  const ubicacion = activo?.ubicacion ?? {};
  const ubicacionStr = [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula]
    .filter(Boolean)
    .join("") || "-";
  const tituloActivo = [
    producto?.tipo_activo ?? activo?.tipo_activo,
    producto?.marca ?? activo?.marca,
    producto?.modelo ?? activo?.modelo,
  ]
    .filter(Boolean)
    .join(" ") || activo?.codigo_interno || "Activo";

  const handleCambiarEstado = () => {
    if (nuevoEstado) {
      updateReporteEstatus(idReporte, nuevoEstado);
      setShowModalEstado(false);
      setNuevoEstado("");
    }
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

  return (
    <div className="inv-page inv-reporte-info-page">
      <NavbarMenu
        title="INFORMACION DE REPORTE"
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

      <Container fluid className="inv-content inv-reporte-info-content px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-reporte-info-back"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        <h2 className="inv-reporte-info-title">{tituloActivo}</h2>

        <div className="inv-reporte-info-photo">
          {fotosEvidencia.length > 0 ? (
            <Carousel indicators controls className="inv-reporte-carousel">
              {fotosEvidencia.map((src, idx) => (
                <Carousel.Item key={idx}>
                  <img
                    src={src}
                    alt={`Evidencia ${idx + 1}`}
                    className="inv-reporte-carousel-img"
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div className="inv-reporte-info-photo-empty">
              <BsImage className="inv-reporte-info-photo-icon" />
              <span>No photo uploaded</span>
            </div>
          )}
        </div>

        <Card className="inv-reporte-info-card shadow-sm">
          <Card.Header className="inv-reporte-info-card-header">
            <span className="inv-reporte-info-card-header-label">ID</span>
            <span className="inv-reporte-info-card-header-value">
              {activo?.codigo_interno ?? reporte?.folio ?? "-"}
            </span>
          </Card.Header>
          <Card.Body className="inv-reporte-info-card-body">
            <div className="inv-reporte-info-row">
              <span className="inv-reporte-info-label">Estatus Producto</span>
              <span className="inv-reporte-info-value">{getEstadoDisplay(activo) ?? "DISPONIBLE"}</span>
            </div>
            <div className="inv-reporte-info-row">
              <span className="inv-reporte-info-label">Tipo de Activo</span>
              <span className="inv-reporte-info-value">
                {producto?.tipo_activo ?? activo?.tipo_activo ?? "-"}
              </span>
            </div>
            <div className="inv-reporte-info-row">
              <span className="inv-reporte-info-label">Descripción</span>
              <span className="inv-reporte-info-value">{reporte?.descripcion ?? "-"}</span>
            </div>
            <div className="inv-reporte-info-row">
              <span className="inv-reporte-info-label">Fecha de alta</span>
              <span className="inv-reporte-info-value">{formatFecha(activo?.fecha_alta)}</span>
            </div>
            <div className="inv-reporte-info-row">
              <span className="inv-reporte-info-label">Ubicación</span>
              <span className="inv-reporte-info-value">{ubicacionStr}</span>
            </div>
            <div className="inv-reporte-info-row">
              <span className="inv-reporte-info-label">Estado</span>
              <span className="inv-reporte-info-value">
                {getEstadoLabel(reporte?.estatus)}
              </span>
            </div>
          </Card.Body>
        </Card>

        {isTecnicoAsignado && (
          <div className="inv-reporte-info-actions">
            <Button
              variant="primary"
              className="inv-reporte-info-btn"
              onClick={() => setShowModalEstado(true)}
            >
              <BsInfoCircle className="me-2" />
              Cambiar estado de reporte
            </Button>
          </div>
        )}
      </Container>

      <Modal show={showModalEstado} onHide={() => setShowModalEstado(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cambiar estado de reporte</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label className="form-label">Nuevo estado</label>
          <select
            className="form-select"
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value)}
          >
            <option value="">Selecciona...</option>
            {ESTADOS_OPCIONES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalEstado(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleCambiarEstado} disabled={!nuevoEstado}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
