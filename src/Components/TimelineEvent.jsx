function formatDate(value) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(parsed);
}

function titleByType(tipo) {
  switch (tipo) {
    case "cambio_estatus":
      return "Cambio de Estatus";
    case "mantenimiento":
      return "Mantenimiento";
    case "asignacion":
      return "Asignación de Técnico";
    case "reporte":
      return "Reporte";
    default:
      return "Evento";
  }
}

function iconByType(tipo) {
  switch (tipo) {
    case "cambio_estatus":
      return "↺";
    case "mantenimiento":
      return "🛠";
    case "asignacion":
      return "👤";
    case "reporte":
      return "⚑";
    default:
      return "•";
  }
}

export default function TimelineEvent({ event }) {
  return (
    <article className="inv-history-event">
      <span className="inv-history-event__dot" aria-hidden="true">
        {iconByType(event?.tipo_evento)}
      </span>

      <div className="inv-history-event__card">
        <p className="inv-history-event__date">{formatDate(event?.fecha)}</p>
        <h5 className="inv-history-event__title">{titleByType(event?.tipo_evento)}</h5>

        {event?.tipo_evento === "cambio_estatus" ? (
          <>
            <p className="mb-1">
              <strong>De:</strong> {event?.estatus_anterior || "-"}
            </p>
            <p className="mb-1">
              <strong>A:</strong> {event?.estatus_nuevo || "-"}
            </p>
            <p className="mb-1">
              <strong>Usuario:</strong> {event?.usuario || "-"}
            </p>
          </>
        ) : null}

        {event?.tipo_evento === "mantenimiento" ? (
          <>
            <p className="mb-1">
              <strong>Tipo:</strong> {event?.tipo_mantenimiento || "-"}
            </p>
            <p className="mb-1">
              <strong>Diagnóstico:</strong> {event?.diagnostico || "-"}
            </p>
            <p className="mb-1">
              <strong>Técnico:</strong> {event?.tecnico || "-"}
            </p>
          </>
        ) : null}

        {event?.tipo_evento === "asignacion" ? (
          <>
            <p className="mb-1">
              <strong>Reporte relacionado:</strong> {event?.reporte_relacionado || "-"}
            </p>
            <p className="mb-1">
              <strong>Técnico asignado:</strong> {event?.tecnico_asignado || "-"}
            </p>
            <p className="mb-1">
              <strong>Tipo de mantenimiento:</strong> {event?.tipo_mantenimiento || "-"}
            </p>
            <p className="mb-1">
              <strong>Prioridad:</strong> {event?.prioridad || "-"}
            </p>
          </>
        ) : null}

        {event?.tipo_evento === "reporte" ? (
          <>
            <p className="mb-1">
              <strong>Folio:</strong> {event?.folio_reporte || "-"}
            </p>
            <p className="mb-1">
              <strong>Usuario:</strong> {event?.usuario || "-"}
            </p>
            <p className="mb-1">
              <strong>Detalle:</strong> {event?.diagnostico || "-"}
            </p>
          </>
        ) : null}

        <div className="inv-history-event__obs">
          <span className="inv-history-event__obsLabel">Observación:</span>
          <p className="mb-0">{event?.observacion || "Sin observación."}</p>
        </div>
      </div>
    </article>
  );
}
