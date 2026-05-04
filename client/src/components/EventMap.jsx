export default function EventMap({ event }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const location = [
    event?.location_name,
    event?.location_address,
    event?.location_city,
    event?.location_state,
    event?.location_zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  if (!location) {
    return (
      <p className="text-muted" style={{ marginTop: "0.75rem" }}>
        Map unavailable until a location is added.
      </p>
    );
  }

  if (!apiKey) {
    return (
      <a
        href={event?.google_maps_link}
        target="_blank"
        rel="noreferrer"
        className="btn btn-secondary btn-block"
        style={{ marginTop: "0.75rem" }}
      >
        View on Google Maps
      </a>
    );
  }

  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
    location
  )}`;

  return (
    <div style={{ marginTop: "1rem" }}>
      <iframe
        title="Event location map"
        width="100%"
        height="260"
        style={{
          border: 0,
          borderRadius: "0.75rem",
        }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapSrc}
      />
      {event?.google_maps_link ? (
        <a
          href={event.google_maps_link}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-block"
          style={{ marginTop: "0.75rem" }}
        >
          Open in Google Maps
        </a>
      ) : null}
    </div>
  );
}