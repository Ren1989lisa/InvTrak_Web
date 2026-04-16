import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Row, Col } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import PaginationComponent from "../Components/PaginationComponent";
import FiltersModal from "../Components/FiltersModal";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { getActivos } from "../services/activoService";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/asignacion-bien.css";

function buildExportRows(activos) {
  return (Array.isArray(activos) ? activos : []).map((activo) => {
    const producto = activo?.producto ?? {};
    const ubicacion = activo?.ubicacion ?? {};
    return {
      id_activo: activo?.id_activo ?? "",
      etiqueta_bien: activo?.etiqueta_bien ?? "",
      numero_serie: activo?.numero_serie ?? "",
      producto: producto?.completo ?? "",
      descripcion: activo?.descripcion ?? "",
      propietario: activo?.propietario ?? "",
      estatus: activo?.estatus ?? "",
      costo: activo?.costo ?? "",
      fecha_alta: activo?.fecha_alta ?? "",
      ubicacion: ubicacion?.completa ?? "",
    };
  });
}

function toNumericId(activo) {
  const raw = activo?.id_activo ?? activo?.idActivo ?? activo?.id;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTimestamp(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareActivosByNewest(a, b) {
  const idA = toNumericId(a);
  const idB = toNumericId(b);
  if (idA != null && idB != null && idA !== idB) {
    return idB - idA;
  }

  const fechaA = toTimestamp(a?.fecha_alta ?? a?.fechaAlta);
  const fechaB = toTimestamp(b?.fecha_alta ?? b?.fechaAlta);
  if (fechaA != null && fechaB != null && fechaA !== fechaB) {
    return fechaB - fechaA;
  }

  return String(b?.etiqueta_bien ?? "").localeCompare(String(a?.etiqueta_bien ?? ""));
}

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [activos, setActivos] = useState(() => getStoredActivos());
  const [isLoadingActivos, setIsLoadingActivos] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [exportFeedback, setExportFeedback] = useState(null);
  const [pageFeedback, setPageFeedback] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, menuItems } = useUsers();
  const query = search.trim().toLowerCase();
  const isAdmin = (currentUser?.rol ?? "").toString().toLowerCase() === "admin";

  useEffect(() => {
    let active = true;

    async function loadActivos() {
      setIsLoadingActivos(true);
      setLoadError("");
      try {
        const fromService = await getActivos();
        if (!active) return;
        setActivos(fromService);
        saveActivos(fromService);
      } catch {
        if (!active) return;
        setLoadError("No se pudo cargar el listado desde el servicio. Se muestran datos locales.");
      } finally {
        if (active) setIsLoadingActivos(false);
      }
    }

    loadActivos();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const toastMessage = location.state?.toastMessage;
    if (!toastMessage) return;

    setPageFeedback({
      variant: "success",
      message: toastMessage,
    });

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const ubicaciones = useMemo(() => {
    const values = new Set();
    activos.forEach((a) => {
      const text = a?.ubicacion?.completa ??
        [a?.ubicacion?.campus, a?.ubicacion?.edificio, a?.ubicacion?.aula]
          .filter(Boolean)
          .join(" ");
      if (text) values.add(text);
    });
    return Array.from(values);
  }, [activos]);

  const activosFiltrados = useMemo(() => {
    const activosOrdenados = [...(Array.isArray(activos) ? activos : [])].sort(compareActivosByNewest);

    return activosOrdenados.filter((a) => {
      const codigo = (a?.etiqueta_bien ?? "").toString().toLowerCase();
      const productoCompleto = (a?.producto?.completo ?? "").toString().toLowerCase();
      const tipoActivo = (a?.producto?.tipo_activo ?? a?.tipo_activo ?? "")
        .toString()
        .toLowerCase();
      const ubicacionTexto = a?.ubicacion?.completa ??
        [a?.ubicacion?.campus, a?.ubicacion?.edificio, a?.ubicacion?.aula]
          .filter(Boolean)
          .join(" ");
      const fechaAlta = a?.fecha_alta ? new Date(a.fecha_alta) : null;
      const costo = Number(a?.costo ?? 0);

      if (query && !codigo.includes(query) && !tipoActivo.includes(query) && !productoCompleto.includes(query)) return false;

      if (appliedFilters) {
        const { ubicacion: fUbicacion, fechaDesde, fechaHasta, precioMin, precioMax } =
          appliedFilters;

        if (fUbicacion && ubicacionTexto !== fUbicacion) return false;
        if (fechaDesde && fechaAlta && fechaAlta < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaAlta && fechaAlta > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }

      return true;
    });
  }, [activos, query, appliedFilters]);

  const handleExportExcel = () => {
    setExportFeedback(null);
    try {
      if (!activos.length) {
        setExportFeedback({
          variant: "warning",
          message: "No hay activos registrados para exportar.",
        });
        return;
      }

      const rows = buildExportRows(activos);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bienes");

      const now = new Date();
      const datePart = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
      const fileName = `bienes_registrados_${datePart}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportFeedback({
        variant: "success",
        message: `Archivo exportado correctamente: ${fileName}`,
      });
    } catch {
      setExportFeedback({
        variant: "danger",
        message: "No fue posible generar el archivo Excel.",
      });
    }
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Activos registrados"
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

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          onImport={handleExportExcel}
          onFilters={() => setShowFilters(true)}
          placeholder="Buscar por código o tipo de activo"
          firstActionLabel="Exportar a Excel"
        />

        {exportFeedback ? (
          <Alert variant={exportFeedback.variant} className="mt-3 mb-0">
            {exportFeedback.message}
          </Alert>
        ) : null}
        {pageFeedback ? (
          <Alert
            variant={pageFeedback.variant}
            className="mt-3 mb-0"
            dismissible
            onClose={() => setPageFeedback(null)}
          >
            {pageFeedback.message}
          </Alert>
        ) : null}
        {loadError ? (
          <Alert variant="warning" className="mt-3 mb-0">
            {loadError}
          </Alert>
        ) : null}
        {isLoadingActivos ? (
          <Alert variant="info" className="mt-3 mb-0">
            Cargando bienes registrados...
          </Alert>
        ) : null}

        <FiltersModal
          show={showFilters}
          onHide={() => setShowFilters(false)}
          onApply={setAppliedFilters}
          onClear={() => setAppliedFilters(null)}
          ubicaciones={ubicaciones}
        />

        <Row className="g-4 mt-2">
          {activosFiltrados.map((activo) => (
            <Col md={4} key={activo.id_activo}>
              <AssetCard
                activo={activo}
                canEdit={isAdmin}
                onEdit={(item) => navigate(`/registro-bien/${item?.id_activo}/editar`)}
              />
            </Col>
          ))}
        </Row>
        {!isLoadingActivos && activosFiltrados.length === 0 ? (
          <Alert variant="secondary" className="mt-3 mb-0">
            No hay activos registrados para mostrar.
          </Alert>
        ) : null}

        <PaginationComponent />
      </Container>
    </div>
  );
}
