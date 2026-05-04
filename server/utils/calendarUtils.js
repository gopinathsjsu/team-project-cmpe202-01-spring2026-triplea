function formatGoogleDate(dateValue, timeValue) {
  const date = String(dateValue).slice(0, 10).replaceAll("-", "");
  const time = String(timeValue || "00:00:00").replaceAll(":", "").padEnd(6, "0");
  return `${date}T${time}`;
}

function buildFullLocation(event) {
  return [
    event.location_name,
    event.location_address,
    event.location_city,
    event.location_state,
    event.location_zip_code,
  ]
    .filter(Boolean)
    .join(", ");
}

function generateGoogleCalendarLink(event) {
  const start = formatGoogleDate(event.event_date, event.start_time);
  const end = event.end_time
    ? formatGoogleDate(event.event_date, event.end_time)
    : formatGoogleDate(event.event_date, event.start_time);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "EventHub Event",
    dates: `${start}/${end}`,
    details: event.event_description || "",
    location: buildFullLocation(event),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateGoogleMapsSearchLink(event) {
  const location = buildFullLocation(event);
  const params = new URLSearchParams({
    api: "1",
    query: location,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

module.exports = {
  generateGoogleCalendarLink,
  buildFullLocation,
  generateGoogleMapsSearchLink,
};