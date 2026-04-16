import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { BsCloudUpload } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import FormInput from "../Components/FormInput";
import { useUsers } from "../context/UsersContext";
import { updateReporteEstatus, updateReporteTecnico } from "../reportesStorage";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { getReporteById } from "../services/reporteService";
import {
  atenderMantenimiento,
  cerrarMantenimiento,
  getMantenimientosByTecnico,
} from "../services/mantenimientoService";
import { ESTATUS_ACTIVO } from "../config/estatusActivo";
import { ESTATUS_REPORTE_DANIO } from "../config/databaseEnums";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/reporte-tecnico.css";

export default function ReporteTecnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [diagnostico, setDiagnostico] = useState("");
  const [accionesRealizadas, setAccionesRealizadas] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [mantenimientoAsignado, setMantenimientoAsignado] = useState(null);
  const fileInputRef = useRef(null);
  const archivosRef = useRef([]);

  const { currentUser, logout, menuItems } = useUsers();
  const idReporte = Number(id);

  useEffect(() => {
    let active = true;

    async function loadReporteForTecnico() {
      if (!Number.isFinite(idReporte) || idReporte <= 0) {
        if (!active) return;
        setReporte(null);
        setErrorMessage("ID de reporte no valido.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setMantenimientoAsignado(null);

      try {
        const data = await getReporteById(idReporte);
        if (!active) return;

        const tecnicoId = Number(
          currentUser?.id_usuario ?? currentUser?.idUsuario ?? currentUser?.id
        );
        const role = String(currentUser?.rol ?? "").trim().toLowerCase();

        setReporte(data ?? null);

        if (role === "tecnico" && Number.isFinite(tecnicoId) && tecnicoId > 0) {
          try {
            const mantenimientos = await getMantenimientosByTecnico(tecnicoId);
            if (!active) return;

            const found = (Array.isArray(mantenimientos) ? mantenimientos : []).find(
              (item) =>
                Number(item?.reporte?.id_reporte ?? item?.reporte?.idReporte) === Number(idReporte)
            );

            if (found) {
              setMantenimientoAsignado(found);
              if (found?.reporte) {
                setReporte((prev) => ({
                  ...(prev ?? {}),
                  id_tecnico_asignado: tecnicoId,
                  estatus: found?.estatus ?? prev?.estatus,
                  activo: found?.reporte?.activo ?? prev?.activo ?? null,
                }));
              }
            }
          } catch {
            // Si falla este fallback, el tecnico puede seguir viendo el reporte.
          }
        }
      } catch (error) {
        const tecnicoId = Number(
          currentUser?.id_usuario ?? currentUser?.idUsuario ?? currentUser?.id
        );
        const role = String(currentUser?.rol ?? "").trim().toLowerCase();

        if (role === "tecnico" && Number.isFinite(tecnicoId) && tecnicoId > 0) {
          try {
            const mantenimientos = await getMantenimientosByTecnico(tecnicoId);
            if (!active) return;

            const found = (Array.isArray(mantenimientos) ? mantenimientos : []).find(
              (item) =>
                Number(item?.reporte?.id_reporte ?? item?.reporte?.idReporte) === Number(idReporte)
            );

            if (found?.reporte) {
              setMantenimientoAsignado(found);
              setReporte({
                ...found.reporte,
                id_mantenimiento: found?.id_mantenimiento ?? found?.idMantenimiento ?? found?.id,
                id_tecnico_asignado: tecnicoId,
                estatus: found?.estatus ?? found?.reporte?.estatus,
                activo: found?.reporte?.activo ?? null,
              });
              return;
            }
          } catch {
            // Si tambien falla, mostramos el error original.
          }
        }

        if (!active) return;
        setReporte(null);
        setErrorMessage(error?.message || "No fue posible cargar el reporte.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadReporteForTecnico();
    return () => {
      active = false;
    };
  }, [idReporte, currentUser?.rol, currentUser?.id_usuario, currentUser?.idUsuario, currentUser?.id]);

  useEffect(() => {
    archivosRef.current = archivos;
  }, [archivos]);

  useEffect(() => {
    return () => {
      archivosRef.current.forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
    };
  }, []);

  useEffect(() => {
    setDiagnostico(String(reporte?.diagnostico ?? "").trim());
    setAccionesRealizadas(String(reporte?.acciones_realizadas ?? "").trim());
  }, [reporte]);

  const activo = useMemo(() => reporte?.activo ?? null, [reporte]);

  const etiquetaBien = useMemo(
    () => activo?.etiqueta_bien ?? reporte?.folio ?? "",
    [activo, reporte]
  );

  const isTecnicoAsignado = useMemo(() => {
    const role = String(currentUser?.rol ?? "").trim().toLowerCase();
    if (role !== "tecnico") return false;

    const currentUserId = Number(
      currentUser?.id_usuario ?? currentUser?.idUsuario ?? currentUser?.id
    );
    const tecnicoIdAsignado = Number(
      reporte?.id_tecnico_asignado ??
        reporte?.tecnico?.id_usuario ??
        reporte?.tecnico?.idUsuario ??
        reporte?.tecnico?.id
    );

    if (!Number.isFinite(tecnicoIdAsignado) || tecnicoIdAsignado <= 0) {
      return true;
    }

    return Number.isFinite(currentUserId) && currentUserId === tecnicoIdAsignado;
  }, [reporte, currentUser?.rol, currentUser?.id_usuario, currentUser?.idUsuario, currentUser?.id]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target?.files ?? []);
    if (files.length === 0) return;
    const newPreviews = files.map((file) => {
      const url = URL.createObjectURL(file);
      return { file, url };
    });
    setArchivos((prev) => [...prev, ...newPreviews]);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveArchivo = (index) => {
    setArchivos((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      const removed = prev[index];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer?.files ?? []).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    if (files.length === 0) return;
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setArchivos((prev) => [...prev, ...newPreviews]);
    setErrorMessage("");
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const mapSubmitError = (error) => {
    const status = Number(error?.status ?? 0);
    if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
    if (status === 403) return "No tienes permisos para cerrar esta reparacion.";
    if (status === 404) return "No se encontro el mantenimiento del reporte.";
    if (status === 400) return error?.message || "Datos invalidos para guardar la reparacion.";
    if (status === 500) return "No fue posible guardar la reparacion. Intenta nuevamente.";
    return error?.message || "No fue posible guardar la reparacion.";
  };

  const resolveMantenimientoId = async () => {
    const candidateId = Number(
      mantenimientoAsignado?.id_mantenimiento ??
        mantenimientoAsignado?.idMantenimiento ??
        mantenimientoAsignado?.id ??
        reporte?.id_mantenimiento ??
        reporte?.idMantenimiento
    );

    if (Number.isFinite(candidateId) && candidateId > 0) {
      return candidateId;
    }

    const tecnicoId = Number(
      currentUser?.id_usuario ?? currentUser?.idUsuario ?? currentUser?.id
    );

    if (!Number.isFinite(tecnicoId) || tecnicoId <= 0) {
      const error = new Error("No se encontro la sesion del tecnico.");
      error.status = 401;
      throw error;
    }

    const mantenimientos = await getMantenimientosByTecnico(tecnicoId);
    const found = (Array.isArray(mantenimientos) ? mantenimientos : []).find(
      (item) => Number(item?.reporte?.id_reporte ?? item?.reporte?.idReporte) === Number(idReporte)
    );

    const foundId = Number(found?.id_mantenimiento ?? found?.idMantenimiento ?? found?.id);
    if (!Number.isFinite(foundId) || foundId <= 0) {
      const error = new Error("No se encontro mantenimiento asignado para este reporte.");
      error.status = 404;
      throw error;
    }

    setMantenimientoAsignado(found);
    return foundId;
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const diagnosticoLimpio = diagnostico.trim();
    const accionesLimpias = accionesRealizadas.trim();

    if (!diagnosticoLimpio) {
      setErrorMessage("El diagnostico es obligatorio.");
      return;
    }

    if (!accionesLimpias) {
      setErrorMessage("Las acciones realizadas son obligatorias.");
      return;
    }

    if (archivos.length === 0) {
      setErrorMessage("Debes subir al menos una evidencia para completar la reparacion.");
      return;
    }

    try {
      const mantenimientoId = await resolveMantenimientoId();
      const fotosBase64 = await Promise.all(archivos.map((item) => fileToBase64(item.file)));
      const archivosAdjuntos = archivos.map((item) => item.file).filter(Boolean);

      await atenderMantenimiento({
        mantenimientoId,
        diagnostico: diagnosticoLimpio,
        accionesRealizadas: accionesLimpias,
        piezasUtilizadas: "",
        fotos: archivosAdjuntos,
      });

      const mantenimientoCerrado = await cerrarMantenimiento({
        mantenimientoId,
        estatusFinal: "REPARADO",
        observaciones: accionesLimpias || diagnosticoLimpio,
      });

      // Mantiene compatibilidad con el flujo local existente.
      updateReporteTecnico(idReporte, {
        diagnostico: diagnosticoLimpio,
        acciones_realizadas: accionesLimpias,
        fotos_trabajo: fotosBase64,
      });
      updateReporteEstatus(idReporte, ESTATUS_REPORTE_DANIO.RESUELTO);

      const idActivo = Number(reporte?.id_activo ?? reporte?.activo?.id_activo);
      if (idActivo) {
        const todosActivos = getStoredActivos();
        const actualizados = todosActivos.map((item) =>
          Number(item?.id_activo) === idActivo
            ? { ...item, estatus: ESTATUS_ACTIVO.RESGUARDADO }
            : item
        );
        saveActivos(actualizados);
      }

      setMantenimientoAsignado((prev) =>
        prev
          ? {
              ...prev,
              estatus: mantenimientoCerrado?.estatus ?? "REPARADO",
            }
          : prev
      );

      setReporte((prev) =>
        prev
          ? {
              ...prev,
              estatus: mantenimientoCerrado?.estatus ?? "REPARADO",
              activo: prev?.activo
                ? { ...prev.activo, estatus: ESTATUS_ACTIVO.RESGUARDADO }
                : prev?.activo,
            }
          : prev
      );

      window.dispatchEvent(new CustomEvent("invtrack-reportes-changed"));
      window.dispatchEvent(new CustomEvent("invtrack-mantenimientos-changed"));
      window.dispatchEvent(new CustomEvent("invtrack-activos-changed"));

      setSuccessMessage("Reparacion guardada correctamente.");
      setTimeout(() => navigate("/mis-reparaciones"), 1200);
    } catch (error) {
      setErrorMessage(mapSubmitError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="inv-page">
        <Container fluid className="inv-content px-3 px-md-4 py-3">
          <Alert variant="info" className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            Cargando reporte...
          </Alert>
        </Container>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="inv-page">
        <Container fluid className="inv-content px-3 px-md-4 py-3">
          {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
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
      <NavbarMenu title="Reporte Tecnico" onMenuClick={() => setOpenSidebar((value) => !value)} />

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

      <Container fluid className="inv-content inv-reporte-tecnico-content px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-reporte-tecnico-back"
          onClick={() => navigate(-1)}
        >
          {"<- Regresar"}
        </Button>

        {errorMessage ? (
          <Alert variant="danger" className="mt-2" dismissible onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        ) : null}
        {successMessage ? <Alert variant="success" className="mt-2">{successMessage}</Alert> : null}

        <Card className="inv-reporte-tecnico-card shadow-sm border-0">
          <Card.Body className="inv-reporte-tecnico-card__body">
            <Row>
              <Col xs={12}>
                <FormInput label="Etiqueta del bien" name="etiqueta" value={etiquetaBien} disabled />
              </Col>
            </Row>

            <FormInput
              label="Diagnostico"
              name="diagnostico"
              value={diagnostico}
              onChange={(event) => setDiagnostico(event.target.value)}
              as="textarea"
              rows={4}
              placeholder="Describe los detalles del Diagnostico"
            />

            <FormInput
              label="Acciones realizadas"
              name="accionesRealizadas"
              value={accionesRealizadas}
              onChange={(event) => setAccionesRealizadas(event.target.value)}
              as="textarea"
              rows={4}
              placeholder="Describe las Acciones realizadas"
            />

            <div className="inv-reporte-tecnico-upload mb-3">
              <label className="form-label inv-reporte-tecnico-upload__label">
                Subir Imagenes o videos
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
                <span>Arrastra o selecciona una imagen o video</span>
              </div>

              {archivos.length > 0 ? (
                <div className="inv-reporte-tecnico-thumbnails">
                  {archivos.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="inv-reporte-tecnico-thumb"
                      onClick={() => handleRemoveArchivo(index)}
                    >
                      {item.file?.type?.startsWith("video/") ? (
                        <video src={item.url} className="inv-reporte-tecnico-thumb-media" muted />
                      ) : (
                        <img
                          src={item.url}
                          alt={`Preview ${index + 1}`}
                          className="inv-reporte-tecnico-thumb-media"
                        />
                      )}
                      <span className="inv-reporte-tecnico-thumb-remove">x</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="inv-reporte-tecnico-actions">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Subir reparacion
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
