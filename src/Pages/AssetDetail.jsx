import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import AssetDetailCard from "../Components/AssetDetailCard";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { getActivos } from "../services/activoService";
import { solicitarDevolucionPorActivo } from "../services/resguardoService";
import "../Style/bienes-registrados.css";
import "../Style/asset-detail.css";
import "../Style/sidebar.css";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const { currentUser, logout, menuItems } = useUsers();
  const [activos, setActivos] = useState(() => getStoredActivos());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [returnMessage, setReturnMessage] = useState("");
  const [isRequestingReturn, setIsRequestingReturn] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadFromService() {
      setIsLoading(true);
      setLoadError("");
      try {
        const list = await getActivos();
        if (!active) return;
        setActivos(list);
        saveActivos(list);
      } catch {
        if (!active) return;
        setLoadError("No se pudo cargar el detalle desde el servicio. Se muestran datos locales.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadFromService();
    return () => {
      active = false;
    };
  }, []);

  const activo = useMemo(
    () =>
      (Array.isArray(activos) ? activos : []).find(
        (a) =>
          String(a?.id_activo ?? a?.id ?? a?.idActivo ?? "") === String(id ?? "")
      ) ?? null,
    [activos, id]
  );

  const isUsuario = useMemo(() => {
    const rawRole =
      typeof currentUser?.rol === "object"
        ? currentUser?.rol?.nombre ?? currentUser?.rol?.name ?? ""
        : currentUser?.rol;
    return (rawRole ?? "").toString().trim().toLowerCase() === "usuario";
  }, [currentUser?.rol]);

  const canRequestReturn = useMemo(() => {
    const estatus = (activo?.estatus ?? "").toString().trim().toUpperCase();
    return isUsuario && estatus === "RESGUARDADO";
  }, [activo?.estatus, isUsuario]);

  async function handleReturnRequest(selectedActivo) {
    if (!selectedActivo) return;

    const etiqueta = selectedActivo?.etiqueta_bien ?? "el activo";
    const selectedId = Number(
      selectedActivo?.id_activo ?? selectedActivo?.idActivo ?? selectedActivo?.id
    );
    setReturnMessage("");
    setLoadError("");
    setIsRequestingReturn(true);

    try {
      await solicitarDevolucionPorActivo(
        selectedActivo?.id_activo,
        "Solicitud de devolucion desde detalle de activo."
      );

      if (Number.isFinite(selectedId)) {
        setActivos((prev) => {
          const next = (Array.isArray(prev) ? prev : []).map((item) => {
            const itemId = Number(item?.id_activo ?? item?.idActivo ?? item?.id);
            if (itemId !== selectedId) return item;
            return {
              ...item,
              estatus: "DEVOLUCION",
            };
          });
          saveActivos(next);
          return next;
        });
      }
      setReturnMessage(`Solicitud de devolución enviada para ${etiqueta}.`);
      try {
        const refreshed = await getActivos();
        setActivos(refreshed);
        saveActivos(refreshed);
      } catch {
        // La solicitud ya se envio; si falla el refresco dejamos los cambios locales.
      }
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(error?.message || "No fue posible solicitar la devolucion del activo.");
    } finally {
      setIsRequestingReturn(false);
    }
  }

  return (
    <div className="inv-page inv-page--detail">
      <NavbarMenu
        title="Detalle del activo"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={menuItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          if (currentUser) {
            navigate(`/perfil/${currentUser.id_usuario}`);
          } else {
            navigate("/perfil");
          }
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

        {loadError ? (
          <Alert variant="warning" className="mt-2 mb-0">
            {loadError}
          </Alert>
        ) : null}
        {isLoading ? (
          <Alert variant="info" className="mt-2 mb-0">
            Cargando detalle del activo...
          </Alert>
        ) : null}
        {isRequestingReturn ? (
          <Alert variant="info" className="mt-2 mb-0">
            Enviando solicitud de devolucion...
          </Alert>
        ) : null}
        {returnMessage ? (
          <Alert variant="success" className="mt-2 mb-0">
            {returnMessage}
          </Alert>
        ) : null}

        {activo ? (
          <Row className="justify-content-center mt-3">
            <Col xs={12} md={10} lg={8}>
              <AssetDetailCard
                activo={activo}
                showReturnButton={canRequestReturn}
                onReturnRequest={handleReturnRequest}
              />
            </Col>
          </Row>
        ) : (
          <div className="inv-detail-not-found">
            <p>Activo no encontrado.</p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/bienes-registrados")}
            >
              Volver a bienes registrados
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
