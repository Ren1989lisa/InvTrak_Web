import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSearch } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import PaginationComponent from "../Components/PaginationComponent";
import { useUsers } from "../context/UsersContext";
import {
  cancelBajaSolicitud,
  deleteResguardo,
  getResguardos,
  updateResguardoEstado,
} from "../services/resguardoService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/devoluciones-bajas.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function formatCurrency(value) {
  const number = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(number)) return "$0";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(number);
}

function toSolicitudItem(resguardo, index) {
  const activo = resguardo?.activo ?? {};
  const producto = activo?.producto ?? {};
  const ubicacion = activo?.ubicacion ?? {};
  const ubicacionTexto = [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula]
    .filter(Boolean)
    .join(" ");

  return {
    id: Number(activo?.id_activo ?? activo?.idActivo ?? activo?.id ?? index + 1),
    resguardoId:
      Number(resguardo?.id_resguardo ?? resguardo?.resguardoId ?? resguardo?.idResguardo ?? 0) || null,
    etiqueta: activo?.etiqueta_bien ?? activo?.etiquetaBien ?? `ACT-${index + 1}`,
    numeroSerie: (activo?.numero_serie ?? activo?.numeroSerie ?? "").toString().trim() || "Sin serie",
    tipo: producto?.tipo_activo ?? producto?.nombre ?? activo?.tipo_activo ?? "Activo",
    descripcion: activo?.descripcion ?? "Sin descripcion",
    ubicacion: ubicacionTexto || "Sin ubicacion",
    costo: Number(activo?.costo ?? 0),
    estatus: (activo?.estatus ?? "DISPONIBLE").toString().toUpperCase(),
    confirmado: Boolean(resguardo?.confirmado),
    fechaDevolucion: resguardo?.fechaDevolucion ?? null,
  };
}

function SolicitudCard({
  item,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionClassName = "",
  primaryActionDisabled = false,
  secondaryActionLabel = "",
  onSecondaryAction,
  secondaryActionClassName = "",
  secondaryActionDisabled = false,
}) {
  return (
    <article className="inv-return-card">
      <div className="inv-return-card__top">
        <span className="inv-return-card__tag">Etq. bien: {item?.etiqueta}</span>
        <span className="inv-return-card__folio">N/S: {item?.numeroSerie}</span>
      </div>

      <div className="inv-return-card__body">
        <p>
          <strong>Tipo de activo:</strong> {item?.tipo}
        </p>
        <p>
          <strong>Descripcion:</strong> {item?.descripcion}
        </p>
        <p>
          <strong>Ubicacion:</strong> {item?.ubicacion}
        </p>
      </div>

      <div className="inv-return-card__footer">
        <span className="inv-return-card__cost">{formatCurrency(item?.costo)}</span>
        <div className="inv-return-card__actions">
          {secondaryActionLabel ? (
            <button
              type="button"
              className={`inv-return-card__action ${secondaryActionClassName}`.trim()}
              onClick={() => onSecondaryAction?.(item)}
              disabled={secondaryActionDisabled}
            >
              {secondaryActionLabel}
            </button>
          ) : null}

          <button
            type="button"
            className={`inv-return-card__action ${primaryActionClassName}`.trim()}
            onClick={() => onPrimaryAction?.(item)}
            disabled={primaryActionDisabled}
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DevolucionesBajas() {
  const ITEMS_PER_PAGE = 12;
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [searchDevolucion, setSearchDevolucion] = useState("");
  const [searchBaja, setSearchBaja] = useState("");
  const [typeDevolucion, setTypeDevolucion] = useState("todo");
  const [typeBaja, setTypeBaja] = useState("todo");
  const [devoluciones, setDevoluciones] = useState([]);
  const [bajas, setBajas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [processingKey, setProcessingKey] = useState("");
  const [currentDevolucionPage, setCurrentDevolucionPage] = useState(1);
  const [currentBajaPage, setCurrentBajaPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadSolicitudes() {
      setIsLoading(true);
      try {
        const resguardos = await getResguardos();
        if (!active) return;

        const normalized = (Array.isArray(resguardos) ? resguardos : []).map(toSolicitudItem);

        const devolucionesData = normalized
          .filter((item) => item.estatus === "DEVOLUCION" && item.confirmado === true && !item.fechaDevolucion)
          .slice(0, 8);

        const bajasData = normalized
          .filter(
            (item) => item.estatus === "SOLICITUD_DE_BAJA" && item.confirmado === true && !item.fechaDevolucion
          )
          .slice(0, 8);

        setDevoluciones(devolucionesData);
        setBajas(bajasData);
      } catch {
        if (!active) return;
        setDevoluciones([]);
        setBajas([]);
        setFeedback("No fue posible cargar las solicitudes de devoluciones y bajas.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSolicitudes();
    return () => {
      active = false;
    };
  }, []);

  const devolucionTypes = useMemo(() => {
    const values = new Set(["todo"]);
    devoluciones.forEach((item) => values.add(normalize(item?.tipo) || "todo"));
    return Array.from(values);
  }, [devoluciones]);

  const bajaTypes = useMemo(() => {
    const values = new Set(["todo"]);
    bajas.forEach((item) => values.add(normalize(item?.tipo) || "todo"));
    return Array.from(values);
  }, [bajas]);

  const devolucionesFiltradas = useMemo(() => {
    const query = normalize(searchDevolucion);
    return devoluciones.filter((item) => {
      const matchesType = typeDevolucion === "todo" || normalize(item?.tipo) === typeDevolucion;
      if (!matchesType) return false;
      if (!query) return true;
      return [item?.etiqueta, item?.numeroSerie, item?.ubicacion, item?.descripcion, item?.tipo]
        .some((value) => normalize(value).includes(query));
    });
  }, [devoluciones, searchDevolucion, typeDevolucion]);

  useEffect(() => {
    setCurrentDevolucionPage(1);
  }, [searchDevolucion, typeDevolucion, devoluciones.length]);

  const totalDevolucionPages = Math.max(1, Math.ceil(devolucionesFiltradas.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentDevolucionPage > totalDevolucionPages) {
      setCurrentDevolucionPage(totalDevolucionPages);
    }
  }, [currentDevolucionPage, totalDevolucionPages]);

  const devolucionesPaginadas = useMemo(() => {
    const start = (currentDevolucionPage - 1) * ITEMS_PER_PAGE;
    return devolucionesFiltradas.slice(start, start + ITEMS_PER_PAGE);
  }, [devolucionesFiltradas, currentDevolucionPage]);

  const bajasFiltradas = useMemo(() => {
    const query = normalize(searchBaja);
    return bajas.filter((item) => {
      const matchesType = typeBaja === "todo" || normalize(item?.tipo) === typeBaja;
      if (!matchesType) return false;
      if (!query) return true;
      return [item?.etiqueta, item?.numeroSerie, item?.ubicacion, item?.descripcion, item?.tipo]
        .some((value) => normalize(value).includes(query));
    });
  }, [bajas, searchBaja, typeBaja]);

  useEffect(() => {
    setCurrentBajaPage(1);
  }, [searchBaja, typeBaja, bajas.length]);

  const totalBajaPages = Math.max(1, Math.ceil(bajasFiltradas.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentBajaPage > totalBajaPages) {
      setCurrentBajaPage(totalBajaPages);
    }
  }, [currentBajaPage, totalBajaPages]);

  const bajasPaginadas = useMemo(() => {
    const start = (currentBajaPage - 1) * ITEMS_PER_PAGE;
    return bajasFiltradas.slice(start, start + ITEMS_PER_PAGE);
  }, [bajasFiltradas, currentBajaPage]);

  async function handleAction(tipo, item) {
    if (!item) return;

    setFeedback("");
    const keyPrefix = tipo === "cancelar-baja" ? "baja" : tipo;
    const key = `${keyPrefix}-${item?.resguardoId ?? item?.id}`;
    setProcessingKey(key);

    try {
      if (!item?.resguardoId) {
        throw new Error("No se encontro el resguardo asociado a esta solicitud.");
      }

      if (tipo === "devolucion") {
        await deleteResguardo(item.resguardoId);
        setDevoluciones((prev) =>
          prev.filter((current) => Number(current?.resguardoId) !== Number(item?.resguardoId))
        );
        setFeedback(`Devolucion aceptada para ${item?.etiqueta}. El activo ahora esta DISPONIBLE.`);
      } else if (tipo === "baja") {
        await updateResguardoEstado(item.resguardoId, "BAJA", "Baja aceptada por administrador.");
        await deleteResguardo(item.resguardoId);
        setBajas((prev) =>
          prev.filter((current) => Number(current?.resguardoId) !== Number(item?.resguardoId))
        );
        setFeedback(`Baja aceptada para ${item?.etiqueta}. El activo ahora esta en BAJA.`);
      } else if (tipo === "cancelar-baja") {
        await cancelBajaSolicitud(item.resguardoId);
        setBajas((prev) =>
          prev.filter((current) => Number(current?.resguardoId) !== Number(item?.resguardoId))
        );
        setFeedback(
          `Solicitud de baja cancelada para ${item?.etiqueta}. El activo vuelve a MANTENIMIENTO con su tecnico asignado.`
        );
      } else {
        throw new Error("Operacion no valida.");
      }
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (error?.status === 403) {
        setFeedback("No tienes permisos para aceptar esta solicitud.");
        return;
      }
      if (error?.status === 404) {
        setFeedback("El resguardo ya no existe o no fue encontrado.");
        return;
      }
      setFeedback(error?.message || "No fue posible procesar la solicitud.");
    } finally {
      setProcessingKey("");
    }
  }

  return (
    <div className="inv-page">
      <NavbarMenu title="Devoluciones y bajas" onMenuClick={() => setOpenSidebar((value) => !value)} />

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

      <Container fluid className="inv-content px-3 px-md-4 py-3 inv-returns-layout">
        <Button type="button" variant="link" className="inv-returns-back" onClick={() => navigate(-1)}>
          {"<- Regresar"}
        </Button>

        {isLoading ? <Alert variant="info">Cargando solicitudes...</Alert> : null}
        {feedback ? (
          <Alert
            variant={
              feedback.toLowerCase().includes("no fue posible") || feedback.toLowerCase().includes("no tienes permisos")
                ? "danger"
                : "success"
            }
          >
            {feedback}
          </Alert>
        ) : null}

        <Row className="g-3">
          <Col lg={6}>
            <section className="inv-returns-panel">
              <h5 className="inv-returns-panel__title">Solicitudes de devoluciones</h5>

              <InputGroup className="inv-returns-search mb-2">
                <InputGroup.Text className="inv-returns-search__icon" aria-hidden="true">
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  value={searchDevolucion}
                  onChange={(event) => setSearchDevolucion(event.target.value)}
                  placeholder="Etiqueta del bien o ubicacion"
                />
              </InputGroup>

              <div className="inv-returns-controls">
                <PrimaryButton
                  variant="light"
                  label="Filtrar"
                  className="inv-returns-filterBtn"
                  onClick={() => setSearchDevolucion((value) => value.trim())}
                />
                <Form.Select
                  className="inv-returns-select"
                  value={typeDevolucion}
                  onChange={(event) => setTypeDevolucion(event.target.value)}
                >
                  {devolucionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "todo" ? "Tipo: Todo" : `Tipo: ${type}`}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="inv-returns-list">
                {devolucionesPaginadas.map((item) => (
                  <SolicitudCard
                    key={`devolucion-${item?.resguardoId ?? item?.id}-${item?.numeroSerie ?? "serie"}`}
                    item={item}
                    primaryActionLabel="Aceptar devolucion"
                    primaryActionClassName="inv-return-card__action--devolucion"
                    primaryActionDisabled={processingKey === `devolucion-${item?.resguardoId ?? item?.id}`}
                    onPrimaryAction={(value) => handleAction("devolucion", value)}
                  />
                ))}
                {!devolucionesFiltradas.length ? (
                  <p className="text-muted mb-0">No hay activos en estatus DEVOLUCION.</p>
                ) : null}
              </div>

              <PaginationComponent
                currentPage={currentDevolucionPage}
                totalItems={devolucionesFiltradas.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentDevolucionPage}
              />
            </section>
          </Col>

          <Col lg={6}>
            <section className="inv-returns-panel">
              <h5 className="inv-returns-panel__title">Solicitudes de bajas</h5>

              <InputGroup className="inv-returns-search mb-2">
                <InputGroup.Text className="inv-returns-search__icon" aria-hidden="true">
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  value={searchBaja}
                  onChange={(event) => setSearchBaja(event.target.value)}
                  placeholder="Etiqueta del bien o ubicacion"
                />
              </InputGroup>

              <div className="inv-returns-controls">
                <PrimaryButton
                  variant="light"
                  label="Filtrar"
                  className="inv-returns-filterBtn"
                  onClick={() => setSearchBaja((value) => value.trim())}
                />
                <Form.Select
                  className="inv-returns-select"
                  value={typeBaja}
                  onChange={(event) => setTypeBaja(event.target.value)}
                >
                  {bajaTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "todo" ? "Tipo: Todo" : `Tipo: ${type}`}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="inv-returns-list">
                {bajasPaginadas.map((item) => (
                  <SolicitudCard
                    key={`baja-${item?.resguardoId ?? item?.id}-${item?.numeroSerie ?? "serie"}`}
                    item={item}
                    primaryActionLabel="Aceptar baja"
                    primaryActionClassName="inv-return-card__action--baja"
                    primaryActionDisabled={processingKey === `baja-${item?.resguardoId ?? item?.id}`}
                    onPrimaryAction={(value) => handleAction("baja", value)}
                    secondaryActionLabel="Cancelar"
                    secondaryActionClassName="inv-return-card__action--cancel-baja"
                    secondaryActionDisabled={processingKey === `baja-${item?.resguardoId ?? item?.id}`}
                    onSecondaryAction={(value) => handleAction("cancelar-baja", value)}
                  />
                ))}
                {!bajasFiltradas.length ? <p className="text-muted mb-0">No hay solicitudes de baja.</p> : null}
              </div>

              <PaginationComponent
                currentPage={currentBajaPage}
                totalItems={bajasFiltradas.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentBajaPage}
              />
            </section>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
