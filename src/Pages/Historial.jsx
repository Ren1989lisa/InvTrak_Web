import { useMemo, useState } from "react";
import { Col, Container, Form, InputGroup, Row, Button } from "react-bootstrap";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BsSearch } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import HistoryFilter from "../Components/HistoryFilter";
import TimelineContainer from "../Components/TimelineContainer";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos } from "../activosStorage";

import historialData from "../Data/historial_activo.json";
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
      return "asignación";
    case "reporte":
      return "reporte";
    default:
      return "evento";
  }
}

export default function Historial() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser, setCurrentUserId, menuItems } = useUsers();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("todo");

  const assetIdFromState = Number(location.state?.id_activo);
  const assetIdFromQuery = Number(searchParams.get("id_activo"));
  const allEvents = Array.isArray(historialData) ? historialData : [];

  const activos = useMemo(() => getStoredActivos(), []);

  const activosById = useMemo(() => {
    const map = {};
    activos.forEach((a) => {
      map[Number(a?.id_activo)] = a;
    });
    return map;
  }, [activos]);

  const enrichedEvents = useMemo(() => {
    return allEvents.map((event) => {
      const id = Number(event?.id_activo);
      const codigo = activosById[id]?.codigo_interno ?? "—";
      return { ...event, codigo_activo: codigo };
    });
  }, [allEvents, activosById]);

  const selectedAssetId = useMemo(() => {
    if (Number.isFinite(assetIdFromState) && assetIdFromState > 0) return assetIdFromState;
    if (Number.isFinite(assetIdFromQuery) && assetIdFromQuery > 0) return assetIdFromQuery;
    return null;
  }, [assetIdFromState, assetIdFromQuery]);

  const orderedEvents = useMemo(() => {
    return enrichedEvents
      .filter((event) =>
        selectedAssetId ? Number(event?.id_activo) === Number(selectedAssetId) : true
      )
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
        event?.codigo_activo,
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
          setCurrentUserId(null);
          navigate("/");
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
                placeholder="Buscar por código, usuario o evento..."
                className="inv-history-search__input"
                aria-label="Buscar en historial"
              />
            </InputGroup>
          </Col>
          <Col xs={12} md="auto">
            <HistoryFilter value={eventFilter} onChange={setEventFilter} />
          </Col>
        </Row>

        <TimelineContainer events={filteredEvents} />
      </Container>
    </div>
  );
}
