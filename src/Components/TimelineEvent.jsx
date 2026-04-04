import { formatHistorialDate, formatEstatusLabel, eventTitle } from "../utils/historialUtils";

export default function TimelineEvent({ event }) {
  const tipo = event?.tipo_evento;
  const codigo = event?.codigo_activo ?? "—";

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
              <strong>Usuario:</strong> {event?.usuario || "—"}
            </p>
          </>
        ) : null}

        {tipo === "mantenimiento" ? (
          <>
            <p className="inv-history-event__line">
              <strong>Tipo:</strong> {event?.tipo_mantenimiento || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Diagnóstico:</strong> {event?.diagnostico || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Técnico:</strong> {event?.tecnico || "—"}
            </p>
          </>
        ) : null}

        {tipo === "asignacion" ? (
          <>
            <p className="inv-history-event__line">
              <strong>Reporte relacionado:</strong> {event?.reporte_relacionado || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Técnico asignado:</strong> {event?.tecnico_asignado || "—"}
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
              <strong>Usuario:</strong> {event?.usuario || "—"}
            </p>
            <p className="inv-history-event__line">
              <strong>Detalle:</strong> {event?.diagnostico || "—"}
            </p>
          </>
        ) : null}

        {event?.observacion ? (
          <div className="inv-history-event__obs">
            <span className="inv-history-event__obsLabel">Observación:</span>
            <p className="mb-0">{event.observacion}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
