import { formatHistorialDate, formatEstatusLabel, eventTitle } from "../utils/historialUtils";

function resolveUsuario(event) {
  if (typeof event?.usuario === "string") {
    return event.usuario;
  }

  if (event?.usuario && typeof event.usuario === "object") {
    return event.usuario.nombre_completo || event.usuario.nombre || event.usuario.correo || "—";
  }

  return event?.usuario_detalle?.nombre || event?.usuario_detalle?.correo || "—";
}

export default function TimelineEvent({ event }) {
  const tipo = event?.tipo_evento;
  const codigo = event?.codigo_activo || event?.activo?.etiqueta_bien || "—";
  const usuario = resolveUsuario(event);
  const observacion = event?.observacion ?? event?.motivo ?? "";

  return (
    <article className="inv-history-event">
      <span className="inv-history-event__dot" aria-hidden="true" />
      <time className="inv-history-event__date" dateTime={event?.fecha}>
        {formatHistorialDate(event?.fecha)}
      </time>
      <div className="inv-history-event__card">
        <h3 className="inv-history-event__title">{eventTitle(tipo)}</h3>
        <p className="inv-history-event__codigo">{codigo}</p>

        {tipo === "cambio_estatus" ? (
          <>
            <p className="inv-history-event__line">
              <strong>De:</strong> {formatEstatusLabel(event?.estatus_anterior)}
            </p>
            <p className="inv-history-event__line">
              <strong>A:</strong> {formatEstatusLabel(event?.estatus_nuevo)}
            </p>
            <p className="inv-history-event__line">
              <strong>Usuario:</strong> {usuario || "—"}
            </p>
          </>
        ) : null}

        {tipo === "mantenimiento" ? (
          <>
            <p className="inv-history-event__line">
              <strong>Tipo:</strong> {event?.tipo_mantenimiento || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Diagnostico:</strong> {event?.diagnostico || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Tecnico:</strong> {event?.tecnico || "—"}
            </p>
          </>
        ) : null}

        {tipo === "asignacion" ? (
          <>
            <p className="inv-history-event__line">
              <strong>Reporte relacionado:</strong> {event?.reporte_relacionado || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Tecnico asignado:</strong> {event?.tecnico_asignado || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Prioridad:</strong> {event?.prioridad || "—"}
            </p>
          </>
        ) : null}

        {tipo === "reporte" ? (
          <>
            <p className="inv-history-event__line">
              <strong>Folio:</strong> {event?.folio_reporte || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Usuario:</strong> {usuario || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Detalle:</strong> {event?.diagnostico || "—"}
            </p>
          </>
        ) : null}

        {observacion ? (
          <div className="inv-history-event__obs">
            <span className="inv-history-event__obsLabel">Observacion:</span>
            <p className="mb-0">{observacion}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
