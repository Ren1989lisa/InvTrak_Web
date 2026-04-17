import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import PaginationComponent from "../Components/PaginationComponent";
import AssetSelectableCard from "../Components/AssetSelectableCard";
import UserSelectableCard from "../Components/UserSelectableCard";
import SelectedAssetCard from "../Components/SelectedAssetCard";
import SearchBar from "../Components/SearchBar";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import { useProductosCatalogo } from "../hooks/useProductosCatalogo";
import { getActivosDisponibles } from "../services/activosService";
import { getUsuarios } from "../services/userService";
import { createResguardo } from "../services/resguardoService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/asignacion-bien.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AsignacionBien() {
  const ITEMS_PER_PAGE = 12;
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();
  const { tipoOptions } = useProductosCatalogo();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("todo");
  const [showAssetFilters, setShowAssetFilters] = useState(false);
  const [appliedAssetFilters, setAppliedAssetFilters] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activos, setActivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoadingActivos, setIsLoadingActivos] = useState(false);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedActivoIds, setAssignedActivoIds] = useState([]);
  const [currentAssetPage, setCurrentAssetPage] = useState(1);

  async function fetchAssignableActivos(extraExcludedIds = []) {
    const list = await getActivosDisponibles();
    const normalized = Array.isArray(list) ? list : [];
    const excludedIds = new Set([
      ...(Array.isArray(assignedActivoIds) ? assignedActivoIds : []),
      ...(Array.isArray(extraExcludedIds) ? extraExcludedIds : []),
    ]);

    return normalized.filter((asset) => {
      const idActivo = normalizeId(asset?.id_activo ?? asset?.idActivo ?? asset?.id);
      return idActivo == null || !excludedIds.has(idActivo);
    });
  }

  useEffect(() => {
    let active = true;

    async function loadActivos() {
      setIsLoadingActivos(true);
      try {
        const list = await fetchAssignableActivos();
        if (!active) return;
        setActivos(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!active) return;
        console.error("Error al cargar activos:", error);
        setErrorMessage("No fue posible cargar los activos disponibles.");
      } finally {
        if (active) setIsLoadingActivos(false);
      }
    }

    loadActivos();
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;

    async function loadUsuarios() {
      setIsLoadingUsuarios(true);
      try {
        const list = await getUsuarios();
        if (!active) return;

        const usuariosFiltrados = (Array.isArray(list) ? list : []).filter((u) => {
          const rol = normalize(u?.rol);
          return rol === "usuario";
        });

        setUsuarios(usuariosFiltrados);
      } catch (error) {
        if (!active) return;
        console.error("Error al cargar usuarios:", error);
        setErrorMessage("No fue posible cargar los usuarios para asignación.");
      } finally {
        if (active) setIsLoadingUsuarios(false);
      }
    }

    loadUsuarios();
    return () => {
      active = false;
    };
  }, [navigate]);

  const filteredAssets = useMemo(() => {
    const query = normalize(assetSearch);

    return activos.filter((asset) => {
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
        const { ubicacion: fUbicacion, estatus: fEstatus, producto: fProducto, fechaDesde, fechaHasta, precioMin, precioMax } = appliedAssetFilters;

        if (fUbicacion && ubicacionTexto !== normalize(fUbicacion)) return false;
        if (fEstatus && normalize(asset?.estatus ?? "") !== normalize(fEstatus)) return false;
        if (fProducto) {
          const nombreProd = normalize(asset?.producto?.nombre ?? asset?.producto?.tipo_activo ?? asset?.tipo_activo ?? "");
          if (!nombreProd.includes(normalize(fProducto))) return false;
        }
        if (fechaDesde && fechaAlta && fechaAlta < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaAlta && fechaAlta > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }

      return true;
    });
  }, [activos, assetSearch, assetTypeFilter, appliedAssetFilters]);

  useEffect(() => {
    setCurrentAssetPage(1);
  }, [assetSearch, assetTypeFilter, appliedAssetFilters]);

  const totalAssetPages = Math.max(1, Math.ceil(filteredAssets.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentAssetPage > totalAssetPages) {
      setCurrentAssetPage(totalAssetPages);
    }
  }, [currentAssetPage, totalAssetPages]);

  const paginatedAssets = useMemo(() => {
    const start = (currentAssetPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, currentAssetPage]);

  const filterUbicaciones = useMemo(() => {
    const values = new Map();
    activos.forEach((a) => {
      const campus = String(a?.ubicacion?.campus ?? "").trim();
      const edificio = String(a?.ubicacion?.edificio ?? "").trim();
      const aula = String(a?.ubicacion?.aula ?? "").trim();
      const completa = String(
        a?.ubicacion?.completa ?? [campus, edificio, aula].filter(Boolean).join(" ")
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
  }, [activos]);

  const filterEstatusOptions = useMemo(() => {
    const unique = new Map();
    activos.forEach((a) => {
      const val = (a?.estatus ?? "").toString().trim();
      if (!val || unique.has(val)) return;
      unique.set(val, { value: val, label: val });
    });
    return Array.from(unique.values());
  }, [activos]);

  const filterProductoOptions = tipoOptions;

  const filteredUsers = useMemo(() => {
    const query = normalize(userSearch);

    return usuarios.filter((user) => {
      const name = normalize(user?.nombre ?? user?.nombre_completo);
      const employeeNumber = normalize(user?.numero_empleado);
      return !query || name.includes(query) || employeeNumber.includes(query);
    });
  }, [usuarios, userSearch]);

  const selectedAsset = useMemo(
    () => activos.find((asset) => Number(asset?.id_activo) === Number(selectedAssetId)) ?? null,
    [activos, selectedAssetId]
  );

  const selectedUser = useMemo(
    () => usuarios.find((u) => Number(u?.id_usuario) === Number(selectedUserId)) ?? null,
    [usuarios, selectedUserId]
  );

  const handleAssign = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedAsset) {
      setErrorMessage("Selecciona un activo disponible.");
      return;
    }

    if (!selectedUser) {
      setErrorMessage("Selecciona un usuario para asignar.");
      return;
    }

    setIsAssigning(true);
    try {
      const assignedActivoId = Number(selectedAsset.id_activo);
      await createResguardo({
        activoId: assignedActivoId,
        usuarioId: Number(selectedUser.id_usuario),
        observaciones: "Asignado desde el sistema web",
      });

      setAssignedActivoIds((prev) =>
        prev.includes(assignedActivoId) ? prev : [...prev, assignedActivoId]
      );

      const updatedActivos = await fetchAssignableActivos([assignedActivoId]);
      setActivos(Array.isArray(updatedActivos) ? updatedActivos : []);

      setSelectedAssetId(null);
      setSelectedUserId(null);
      setSuccessMessage("Bien asignado correctamente. El usuario debe confirmar el resguardo.");
    } catch (error) {
      console.error("Error al asignar bien:", error);
      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setErrorMessage(error?.message || "No fue posible asignar el bien.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancel = () => {
    setSelectedAssetId(null);
    setSelectedUserId(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="inv-page">
      <NavbarMenu title="Asignacion del bien" onMenuClick={() => setOpenSidebar((v) => !v)} />

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

      <Container fluid className="inv-content px-3 px-md-3 py-3 inv-assign-layout">
        {isLoadingActivos || isLoadingUsuarios ? (
          <Alert variant="info">Cargando datos del sistema...</Alert>
        ) : null}

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
                placeholder="Buscar por etiqueta, tipo o descripcion"
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
                  {tipoOptions.map((tipo) => (
                    <option key={tipo} value={tipo.toLowerCase()}>
                      {tipo}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="inv-assign-assets-list">
                {paginatedAssets.map((asset) => (
                  <AssetSelectableCard
                    key={asset.id_activo}
                    asset={asset}
                    selected={Number(selectedAssetId) === Number(asset.id_activo)}
                    onSelect={(item) => setSelectedAssetId(item?.id_activo)}
                  />
                ))}
                {!filteredAssets.length ? (
                  <p className="text-muted mb-0">No hay activos disponibles con ese filtro.</p>
                ) : null}
              </div>

              <PaginationComponent
                currentPage={currentAssetPage}
                totalItems={filteredAssets.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentAssetPage}
              />
            </section>
          </Col>

          <Col lg={8}>
            <section className="inv-assign-panel">
              <h4 className="inv-assign-title mb-1">Detalles de Asignacion</h4>
              <p className="inv-assign-subtitle">
                Complete los datos para asignar el activo seleccionado
              </p>

              {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
              {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}

              <div className="mb-3">
                <label className="inv-assign-label">Activo Seleccionado</label>
                {selectedAsset ? (
                  <SelectedAssetCard asset={selectedAsset} />
                ) : (
                  <div className="inv-assign-empty">Selecciona un activo de la lista izquierda.</div>
                )}
              </div>

              <div className="mb-2">
                <label className="inv-assign-label">Buscar usuario</label>
                <SearchBar
                  value={userSearch}
                  onChange={setUserSearch}
                  placeholder="Buscar por nombre o numero de empleado"
                  showActions={false}
                />
              </div>

              <label className="inv-assign-label mb-2">Usuarios encontrados</label>
              <div className="inv-assign-users-list">
                {filteredUsers.map((user) => (
                  <UserSelectableCard
                    key={user.id_usuario}
                    user={user}
                    selected={Number(selectedUserId) === Number(user.id_usuario)}
                    onSelect={(item) => setSelectedUserId(item?.id_usuario)}
                  />
                ))}
                {!filteredUsers.length ? (
                  <p className="text-muted mb-0">No hay usuarios con ese filtro.</p>
                ) : null}
              </div>

              <div className="inv-assign-actions">
                <PrimaryButton
                  variant="light"
                  label="Cancelar"
                  className="inv-assign-btn inv-assign-btn--cancel"
                  onClick={handleCancel}
                  disabled={isAssigning}
                />
                <PrimaryButton
                  variant="primary"
                  label={isAssigning ? "Asignando..." : "Asignar Bien"}
                  className="inv-assign-btn inv-assign-btn--save"
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedAsset || !selectedUser}
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
        estatusOptions={filterEstatusOptions}
        productoOptions={filterProductoOptions}
      />
    </div>
  );
}
