import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Container, Form, InputGroup, Row, Spinner } from "react-bootstrap";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BsSearch } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import HistoryFilter from "../Components/HistoryFilter";
import TimelineContainer from "../Components/TimelineContainer";
import { useUsers } from "../context/UsersContext";
import { getHistorial, getHistorialByActivo } from "../services/historialService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/historial.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function eventTitleSearch(tipo) {
  switch (tipo) {
    case "cambio_estatus":
      return "cambio de estatus";
    case "mantenimiento":
      return "mantenimiento";
    case "asignacion":
      return "asignacion";
    case "reporte":
      return "reporte";
    default:
      return "evento";
  }
}

function toEventTimestamp(value) {
  const date = new Date(value ?? 0);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

export default function Historial() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser, logout, menuItems } = useUsers();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("todo");
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const assetIdFromState = Number(location.state?.id_activo ?? location.state?.idActivo);
  const assetIdFromQuery = Number(searchParams.get("id_activo") ?? searchParams.get("activoId"));

  const selectedAssetId = useMemo(() => {
    if (Number.isFinite(assetIdFromState) && assetIdFromState > 0) return assetIdFromState;
    if (Number.isFinite(assetIdFromQuery) && assetIdFromQuery > 0) return assetIdFromQuery;
    return null;
  }, [assetIdFromState, assetIdFromQuery]);

  useEffect(() => {
    let active = true;

    async function loadHistorial() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = selectedAssetId
          ? await getHistorialByActivo(selectedAssetId)
          : await getHistorial();

        if (!active) return;
        setAllEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!active) return;

        const status = Number(error?.status ?? error?.response?.status ?? 0);
        if (status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }

        const fallbackMessage = selectedAssetId
          ? "No fue posible cargar el historial del activo."
          : "No fue posible cargar el historial.";
        setLoadError(error?.message || fallbackMessage);
        setAllEvents([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadHistorial();
    return () => {
      active = false;
    };
  }, [selectedAssetId, reloadKey, navigate, logout]);

  const enrichedEvents = useMemo(() => {
    return (Array.isArray(allEvents) ? allEvents : []).map((event) => ({
      ...event,
      codigo_activo: event?.codigo_activo || event?.activo?.etiqueta_bien || "—",
    }));
  }, [allEvents]);

  const orderedEvents = useMemo(() => {
    return enrichedEvents
      .filter((event) => {
        if (!selectedAssetId) return true;

        const eventAssetId = Number(
          event?.id_activo ?? event?.activo?.id_activo ?? event?.activo?.idActivo
        );
        if (Number.isFinite(eventAssetId) && eventAssetId > 0) {
          return eventAssetId === Number(selectedAssetId);
        }

        return true;
      })
      .sort((a, b) => toEventTimestamp(b?.fecha) - toEventTimestamp(a?.fecha));
  }, [enrichedEvents, selectedAssetId]);

  const filteredEvents = useMemo(() => {
    const query = normalize(search);

    return orderedEvents.filter((event) => {
      const matchesType =
        eventFilter === "todo" || normalize(event?.tipo_evento) === normalize(eventFilter);

      if (!matchesType) return false;
      if (!query) return true;

      const searchableFields = [
        eventTitleSearch(event?.tipo_evento),
        event?.usuario,
        event?.tecnico,
        event?.tecnico_asignado,
        event?.observacion,
        event?.motivo,
        event?.codigo_activo,
        event?.activo?.numero_serie,
        event?.estatus_anterior,
        event?.estatus_nuevo,
      ];

      return searchableFields.some((field) => normalize(field).includes(query));
    });
  }, [orderedEvents, search, eventFilter]);

  return (
    <div className="inv-page inv-history-page">
      <NavbarMenu title="Historial" onMenuClick={() => setOpenSidebar((v) => !v)} />

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

      <Container fluid className="inv-content inv-history-content px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-history-back"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        <Row className="g-2 align-items-stretch mt-2 inv-history-toolbar">
          <Col xs={12} md>
            <InputGroup className="inv-history-search">
              <InputGroup.Text className="inv-history-search__icon" aria-hidden="true">
                <BsSearch />
              </InputGroup.Text>
              <Form.Control
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por codigo, usuario o evento..."
                className="inv-history-search__input"
                aria-label="Buscar en historial"
              />
            </InputGroup>
          </Col>
          <Col xs={12} md="auto">
            <HistoryFilter value={eventFilter} onChange={setEventFilter} />
          </Col>
        </Row>

        {loadError ? (
          <Alert variant="danger" className="d-flex justify-content-between align-items-center">
            <span>{loadError}</span>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Reintentar
            </Button>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="inv-history__empty d-flex flex-column align-items-center gap-2">
            <Spinner animation="border" role="status" />
            <span>Cargando historial...</span>
          </div>
        ) : (
          <TimelineContainer events={filteredEvents} />
        )}
      </Container>
    </div>
  );
}
