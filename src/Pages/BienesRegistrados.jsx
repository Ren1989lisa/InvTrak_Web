import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import DeleteActivoModal from "../Components/DeleteActivoModal";
import PaginationComponent from "../Components/PaginationComponent";
import FiltersModal from "../Components/FiltersModal";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { getActivos, deleteActivo } from "../services/activoService";
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

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [activos, setActivos] = useState(() => getStoredActivos());
  const [isLoadingActivos, setIsLoadingActivos] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [exportFeedback, setExportFeedback] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activoToDelete, setActivoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(null);
  const navigate = useNavigate();
  const { currentUser, logout, menuItems, isAdmin } = useUsers();
  const query = search.trim().toLowerCase();

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
    return activos.filter((a) => {
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
          message: "No hay bienes registrados para exportar.",
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

  const handleOpenDelete = (activo) => {
    setDeleteFeedback(null);
    setActivoToDelete(activo);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setActivoToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activoToDelete) return;
    setIsDeleting(true);
    setDeleteFeedback(null);
    try {
      await deleteActivo(activoToDelete.id_activo);
      setActivos((prev) => {
        const next = prev.filter(
          (a) => Number(a?.id_activo) !== Number(activoToDelete.id_activo)
        );
        saveActivos(next);
        return next;
      });
      const etiqueta = activoToDelete?.etiqueta_bien ?? "";
      setDeleteFeedback({
        variant: "success",
        message: etiqueta
          ? `El bien ${etiqueta} se eliminó del inventario.`
          : "El bien se eliminó del inventario.",
      });
      setShowDeleteModal(false);
      setActivoToDelete(null);
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setDeleteFeedback({
        variant: "danger",
        message: error?.message || "No fue posible eliminar el bien. Intenta de nuevo.",
      });
      setShowDeleteModal(false);
      setActivoToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Bienes registrados"
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
        {deleteFeedback ? (
          <Alert variant={deleteFeedback.variant} className="mt-3 mb-0" dismissible onClose={() => setDeleteFeedback(null)}>
            {deleteFeedback.message}
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

        <DeleteActivoModal
          show={showDeleteModal}
          onHide={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          activo={activoToDelete}
          isDeleting={isDeleting}
        />

        <Row className="g-4 mt-2">
          {activosFiltrados.map((activo) => (
            <Col md={4} key={activo.id_activo}>
              <AssetCard
                activo={activo}
                showDeleteButton={isAdmin}
                onDeleteClick={() => handleOpenDelete(activo)}
              />
            </Col>
          ))}
        </Row>
        {!isLoadingActivos && activosFiltrados.length === 0 ? (
          <Alert variant="secondary" className="mt-3 mb-0">
            No hay bienes registrados para mostrar.
          </Alert>
        ) : null}

        <PaginationComponent />
      </Container>
    </div>
  );
}
