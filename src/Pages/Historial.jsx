import { useMemo, useState } from "react";
import { Col, Container, Row, Button } from "react-bootstrap";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import SearchBar from "../Components/SearchBar";
import PrimaryButton from "../Components/PrimaryButton";
import HistoryFilter from "../Components/HistoryFilter";
import TimelineContainer from "../Components/TimelineContainer";
import { useUsers } from "../context/UsersContext";

import activosData from "../Data/activosDetalle.json";
import historialData from "../Data/historial_activo.json";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/historial.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function eventTitle(tipo) {
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

  const selectedAssetId = useMemo(() => {
    if (Number.isFinite(assetIdFromState) && assetIdFromState > 0) return assetIdFromState;
    if (Number.isFinite(assetIdFromQuery) && assetIdFromQuery > 0) return assetIdFromQuery;
    return Number(allEvents[0]?.id_activo) || Number(activosData[0]?.id_activo) || null;
  }, [assetIdFromState, assetIdFromQuery, allEvents]);

  const selectedAsset = useMemo(() => {
    return (Array.isArray(activosData) ? activosData : []).find(
      (item) => Number(item?.id_activo) === Number(selectedAssetId)
    );
  }, [selectedAssetId]);

  const assetDisplayName = useMemo(() => {
    if (!selectedAsset) return "Activo no encontrado";
    const producto = selectedAsset?.producto ?? {};
    const nombre = [
      producto?.tipo_activo ?? selectedAsset?.tipo_activo,
      producto?.marca ?? selectedAsset?.marca,
      producto?.modelo ?? selectedAsset?.modelo,
    ]
      .filter(Boolean)
      .join(" ");
    return nombre || selectedAsset?.codigo_interno || "Activo";
  }, [selectedAsset]);

  const orderedEvents = useMemo(() => {
    return allEvents
      .filter((event) => Number(event?.id_activo) === Number(selectedAssetId))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [allEvents, selectedAssetId]);

  const filteredEvents = useMemo(() => {
    const query = normalize(search);
    return orderedEvents.filter((event) => {
      const matchesType =
        eventFilter === "todo" || normalize(event?.tipo_evento) === normalize(eventFilter);

      if (!matchesType) return false;
      if (!query) return true;

      const searchableFields = [
        eventTitle(event?.tipo_evento),
        event?.usuario,
        event?.tecnico,
        event?.tecnico_asignado,
        event?.observacion,
      ];

      return searchableFields.some((field) => normalize(field).includes(query));
    });
  }, [orderedEvents, search, eventFilter]);

  return (
    <div className="inv-page">
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

      <Container fluid className="inv-content px-3 px-md-4 py-3">
         <Col xs="auto">
          <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(-1)}>
          ← Regresar
        </Button>
        </Col>


        <section className="inv-history__panel mt-3">
          <h2 className="inv-history__assetTitle">Activo: {assetDisplayName}</h2>

          <Row className="g-2 align-items-end mt-1">
            <Col md={8}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Buscar por tipo de evento, usuario u observación"
                showActions={false}
              />
            </Col>
            <Col md={4}>
              <HistoryFilter value={eventFilter} onChange={setEventFilter} />
            </Col>
          </Row>

          <TimelineContainer events={filteredEvents} />
        </section>
      </Container>
    </div>
  );
}
