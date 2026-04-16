import TimelineEvent from "./TimelineEvent";

export default function TimelineContainer({ events = [] }) {
  if (!events.length) {
    return (
      <div className="inv-history__empty">
        No hay eventos que coincidan con los filtros aplicados.
      </div>
    );
  }

  return (
    <section className="inv-history-timeline" aria-label="Linea de tiempo del historial">
      {events.map((event, index) => (
        <TimelineEvent
          key={event?.id_historial ?? `${event?.tipo_evento ?? "evento"}-${event?.fecha ?? index}-${index}`}
          event={event}
        />
      ))}
    </section>
  );
}
