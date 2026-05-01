export async function getEvents() {
  const response = await fetch("http://localhost:5000/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

export async function getEventById(id) {
  const response = await fetch(`http://localhost:5000/api/events/${id}`);

  if (!response.ok) {
    let message = "Failed to fetch event";
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}
