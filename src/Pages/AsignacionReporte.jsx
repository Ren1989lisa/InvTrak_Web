import { useMemo, useState } from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import AssetReportSelectableCard from "../Components/AssetReportSelectableCard";
import UserSelectableCard from "../Components/UserSelectableCard";
import SelectedReportAssetCard from "../Components/SelectedReportAssetCard";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos } from "../activosStorage";
import { getStoredReportes, assignTecnicoToReporte } from "../reportesStorage";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/asignacion-bien.css";
import "../Style/asignacion-reporte.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

export default function AsignacionReporte() {
  const navigate = useNavigate();
  const { users, currentUser, setCurrentUserId, menuItems } = useUsers();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("todo");
  const [showAssetFilters, setShowAssetFilters] = useState(false);
  const [appliedAssetFilters, setAppliedAssetFilters] = useState(null);
  const [tecnicoSearch, setTecnicoSearch] = useState("");
  const [tecnicoTypeFilter, setTecnicoTypeFilter] = useState("todo");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportes, setReportes] = useState(() => getStoredReportes());
  const activos = useMemo(() => getStoredActivos(), []);

  const reportesPendientes = useMemo(() => {
    return reportes.filter(
      (r) => !r?.id_tecnico_asignado || normalize(r?.estatus) === "pendiente"
    );
  }, [reportes]);

  const bienesReportados = useMemo(() => {
    const result = [];
    const seen = new Set();
    for (const rep of reportesPendientes) {
      const idAct = Number(rep?.id_activo);
      if (seen.has(idAct)) continue;
      const activo = activos.find((a) => Number(a?.id_activo) === idAct);
      if (!activo) continue;
      seen.add(idAct);
      result.push({ asset: activo, reporte: rep });
    }
    return result;
  }, [activos, reportesPendientes]);

  const filteredAssets = useMemo(() => {
    const query = normalize(assetSearch);
    return bienesReportados.filter(({ asset }) => {
      const tipo = normalize(asset?.producto?.tipo_activo ?? asset?.tipo_activo);
      const etiqueta = normalize(asset?.codigo_interno);
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
        const {
          ubicacion: fUbicacion,
          fechaDesde,
          fechaHasta,
          precioMin,
          precioMax,
        } = appliedAssetFilters;
        if (fUbicacion && ubicacionTexto !== normalize(fUbicacion)) return false;
        if (fechaDesde && fechaAlta && fechaAlta < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaAlta && fechaAlta > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }
      return true;
    });
  }, [bienesReportados, assetSearch, assetTypeFilter, appliedAssetFilters]);

  const tecnicos = useMemo(() => {
    return (Array.isArray(users) ? users : []).filter(
      (u) => normalize(u?.rol) === "tecnico"
    );
  }, [users]);

  const filteredTecnicos = useMemo(() => {
    const query = normalize(tecnicoSearch);
    return tecnicos.filter((user) => {
      const name = normalize(user?.nombre_completo);
      const employeeNumber = normalize(user?.numero_empleado);
      const matchesQuery = !query || name.includes(query) || employeeNumber.includes(query);
      const matchesType =
        tecnicoTypeFilter === "todo" || normalize(user?.rol) === normalize(tecnicoTypeFilter);
      return matchesQuery && matchesType;
    });
  }, [tecnicos, tecnicoSearch, tecnicoTypeFilter]);

  const filterUbicaciones = useMemo(() => {
    const values = new Set();
    bienesReportados.forEach(({ asset }) => {
      const u = asset?.ubicacion;
      const text = [u?.campus, u?.edificio, u?.aula].filter(Boolean).join(" ");
      if (text) values.add(text);
    });
    return Array.from(values);
  }, [bienesReportados]);

  const selectedItem = useMemo(() => {
    return bienesReportados.find(
      ({ asset }) => Number(asset?.id_activo) === Number(selectedAssetId)
    );
  }, [bienesReportados, selectedAssetId]);

  const selectedAsset = selectedItem?.asset ?? null;
  const selectedReporte = selectedItem?.reporte ?? null;

  const selectedTecnico = useMemo(
    () =>
      (Array.isArray(users) ? users : []).find(
        (u) => Number(u?.id_usuario) === Number(selectedTecnicoId)
      ) ?? null,
    [users, selectedTecnicoId]
  );

  const handleSelectAsset = ({ asset }) => {
    setSelectedAssetId(asset?.id_activo);
  };

  const handleAssign = () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedAsset || !selectedReporte) {
      setErrorMessage("Selecciona un bien reportado de la lista.");
      return;
    }

    if (!selectedTecnico) {
      setErrorMessage("Selecciona un técnico para asignar.");
      return;
    }

    assignTecnicoToReporte(selectedReporte.id_reporte, selectedTecnico.id_usuario);
    setReportes(getStoredReportes());
    setSelectedAssetId(null);
    setSelectedTecnicoId(null);
    setSuccessMessage("Reporte asignado al técnico correctamente.");
  };

  const handleCancel = () => {
    setSelectedAssetId(null);
    setSelectedTecnicoId(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="inv-page">
      <NavbarMenu title="Asignación del Reporte" onMenuClick={() => setOpenSidebar((v) => !v)} />

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
          setCurrentUserId(null);
          navigate("/");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-3 py-3 inv-assign-layout">
        <PrimaryButton
          variant="light"
          label="← Regresar"
          className="inv-assign-report__back mb-2"
          onClick={() => navigate("/bienes-registrados")}
        />

        <Row className="g-3">
          <Col lg={4}>
            <section className="inv-assign-panel">
              <div className="inv-assign-panel__heading">
                <h5 className="mb-0">Bienes Disponibles</h5>
                <span>{filteredAssets.length} activos</span>
              </div>

              <Form.Control
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Monitor"
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
                    selected={Number(selectedAssetId) === Number(asset?.id_activo)}
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
              <h4 className="inv-assign-title mb-1">Detalles de Asignación</h4>
              <p className="inv-assign-subtitle">
                Complete los datos para asignar el activo seleccionado
              </p>

              {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
              {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}

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
                  placeholder="Karla"
                  className="inv-assign-input"
                />
              </div>

              <div className="inv-assign-filters mb-2">
                <PrimaryButton
                  variant="light"
                  label="Filtrar"
                  className="inv-assign-filter-btn"
                  onClick={() => {}}
                />
                <Form.Select
                  className="inv-assign-select"
                  value={tecnicoTypeFilter}
                  onChange={(e) => setTecnicoTypeFilter(e.target.value)}
                >
                  <option value="todo">Tipo: Todo</option>
                  <option value="tecnico">Técnico</option>
                </Form.Select>
              </div>

              <label className="inv-assign-label mb-2">Usuarios encontrados</label>
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
                  <p className="text-muted mb-0">No hay técnicos con ese filtro.</p>
                ) : null}
              </div>

              <div className="inv-assign-actions">
                <PrimaryButton
                  variant="light"
                  label="Cancelar"
                  className="inv-assign-btn inv-assign-btn--cancel"
                  onClick={handleCancel}
                />
                <PrimaryButton
                  variant="primary"
                  label="Asignar Reporte"
                  className="inv-assign-btn inv-assign-btn--save"
                  onClick={handleAssign}
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
