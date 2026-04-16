import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import PaginationComponent from "../Components/PaginationComponent";
import SidebarMenu from "../Components/SidebarMenu";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import {
  getMantenimientosByTecnico,
  isMantenimientoActivo,
} from "../services/mantenimientoService";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ReparacionCard({ reporte, activo, onClick }) {
  const producto = activo?.producto ?? {};
  const prioridad = normalize(reporte?.prioridad);
  const prioridadColor =
    prioridad === "alta" ? "danger" : prioridad === "media" ? "warning" : "secondary";

  return (
    <Card
      className="inv-asset-card shadow-sm border-0 h-100"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <Card.Header className="inv-asset-card__header d-flex justify-content-between align-items-center">
        <span>
          <span className="inv-asset-card__headerLabel">{reporte?.folio}</span>{" "}
          <span className="inv-asset-card__headerValue">
            {activo?.etiqueta_bien ?? `Activo #${reporte?.id_activo}`}
          </span>
        </span>
        <span className={`badge bg-${prioridadColor}`}>{reporte?.prioridad ?? ""}</span>
      </Card.Header>

      <Card.Body className="inv-asset-card__body">
        <div className="inv-field">
          <span className="inv-field__label">Tipo de activo:</span>
          <span className="inv-field__value">
            {producto?.tipo_activo ?? activo?.tipo_activo ?? "-"}
          </span>
        </div>

        <div className="inv-field inv-field--stack">
          <span className="inv-field__label">Reparar:</span>
          <span className="inv-field__value">{reporte?.descripcion}</span>
        </div>

        <div className="inv-field">
          <span className="inv-field__label">Fecha reporte:</span>
          <span className="inv-field__value">{reporte?.fecha_reporte}</span>
        </div>

        <div className="inv-field">
          <span className="inv-field__label">Estatus:</span>
          <span className="inv-field__value">{reporte?.estatus ?? "pendiente"}</span>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function MisReparaciones() {
  const ITEMS_PER_PAGE = 12;
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mantenimientos, setMantenimientos] = useState([]);
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();

  const query = search.trim().toLowerCase();

  useEffect(() => {
    let active = true;

    async function loadMantenimientos() {
      const tecnicoId = Number(currentUser?.id_usuario ?? currentUser?.idUsuario ?? currentUser?.id);
      if (!Number.isFinite(tecnicoId) || tecnicoId <= 0) {
        if (!active) return;
        setMantenimientos([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const list = await getMantenimientosByTecnico(tecnicoId);
        if (!active) return;
        setMantenimientos(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!active) return;
        setMantenimientos([]);
        setErrorMessage(error?.message || "No fue posible cargar tus reparaciones.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadMantenimientos();
    return () => {
      active = false;
    };
  }, [currentUser?.id_usuario, currentUser?.idUsuario, currentUser?.id]);

  const reportesConActivo = useMemo(() => {
    return mantenimientos
      .map((mantenimiento) => {
        if (!isMantenimientoActivo(mantenimiento?.estatus)) return null;

        const reporte = mantenimiento?.reporte ?? {};
        const activo = reporte?.activo ?? null;
        if (!activo) return null;

        return {
          reporte: {
            ...reporte,
            id_reporte: reporte?.id_reporte ?? reporte?.idReporte ?? reporte?.id,
            prioridad: mantenimiento?.prioridad_nombre ?? "MEDIA",
            estatus: mantenimiento?.estatus ?? reporte?.estatus,
          },
          activo,
        };
      })
      .filter(Boolean);
  }, [mantenimientos]);

  const ubicaciones = useMemo(() => {
    const values = new Map();

    reportesConActivo.forEach(({ activo }) => {
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
  }, [reportesConActivo]);

  const filtrados = useMemo(() => {
    return reportesConActivo.filter(({ reporte, activo }) => {
      const desc = normalize(reporte?.descripcion);
      const codigo = normalize(activo?.etiqueta_bien);
      const folio = normalize(reporte?.folio);
      const ubicacion = normalize(activo?.ubicacion?.completa);
      const fecha = parseDate(reporte?.fecha_reporte ?? reporte?.fechaReporte);
      const costo = Number(activo?.costo ?? 0);

      const matchesSearch = !query || desc.includes(query) || codigo.includes(query) || folio.includes(query);
      if (!matchesSearch) return false;

      if (appliedFilters) {
        const { ubicacion: fUbicacion, fechaDesde, fechaHasta, precioMin, precioMax } =
          appliedFilters;

        if (fUbicacion && normalize(activo?.ubicacion?.completa) !== normalize(fUbicacion)) return false;
        if (fechaDesde && fecha && fecha < new Date(fechaDesde)) return false;
        if (fechaHasta && fecha && fecha > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }

      return true;
    });
  }, [reportesConActivo, query, appliedFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const reparacionesPaginadas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtrados.slice(start, start + ITEMS_PER_PAGE);
  }, [filtrados, currentPage]);

  const handleClick = (reporte) => {
    if (reporte?.id_reporte) {
      navigate(`/reporte/${reporte.id_reporte}`);
    }
  };

  return (
    <div className="inv-page">
      <NavbarMenu title="Mis reparaciones" onMenuClick={() => setOpenSidebar((v) => !v)} />

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
          onFilters={() => setShowFilters(true)}
          placeholder="Buscar por folio, descripcion o codigo"
        />

        <FiltersModal
          show={showFilters}
          onHide={() => setShowFilters(false)}
          onApply={setAppliedFilters}
          onClear={() => setAppliedFilters(null)}
          ubicaciones={ubicaciones}
        />

        {isLoading ? (
          <Alert variant="info" className="mt-3 d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            Cargando reparaciones...
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="danger" className="mt-3">
            {errorMessage}
          </Alert>
        ) : null}

        {!isLoading && !errorMessage && reportesConActivo.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No tienes bienes asignados para reparar.
          </Alert>
        ) : null}

        {!isLoading && !errorMessage && reportesConActivo.length > 0 && filtrados.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No hay reparaciones que coincidan con los filtros.
          </Alert>
        ) : null}

        {filtrados.length > 0 ? (
          <>
            <Row className="g-4 mt-2">
              {reparacionesPaginadas.map(({ reporte, activo }) => (
                <Col md={4} key={reporte?.id_reporte}>
                  <ReparacionCard
                    reporte={reporte}
                    activo={activo}
                    onClick={() => handleClick(reporte)}
                  />
                </Col>
              ))}
            </Row>
            <PaginationComponent
              currentPage={currentPage}
              totalItems={filtrados.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        ) : null}
      </Container>
    </div>
  );
}
