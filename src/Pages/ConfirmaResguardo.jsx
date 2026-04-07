import { useMemo, useState, useRef } from "react";
import { Alert, Card, Col, Container, Form, Row, Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import AssetInfoField from "../Components/AssetInfoField";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { ESTATUS_ACTIVO, getEstadoDisplay } from "../config/estatusActivo";
import { ESTADO_RESGUARDO } from "../config/databaseEnums";
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
  { key: "enciende", label: "Enciende correctamente" },
  { key: "cargador", label: "Incluye cargador" },
  { key: "pantalla", label: "Pantalla en buen estado" },
  { key: "sin_danos", label: "Sin daños físicos" },
];

export default function ConfirmaResguardo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [checklist, setChecklist] = useState(
    Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.key, ""]))
  );
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const { currentUser, logout, menuItems } = useUsers();

  const activos = useMemo(() => getStoredActivos(), []);
  const idNum = Number(id);
  const activo = useMemo(
    () => activos.find((a) => Number(a?.id_activo) === idNum),
    [activos, idNum]
  );

  const isAssignedToMe = useMemo(() => {
    if (!activo || !currentUser) return false;
    return Number(activo?.id_usuario_asignado) === Number(currentUser?.id_usuario);
  }, [activo, currentUser]);

  const handleCheckChange = (key, value) => {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    setArchivo(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setErrorMessage("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setArchivo(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleConfirmar = () => {
    setErrorMessage("");
    setSuccessMessage("");

    const values = Object.values(checklist);
    const someNA = values.some((v) => v === "no_aplica");
    const someYes = values.some((v) => v === "si");
    if (!someYes && !someNA) {
      setErrorMessage("Responde al menos una pregunta de verificación.");
      return;
    }

    const updated = activos.map((a) =>
      Number(a?.id_activo) === idNum
        ? {
            ...a,
            estado_asignacion: ESTADO_RESGUARDO.CONFIRMADO,
            estatus: ESTATUS_ACTIVO.RESGUARDADO,
          }
        : a
    );
    saveActivos(updated);
    setSuccessMessage("Resguardo confirmado. El bien ya aparece en Mis bienes.");
    setTimeout(() => navigate("/mis-bienes"), 1500);
  };

  if (!activo) {
    return (
      <div className="inv-page">
        <Container fluid className="inv-content px-3 px-md-4 py-3">
          <Alert variant="warning">Activo no encontrado.</Alert>
          <Button variant="primary" onClick={() => navigate("/mis-bienes")}>
            Volver a Mis bienes
          </Button>
        </Container>
      </div>
    );
  }

  if (!isAssignedToMe) {
    return (
      <div className="inv-page">
        <Container fluid className="inv-content px-3 px-md-4 py-3">
          <Alert variant="warning">No tienes permiso para confirmar este bien.</Alert>
          <Button variant="primary" onClick={() => navigate("/mis-bienes")}>
            Volver a Mis bienes
          </Button>
        </Container>
      </div>
    );
  }

  const ubicacion = activo.ubicacion ?? {};
  const producto = activo.producto ?? {};
  const ubicacionStr = [ubicacion.campus, ubicacion.edificio, ubicacion.aula]
    .filter(Boolean)
    .join(" ");

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

        {errorMessage && (
          <Alert variant="danger" className="mt-2" dismissible onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" className="mt-2">{successMessage}</Alert>
        )}

        <Row className="justify-content-center mt-3">
          <Col xs={12} md={10} lg={8}>
            <Card className="inv-confirmar-card shadow-sm border-0">
              <Card.Header className="inv-confirmar-card__header">
                Etq. bien: {activo.etiqueta_bien}
              </Card.Header>
              <Card.Body className="inv-confirmar-card__body">
                <Row>
                  <Col xs={12} md={6}>
                    <AssetInfoField label="Número de serie:" value={activo.numero_serie} />
                    <AssetInfoField
                      label="Tipo de activo:"
                      value={producto.tipo_activo ?? activo.tipo_activo}
                    />
                    <AssetInfoField label="Estado:" value={getEstadoDisplay(activo)} />
                    <AssetInfoField label="Ubicación:" value={ubicacionStr} />
                    <AssetInfoField label="Costo:" value={formatCurrency(activo.costo)} />
                    <AssetInfoField label="Descripción:" value={activo.descripcion} />
                    <AssetInfoField label="Fecha de alta:" value={activo.fecha_alta} />
                  </Col>
                </Row>

                <div className="inv-confirmar-upload">
                  <div
                    className="inv-confirmar-upload-zone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="d-none"
                      onChange={handleFileChange}
                    />
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="inv-confirmar-preview"
                      />
                    ) : (
                      <span>Arrastra o selecciona una imagen o video</span>
                    )}
                  </div>
                </div>

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
                          value="si"
                          checked={checklist[key] === "si"}
                          onChange={() => handleCheckChange(key, "si")}
                        />
                        <Form.Check
                          type="radio"
                          name={key}
                          id={`${key}-na`}
                          label="No aplica"
                          value="no_aplica"
                          checked={checklist[key] === "no_aplica"}
                          onChange={() => handleCheckChange(key, "no_aplica")}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="inv-confirmar-actions">
                  <Button
                    variant="success"
                    size="lg"
                    className="inv-confirmar-btn"
                    onClick={handleConfirmar}
                  >
                    Confirmar de Resguardado
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
