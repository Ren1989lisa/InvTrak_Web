import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSearch } from "react-icons/bs";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { deleteResguardo, getResguardos } from "../services/resguardoService";

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
  actionLabel,
  onAction,
  actionClassName = "",
  actionDisabled = false,
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
        <button
          type="button"
          className={`inv-return-card__action ${actionClassName}`.trim()}
          onClick={() => onAction?.(item)}
          disabled={actionDisabled}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

export default function DevolucionesBajas() {
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

  useEffect(() => {
    let active = true;

    async function loadSolicitudes() {
      setIsLoading(true);
      try {
        const resguardos = await getResguardos();
        if (!active) return;

        const normalized = (Array.isArray(resguardos) ? resguardos : []).map(toSolicitudItem);
        if (!normalized.length) {
          setDevoluciones([]);
          setBajas([]);
          return;
        }

        const devolucionesData = normalized
          .filter(
            (item) =>
              item.estatus === "DEVOLUCION" &&
              item.confirmado === true &&
              !item.fechaDevolucion
          )
          .slice(0, 8);
        const bajasData = normalized
          .filter(
            (item) =>
              (item.estatus === "SOLICITUD_DE_BAJA" || item.estatus === "BAJA") &&
              item.confirmado === true &&
              !item.fechaDevolucion
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

  async function handleAceptar(tipo, item) {
    if (!item) return;

    if (tipo !== "devolucion") {
      setFeedback(`Solicitud de baja registrada para ${item?.etiqueta}.`);
      return;
    }

    setFeedback("");
    const key = `${tipo}-${item?.resguardoId ?? item?.id}`;
    setProcessingKey(key);

    try {
      if (!item?.resguardoId) {
        throw new Error("No se encontro el resguardo asociado a esta devolucion.");
      }

      await deleteResguardo(item.resguardoId);

      setDevoluciones((prev) =>
        prev.filter((current) => Number(current?.resguardoId) !== Number(item?.resguardoId))
      );
      setFeedback(`Devolucion aceptada para ${item?.etiqueta}. El activo ahora esta DISPONIBLE.`);
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (error?.status === 403) {
        setFeedback("No tienes permisos para aceptar devoluciones.");
        return;
      }
      if (error?.status === 404) {
        setFeedback("El resguardo ya no existe o no fue encontrado.");
        return;
      }
      setFeedback(error?.message || "No fue posible aceptar la devolucion.");
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

      <Container fluid className="inv-content px-3 px-md-4 py-3 inv-returns-layout">
        <Button
          type="button"
          variant="link"
          className="inv-returns-back"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        {isLoading ? <Alert variant="info">Cargando solicitudes...</Alert> : null}
        {feedback ? (
          <Alert variant={feedback.toLowerCase().includes("no fue posible") || feedback.toLowerCase().includes("no tienes permisos") ? "danger" : "success"}>
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
                {devolucionesFiltradas.map((item) => (
                  <SolicitudCard
                    key={`devolucion-${item?.resguardoId ?? item?.id}-${item?.numeroSerie ?? "serie"}`}
                    item={item}
                    actionLabel="Aceptar devolucion"
                    actionClassName="inv-return-card__action--devolucion"
                    actionDisabled={processingKey === `devolucion-${item?.resguardoId ?? item?.id}`}
                    onAction={(value) => handleAceptar("devolucion", value)}
                  />
                ))}
                {!devolucionesFiltradas.length ? (
                  <p className="text-muted mb-0">No hay activos en estatus DEVOLUCION.</p>
                ) : null}
              </div>
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
                {bajasFiltradas.map((item) => (
                  <SolicitudCard
                    key={`baja-${item?.resguardoId ?? item?.id}-${item?.numeroSerie ?? "serie"}`}
                    item={item}
                    actionLabel="Aceptar baja"
                    actionClassName="inv-return-card__action--baja"
                    onAction={(value) => handleAceptar("baja", value)}
                  />
                ))}
                {!bajasFiltradas.length ? (
                  <p className="text-muted mb-0">No hay solicitudes de baja.</p>
                ) : null}
              </div>
            </section>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
