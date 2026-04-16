import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import AssetReportSelectableCard from "../Components/AssetReportSelectableCard";
import UserSelectableCard from "../Components/UserSelectableCard";
import SelectedReportAssetCard from "../Components/SelectedReportAssetCard";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import {
  asignarReporteMantenimiento,
  getReportesAbiertosMantenimiento,
} from "../services/mantenimientoService";
import { getTecnicos } from "../services/userService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/asignacion-bien.css";
import "../Style/asignacion-reporte.css";

const PRIORIDAD_IDS_DEFAULT = {
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
};

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toAssignablePriorityId(reporte) {
  const explicit = Number(reporte?.prioridad_id ?? reporte?.prioridadId);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const byName = String(reporte?.prioridad_nombre ?? reporte?.prioridad ?? "")
    .trim()
    .toUpperCase();
  const inferred = Number(PRIORIDAD_IDS_DEFAULT[byName]);
  if (Number.isFinite(inferred) && inferred > 0) return inferred;

  return PRIORIDAD_IDS_DEFAULT.MEDIA;
}

function mapAssignError(error) {
  const status = Number(error?.status ?? 0);
  const message = String(error?.message ?? "").trim();

  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 403) return "No tienes permisos para asignar reportes.";
  if (status === 404) return "No se encontro el reporte o el tecnico.";
  if (status === 400) return message || "Datos invalidos para asignar.";
  if (status === 500) return message || "No fue posible asignar el reporte.";
  return message || "No fue posible completar la asignacion.";
}

export default function AsignacionReporte() {
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("todo");
  const [showAssetFilters, setShowAssetFilters] = useState(false);
  const [appliedAssetFilters, setAppliedAssetFilters] = useState(null);
  const [tecnicoSearch, setTecnicoSearch] = useState("");
  const [selectedReporteId, setSelectedReporteId] = useState(null);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportesAbiertos, setReportesAbiertos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [reportes, backendTecnicos] = await Promise.all([
        getReportesAbiertosMantenimiento(),
        getTecnicos(),
      ]);
      setReportesAbiertos(Array.isArray(reportes) ? reportes : []);
      setTecnicos(Array.isArray(backendTecnicos) ? backendTecnicos : []);
    } catch (error) {
      setErrorMessage(mapAssignError(error));
      setReportesAbiertos([]);
      setTecnicos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bienesReportados = useMemo(() => {
    const sorted = [...reportesAbiertos].sort((a, b) => {
      const dateA = parseDate(a?.fecha_reporte);
      const dateB = parseDate(b?.fecha_reporte);
      if (dateA && dateB) return dateB.getTime() - dateA.getTime();
      return Number(b?.id_reporte ?? 0) - Number(a?.id_reporte ?? 0);
    });

    const uniqueByActivo = new Map();
    sorted.forEach((reporte) => {
      const asset = reporte?.activo;
      const assetId = Number(asset?.id_activo ?? asset?.idActivo);
      if (!Number.isFinite(assetId)) return;
      if (uniqueByActivo.has(assetId)) return;
      uniqueByActivo.set(assetId, { asset, reporte });
    });

    return Array.from(uniqueByActivo.values());
  }, [reportesAbiertos]);

  const filteredAssets = useMemo(() => {
    const query = normalize(assetSearch);
    return bienesReportados.filter(({ asset }) => {
      const tipo = normalize(asset?.producto?.tipo_activo ?? asset?.tipo_activo);
      const etiqueta = normalize(asset?.etiqueta_bien);
      const descripcion = normalize(asset?.descripcion);
      const ubicacion = asset?.ubicacion ?? {};
      const ubicacionTexto = normalize(
        [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula].filter(Boolean).join(" ")
      );
      const fechaAlta = asset?.fecha_alta ? new Date(asset.fecha_alta) : null;
      const costo = Number(asset?.costo ?? 0);

      const matchesQuery =
        !query || tipo.includes(query) || etiqueta.includes(query) || descripcion.includes(query);
      const matchesType = assetTypeFilter === "todo" || tipo === normalize(assetTypeFilter);
      if (!matchesQuery || !matchesType) return false;

      if (appliedAssetFilters) {
        const { ubicacion: fUbicacion, fechaDesde, fechaHasta, precioMin, precioMax } =
          appliedAssetFilters;
        if (fUbicacion && ubicacionTexto !== normalize(fUbicacion)) return false;
        if (fechaDesde && fechaAlta && fechaAlta < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaAlta && fechaAlta > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }
      return true;
    });
  }, [bienesReportados, assetSearch, assetTypeFilter, appliedAssetFilters]);

  const filteredTecnicos = useMemo(() => {
    const query = normalize(tecnicoSearch);
    return tecnicos.filter((user) => {
      const name = normalize(user?.nombre ?? user?.nombre_completo);
      const employeeNumber = normalize(user?.numero_empleado);
      return !query || name.includes(query) || employeeNumber.includes(query);
    });
  }, [tecnicos, tecnicoSearch]);

  const filterUbicaciones = useMemo(() => {
    const values = new Map();
    bienesReportados.forEach(({ asset }) => {
      const campus = String(asset?.ubicacion?.campus ?? "").trim();
      const edificio = String(asset?.ubicacion?.edificio ?? "").trim();
      const aula = String(asset?.ubicacion?.aula ?? "").trim();
      const completa = String(
        asset?.ubicacion?.completa ?? [campus, edificio, aula].filter(Boolean).join(" ")
      )
        .trim()
        .replace(/\s+/g, " ");

      if (!completa) return;

      const key = normalize(completa);
      if (values.has(key)) return;
      values.set(key, { campus, edificio, aula, completa });
    });
    return Array.from(values.values());
  }, [bienesReportados]);

  const selectedItem = useMemo(() => {
    return bienesReportados.find(
      ({ reporte }) => Number(reporte?.id_reporte) === Number(selectedReporteId)
    );
  }, [bienesReportados, selectedReporteId]);

  const selectedAsset = selectedItem?.asset ?? null;
  const selectedReporte = selectedItem?.reporte ?? null;
  const selectedTecnico = useMemo(
    () =>
      tecnicos.find((user) => Number(user?.id_usuario) === Number(selectedTecnicoId)) ?? null,
    [tecnicos, selectedTecnicoId]
  );

  const handleSelectAsset = ({ reporte }) => {
    setSelectedReporteId(reporte?.id_reporte ?? null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleAssign = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedReporte) {
      setErrorMessage("Selecciona un bien reportado de la lista.");
      return;
    }

    if (!selectedTecnico) {
      setErrorMessage("Selecciona un tecnico para asignar.");
      return;
    }

    setIsSubmitting(true);
    try {
      await asignarReporteMantenimiento({
        reporteId: selectedReporte.id_reporte,
        tecnicoId: selectedTecnico.id_usuario,
        prioridadId: toAssignablePriorityId(selectedReporte),
        tipo: "CORRECTIVO",
      });

      setSelectedReporteId(null);
      setSelectedTecnicoId(null);
      setSuccessMessage("Reporte asignado al tecnico correctamente.");
      await loadData();
      window.dispatchEvent(new CustomEvent("invtrack-reportes-changed"));
      window.dispatchEvent(new CustomEvent("invtrack-activos-changed"));
    } catch (error) {
      setErrorMessage(mapAssignError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedReporteId(null);
    setSelectedTecnicoId(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="inv-page">
      <NavbarMenu title="Asignacion del Reporte" onMenuClick={() => setOpenSidebar((v) => !v)} />

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

      <Container fluid className="inv-content px-3 px-md-3 py-3 inv-assign-layout">
        <PrimaryButton
          variant="light"
          label="<- Regresar"
          className="inv-assign-report__back mb-2"
          onClick={() => navigate("/bienes-registrados")}
        />

        {isLoading ? (
          <Alert variant="info" className="d-flex align-items-center gap-2 mb-3">
            <Spinner animation="border" size="sm" />
            Cargando bienes reportados y tecnicos...
          </Alert>
        ) : null}

        {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
        {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

        <Row className="g-3">
          <Col lg={4}>
            <section className="inv-assign-panel">
              <div className="inv-assign-panel__heading">
                <h5 className="mb-0">Bienes Reportados</h5>
                <span>{filteredAssets.length} activos</span>
              </div>

              <Form.Control
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Buscar por etiqueta o descripcion"
                className="inv-assign-input mb-2"
              />

              <div className="inv-assign-filters">
                <PrimaryButton
                  variant="light"
                  label="Filtrar"
                  className="inv-assign-filter-btn"
                  onClick={() => setShowAssetFilters(true)}
                />
                <Form.Select
                  className="inv-assign-select"
                  value={assetTypeFilter}
                  onChange={(e) => setAssetTypeFilter(e.target.value)}
                >
                  <option value="todo">Tipo: Todo</option>
                  <option value="laptop">Laptop</option>
                  <option value="monitor">Monitor</option>
                  <option value="mouse">Mouse</option>
                  <option value="teclado">Teclado</option>
                </Form.Select>
              </div>

              <div className="inv-assign-assets-list">
                {filteredAssets.map(({ asset, reporte }) => (
                  <AssetReportSelectableCard
                    key={`${asset?.id_activo}-${reporte?.id_reporte}`}
                    asset={asset}
                    reporte={reporte}
                    selected={Number(selectedReporteId) === Number(reporte?.id_reporte)}
                    onSelect={handleSelectAsset}
                  />
                ))}
                {!filteredAssets.length ? (
                  <p className="text-muted mb-0">No hay bienes reportados con ese filtro.</p>
                ) : null}
              </div>
            </section>
          </Col>

          <Col lg={8}>
            <section className="inv-assign-panel">
              <h4 className="inv-assign-title mb-1">Detalles de Asignacion</h4>
              <p className="inv-assign-subtitle">
                Selecciona un bien reportado y un tecnico para asignarlo.
              </p>

              <div className="mb-3">
                <label className="inv-assign-label">Activo Seleccionado</label>
                {selectedAsset ? (
                  <SelectedReportAssetCard asset={selectedAsset} />
                ) : (
                  <div className="inv-assign-empty">
                    Selecciona un bien reportado de la lista izquierda.
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="inv-assign-label">Buscar Tecnico</label>
                <Form.Control
                  value={tecnicoSearch}
                  onChange={(e) => setTecnicoSearch(e.target.value)}
                  placeholder="Ingresa el nombre del tecnico"
                  className="inv-assign-input"
                />
              </div>

              <label className="inv-assign-label mb-2">Tecnicos encontrados</label>
              <div className="inv-assign-users-list">
                {filteredTecnicos.map((user) => (
                  <UserSelectableCard
                    key={user.id_usuario}
                    user={user}
                    selected={Number(selectedTecnicoId) === Number(user.id_usuario)}
                    onSelect={(item) => setSelectedTecnicoId(item?.id_usuario)}
                  />
                ))}
                {!filteredTecnicos.length ? (
                  <p className="text-muted mb-0">No hay tecnicos con ese filtro.</p>
                ) : null}
              </div>

              <div className="inv-assign-actions">
                <PrimaryButton
                  variant="light"
                  label="Cancelar"
                  className="inv-assign-btn inv-assign-btn--cancel"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                />
                <PrimaryButton
                  variant="primary"
                  label={isSubmitting ? "Asignando..." : "Asignar Reporte"}
                  className="inv-assign-btn inv-assign-btn--save"
                  onClick={handleAssign}
                  disabled={isSubmitting}
                />
              </div>
            </section>
          </Col>
        </Row>
      </Container>

      <FiltersModal
        show={showAssetFilters}
        onHide={() => setShowAssetFilters(false)}
        onApply={setAppliedAssetFilters}
        onClear={() => setAppliedAssetFilters(null)}
        ubicaciones={filterUbicaciones}
      />
    </div>
  );
}
