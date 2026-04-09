import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import AssetSelectableCard from "../Components/AssetSelectableCard";
import UserSelectableCard from "../Components/UserSelectableCard";
import SelectedAssetCard from "../Components/SelectedAssetCard";
import UserSearchBar from "../Components/UserSearchBar";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import { getActivosDisponibles } from "../services/activosService";
import { getUsuarios } from "../services/userService";
import { createResguardo } from "../services/resguardoService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/asignacion-bien.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

export default function AsignacionBien() {
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("todo");
  const [showAssetFilters, setShowAssetFilters] = useState(false);
  const [appliedAssetFilters, setAppliedAssetFilters] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("todo");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activos, setActivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoadingActivos, setIsLoadingActivos] = useState(false);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Cargar activos disponibles del backend
  useEffect(() => {
    let active = true;

    async function loadActivos() {
      setIsLoadingActivos(true);
      try {
        const list = await getActivosDisponibles();
        if (!active) return;
        setActivos(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!active) return;
        console.error("Error al cargar activos:", error);
        if (error?.status === 401) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (active) setIsLoadingActivos(false);
      }
    }

    loadActivos();
    return () => {
      active = false;
    };
  }, [navigate]);

  // Cargar usuarios del backend (solo rol USUARIO)
  useEffect(() => {
    let active = true;

    async function loadUsuarios() {
      setIsLoadingUsuarios(true);
      try {
        const list = await getUsuarios();
        if (!active) return;
        
        // Filtrar solo usuarios con rol "USUARIO" (no técnicos ni administradores)
        const usuariosFiltrados = (Array.isArray(list) ? list : []).filter((u) => {
          const rol = normalize(u?.rol);
          return rol === "usuario";
        });
        
        setUsuarios(usuariosFiltrados);
      } catch (error) {
        if (!active) return;
        console.error("Error al cargar usuarios:", error);
        if (error?.status === 401) {
          navigate("/login", { replace: true });
        }
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
  }, [activos, assetSearch, assetTypeFilter, appliedAssetFilters]);

  const filterUbicaciones = useMemo(() => {
    const values = new Set();
    activos.forEach((a) => {
      const u = a?.ubicacion;
      const text = [u?.campus, u?.edificio, u?.aula].filter(Boolean).join(" ");
      if (text) values.add(text);
    });
    return Array.from(values);
  }, [activos]);

  const filteredUsers = useMemo(() => {
    const query = normalize(userSearch);

    return usuarios.filter((user) => {
      const name = normalize(user?.nombre ?? user?.nombre_completo);
      const employeeNumber = normalize(user?.numero_empleado);
      const matchesQuery = !query || name.includes(query) || employeeNumber.includes(query);
      return matchesQuery;
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
      await createResguardo({
        activoId: Number(selectedAsset.id_activo),
        usuarioId: Number(selectedUser.id_usuario),
        observaciones: `Asignado desde el sistema web`,
      });

      // Recargar activos disponibles
      const updatedActivos = await getActivosDisponibles();
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
      <NavbarMenu title="Asignación del bien" onMenuClick={() => setOpenSidebar((v) => !v)} />

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
          <Alert variant="info">
            Cargando datos del sistema...
          </Alert>
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
                placeholder="Buscar por etiqueta, tipo o descripción"
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
                  <option value="proyector">Proyector</option>
                  <option value="switch">Switch</option>
                </Form.Select>
              </div>

              <div className="inv-assign-assets-list">
                {filteredAssets.map((asset) => (
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
            </section>
          </Col>

          <Col lg={8}>
            <section className="inv-assign-panel">
              <h4 className="inv-assign-title mb-1">Detalles de Asignación</h4>
              <p className="inv-assign-subtitle">Complete los datos para asignar el activo seleccionado</p>

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
                <UserSearchBar value={userSearch} onChange={setUserSearch} placeholder="Buscar por nombre o número de empleado" />
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
      />
    </div>
  );
}
