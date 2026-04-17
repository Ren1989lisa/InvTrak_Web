import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Row, Col, Spinner, Toast, ToastContainer } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import PaginationComponent from "../Components/PaginationComponent";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import { usePendientesResguardo } from "../hooks/usePendientesResguardo";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function isUserRole(roleValue) {
  const candidates = [roleValue]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => {
      if (value && typeof value === "object") {
        return value.nombre ?? value.name ?? "";
      }
      return value ?? "";
    })
    .join(" ")
    .toLowerCase();

  return candidates.includes("usuario") || candidates.includes("role_user");
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function MisBienes() {
  const ITEMS_PER_PAGE = 12;
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();
  const { pendientesResguardo, bienesConfirmados, isLoading, error, refresh } =
    usePendientesResguardo(currentUser);

  const query = search.trim().toLowerCase();
  const isUsuario = isUserRole(currentUser?.rol ?? currentUser?.roles);

  const ubicaciones = useMemo(() => {
    const values = new Map();

    bienesConfirmados.forEach((activo) => {
      const campus = String(activo?.ubicacion?.campus ?? "").trim();
      const edificio = String(activo?.ubicacion?.edificio ?? "").trim();
      const aula = String(activo?.ubicacion?.aula ?? "").trim();
      const completa = String(
        activo?.ubicacion?.completa ?? [campus, edificio, aula].filter(Boolean).join(" ")
      )
        .trim()
        .replace(/\s+/g, " ");

      if (!completa) return;

      const key = normalize(completa);
      if (values.has(key)) return;
      values.set(key, {
        campus,
        edificio,
        aula,
        completa,
      });
    });

    return Array.from(values.values());
  }, [bienesConfirmados]);

  const estatusOptions = useMemo(() => {
    const unique = new Map();
    bienesConfirmados.forEach((a) => {
      const val = (a?.estatus ?? "").toString().trim();
      if (!val || unique.has(val)) return;
      unique.set(val, { value: val, label: val });
    });
    return Array.from(unique.values());
  }, [bienesConfirmados]);

  const productoOptions = useMemo(() => {
    const unique = new Map();
    bienesConfirmados.forEach((a) => {
      const val = (a?.producto?.nombre ?? a?.producto?.tipo_activo ?? a?.tipo_activo ?? "").toString().trim();
      if (!val || unique.has(val.toLowerCase())) return;
      unique.set(val.toLowerCase(), { value: val, label: val });
    });
    return Array.from(unique.values());
  }, [bienesConfirmados]);

  const activosFiltrados = useMemo(() => {
    return bienesConfirmados.filter((activo) => {
      const codigo = normalize(activo?.etiqueta_bien);
      const tipo = normalize(
        activo?.producto?.completo ?? activo?.producto?.tipo_activo ?? activo?.tipo_activo
      );
      const descripcion = normalize(activo?.descripcion);
      const ubicacion = normalize(activo?.ubicacion?.completa);
      const fecha = toDate(activo?.fecha_asignacion ?? activo?.fecha_alta ?? activo?.fechaAlta);
      const costo = Number(activo?.costo ?? 0);

      const matchesSearch =
        !query ||
        codigo.includes(query) ||
        tipo.includes(query) ||
        descripcion.includes(query) ||
        ubicacion.includes(query);

      if (!matchesSearch) return false;

      if (appliedFilters) {
        const { ubicacion: fUbicacion, estatus: fEstatus, producto: fProducto, fechaDesde, fechaHasta, precioMin, precioMax } =
          appliedFilters;

        if (fUbicacion && normalize(activo?.ubicacion?.completa) !== normalize(fUbicacion)) return false;
        if (fEstatus && normalize(activo?.estatus ?? "") !== normalize(fEstatus)) return false;
        if (fProducto) {
          const nombreProd = normalize(activo?.producto?.nombre ?? activo?.producto?.tipo_activo ?? activo?.tipo_activo ?? "");
          if (!nombreProd.includes(normalize(fProducto))) return false;
        }
        if (fechaDesde && fecha && fecha < new Date(fechaDesde)) return false;
        if (fechaHasta && fecha && fecha > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }

      return true;
    });
  }, [bienesConfirmados, query, appliedFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(activosFiltrados.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activosPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [activosFiltrados, currentPage]);

  const notificationItems = useMemo(() => {
    if (!isUsuario) return null;

    return pendientesResguardo.map((item) => ({
      ...item,
      onSubirQR: () => {
        const targetId = item?.activoId ?? item?.id_activo ?? item?.activo?.id_activo;
        if (targetId == null) return;
        navigate(`/confirmar-resguardo/${targetId}`);
      },
    }));
  }, [isUsuario, navigate, pendientesResguardo]);

  const hasPending = isUsuario && pendientesResguardo.length > 0;

  useEffect(() => {
    if (!location.state?.resguardoConfirmedToast) return;
    setShowSuccessToast(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Mis activos"
        onMenuClick={() => setOpenSidebar((v) => !v)}
        notificationItems={notificationItems}
        onNotificationsOpen={refresh}
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

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <ToastContainer position="top-end" className="p-3">
          <Toast
            bg="success"
            onClose={() => setShowSuccessToast(false)}
            show={showSuccessToast}
            delay={2600}
            autohide
          >
            <Toast.Body className="text-white fw-semibold">
              Resguardo confirmado correctamente
            </Toast.Body>
          </Toast>
        </ToastContainer>

        {error ? (
          <Alert
            variant="danger"
            className="d-flex align-items-center justify-content-between gap-3"
            dismissible
            onClose={refresh}
          >
            <span>{error}</span>
            <PrimaryButton variant="outline-danger" label="Reintentar" onClick={refresh} />
          </Alert>
        ) : null}

        {isLoading ? (
          <Alert variant="info" className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Cargando tus resguardos...</span>
          </Alert>
        ) : null}

        {hasPending ? (
          <Alert variant="warning" className="mb-3">
            Tienes activos pendientes por confirmar
          </Alert>
        ) : null}

        <SearchBar
          value={search}
          onChange={setSearch}
          onFilters={() => setShowFilters(true)}
          placeholder="Buscar por codigo, producto, descripcion o ubicacion"
        />

        <FiltersModal
          show={showFilters}
          onHide={() => setShowFilters(false)}
          onApply={setAppliedFilters}
          onClear={() => setAppliedFilters(null)}
          ubicaciones={ubicaciones}
          estatusOptions={estatusOptions}
          productoOptions={productoOptions}
        />

        {!isLoading && bienesConfirmados.length === 0 ? (
          <Alert variant="info" className="mt-3">
            {pendientesResguardo.length > 0
              ? "Tienes activos pendientes por confirmar. Usa la notificacion para subir el QR y completar el resguardo."
              : "No tienes activos confirmados. Si te asignaron un activo, confirma el resguardo desde las notificaciones."}
          </Alert>
        ) : null}

        {!isLoading && bienesConfirmados.length > 0 && activosFiltrados.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No hay activos confirmados con ese filtro.
          </Alert>
        ) : null}

        {!isLoading && activosFiltrados.length > 0 ? (
          <>
            <Row className="g-4 mt-2">
              {activosPaginados.map((activo, index) => (
                <Col md={4} key={`${activo.id_activo ?? "act"}-${activo.resguardo_id ?? index}`}>
                  <AssetCard activo={activo} />
                </Col>
              ))}
            </Row>
            <PaginationComponent
              currentPage={currentPage}
              totalItems={activosFiltrados.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        ) : null}
      </Container>
    </div>
  );
}
