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

export async function getRsvpStatus(id, token) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/rsvp-status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to check RSVP status";
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

export async function unregisterFromEvent(id, token) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/rsvp`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Unregister failed";
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

export async function registerForEvent(id, token) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "RSVP failed";
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
