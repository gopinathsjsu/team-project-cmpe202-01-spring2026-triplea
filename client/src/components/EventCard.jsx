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
      <div style={{ height: "48px", background: "#f3f3f3", marginBottom: "8px" }} />
      <h4 style={{ margin: 0 }}>{title}</h4>
      <p style={{ margin: "6px 0 0 0", fontSize: "13px" }}>Category: {category || "General"}</p>
      <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
        {formatDisplayDate(event_date)} {start_time ? `at ${start_time}` : ""}
      </p>
      <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Location: {location_name || "TBA"}</p>
      <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>Capacity: {capacity ?? "-"}</p>
    </>
  );

  if (id == null) {
    return (
      <article style={{ border: "1px solid #ccc", padding: "10px", minHeight: "120px" }}>{inner}</article>
    );
  }

  return (
    <Link
      to={`/events/${id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <article
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "120px",
          cursor: "pointer",
        }}
      >
        {inner}
      </article>
    </Link>
  );
}
