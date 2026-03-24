import { useMemo, useState, useRef } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsClipboard2Fill } from "react-icons/bs";
import { BiBarcodeReader } from "react-icons/bi";
import { FiUploadCloud } from "react-icons/fi";
import { BsImage } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { getStoredResguardos } from "../resguardosStorage";
import { addReporte } from "../reportesStorage";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/reportar-bien.css";

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ESTATUS_OPCIONES = [
  { value: "reportado", label: "Reportado" },
  { value: "con_fallas", label: "Con fallas" },
  { value: "no_funciona", label: "No funciona" },
  { value: "otro", label: "Otro" },
];

export default function ReportarBien() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [etiqueta, setEtiqueta] = useState("");
  const [estatus, setEstatus] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  const { currentUser, setCurrentUserId, menuItems, defaultRoute } = useUsers();

  const activos = useMemo(() => getStoredActivos(), []);
  const resguardos = useMemo(() => getStoredResguardos(), []);

  const misBienes = useMemo(() => {
    const idUsuario = Number(currentUser?.id_usuario);
    const idsDesdeResguardos = new Set(
      resguardos
        .filter((r) => Number(r?.id_usuario) === idUsuario)
        .map((r) => Number(r?.id_activo))
    );
    const pendiente = (v) =>
      (v ?? "").toString().toLowerCase().includes("pendiente");
    return activos.filter((a) => {
      const assigned =
        Number(a?.id_usuario_asignado) === idUsuario ||
        idsDesdeResguardos.has(Number(a?.id_activo));
      if (!assigned) return false;
      return !pendiente(a?.estado_asignacion);
    });
  }, [activos, resguardos, currentUser?.id_usuario]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target?.files ?? []);
    setArchivos((prev) => [...prev, ...files].slice(0, 6));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    setArchivos((prev) => [...prev, ...files].slice(0, 6));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeArchivo = (idx) => {
    setArchivos((prev) => prev.filter((_, i) => i !== idx));
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const codigo = etiqueta.trim();
    if (!codigo) {
      setErrorMessage("Ingresa la etiqueta del bien.");
      return;
    }

    const activo = misBienes.find(
      (a) => (a?.codigo_interno ?? "").toString().trim().toUpperCase() === codigo.toUpperCase()
    );
    if (!activo) {
      setErrorMessage("La etiqueta no corresponde a ninguno de tus bienes registrados.");
      return;
    }

    let fotosEvidencia = [];
    try {
      fotosEvidencia = await Promise.all(
        archivos.filter((f) => f.type.startsWith("image/")).map(fileToBase64)
      );
    } catch {
      setErrorMessage("No se pudieron procesar las imágenes.");
      return;
    }

    addReporte({
      id_activo: activo.id_activo,
      folio: null,
      descripcion: descripcion.trim() || `Reporte de bien ${activo.codigo_interno}`,
      prioridad: "media",
      estatus: "pendiente",
      id_tecnico_asignado: null,
      fecha_reporte: todayDateString(),
      fotos_evidencia: fotosEvidencia,
    });

    const updated = activos.map((a) =>
      Number(a?.id_activo) === Number(activo.id_activo)
        ? { ...a, estatus: "Reportado" }
        : a
    );
    saveActivos(updated);

    setSuccessMessage("Reporte creado correctamente");
    setEtiqueta("");
    setEstatus("");
    setDescripcion("");
    setArchivos([]);
    setTimeout(() => setSuccessMessage(""), 3500);
  };

  const handleCancel = () => {
    navigate(defaultRoute);
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Creación de Reporte Técnico"
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

      <Container fluid className="inv-content px-3 px-md-4 py-3 inv-reportar-container">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(defaultRoute)}
        >
          ← Regresar
        </Button>

        {successMessage && (
          <div className="inv-reportar-toast">
            <span className="inv-reportar-toast__icon">✓</span>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage("")} className="mt-2">
            {errorMessage}
          </Alert>
        )}

        <Row className="justify-content-center mt-3">
          <Col xs={12} lg={10} xl={8}>
            <Card className="inv-reportar-card shadow-sm border-0">
              <Card.Header className="inv-reportar-card__header">
                <BsClipboard2Fill className="inv-reportar-card__icon" />
                Creación de Reporte Técnico
              </Card.Header>
              <Card.Body className="inv-reportar-card__body">
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Etiqueta del bien"
                        name="etiqueta"
                        type="text"
                        placeholder="Ingresa la etiqueta del bien"
                        value={etiqueta}
                        onChange={(e) => setEtiqueta(e.target.value)}
                        list="etiquetas-sugeridas"
                        className="inv-reportar-input"
                        leftIcon={<BiBarcodeReader className="inv-reportar-input-icon" />}
                      />
                      <datalist id="etiquetas-sugeridas">
                        {misBienes.map((a) => (
                          <option key={a.id_activo} value={a.codigo_interno} />
                        ))}
                      </datalist>
                    </Col>
                    <Col xs={12} md={6}>
                      <FormSelect
                        label="Estatus del Producto"
                        name="estatus"
                        value={estatus}
                        onChange={(e) => setEstatus(e.target.value)}
                        options={ESTATUS_OPCIONES}
                        placeholder="Selecciona el estatus"
                        className="inv-reportar-select"
                      />
                    </Col>
                  </Row>

                  <FormInput
                    label="Descripción de problema"
                    name="descripcion"
                    as="textarea"
                    rows={4}
                    placeholder="Describe los detalles del problema..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="inv-reportar-textarea"
                  />

                  <Form.Group className="mt-4">
                    <Form.Label>Subir Imágenes o videos</Form.Label>
                    <div
                      className="inv-reportar-upload"
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
                      <FiUploadCloud className="inv-reportar-upload-icon" />
                      <span>Arrastra o selecciona una imagen o video</span>
                    </div>
                    <div className="inv-reportar-thumbnails">
                      {archivos.map((file, idx) => (
                        <div key={idx} className="inv-reportar-thumb">
                          <BsImage className="inv-reportar-thumb-icon" />
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="inv-reportar-thumb-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeArchivo(idx);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(2 - archivos.length, 0) }).map((_, i) => (
                        <div key={`empty-${i}`} className="inv-reportar-thumb inv-reportar-thumb--empty">
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
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="inv-reportar-submit">
                      Enviar reporte
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
