import { Link } from "react-router-dom";
import { formatDisplayDate } from "../utils/formatDisplayDate";

export default function EventCard({
  id,
  title = "Event Title",
  category = "General",
  event_date = "-",
  start_time = "-",
  location_name = "TBA",
  capacity = "-",
}) {
  const inner = (
    <>
      <div className="event-card__thumb" aria-hidden />
      <div className="event-card__body">
        <h4 className="event-card__title">{title}</h4>
        <p className="event-card__meta">Category: {category || "General"}</p>
        <p className="event-card__meta">
          {formatDisplayDate(event_date)} {start_time ? `at ${start_time}` : ""}
        </p>
        <p className="event-card__meta">Location: {location_name || "TBA"}</p>
        <p className="event-card__meta">Capacity: {capacity ?? "-"}</p>
      </div>
    </>
  );

  if (id == null) {
    return <article className="event-card">{inner}</article>;
  }

  return (
    <Link to={`/events/${id}`} className="event-card">
      {inner}
    </Link>
  );
}
