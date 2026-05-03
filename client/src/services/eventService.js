export async function getEvents(filters = {}) {
  const { keyword, category, dateFrom, dateTo, location, sortBy } = filters;

  const params = new URLSearchParams();
  if (keyword != null && String(keyword).trim() !== "") {
    params.set("keyword", String(keyword).trim());
  }
  if (category != null && String(category).trim() !== "") {
    params.set("category", String(category).trim());
  }
  if (dateFrom != null && String(dateFrom).trim() !== "") {
    params.set("date_from", String(dateFrom).trim());
  }
  if (dateTo != null && String(dateTo).trim() !== "") {
    params.set("date_to", String(dateTo).trim());
  }
  if (location != null && String(location).trim() !== "") {
    params.set("location", String(location).trim());
  }
  if (sortBy != null && String(sortBy).trim() !== "") {
    params.set("sort", String(sortBy).trim());
  }

  const qs = params.toString();
  const url = `http://localhost:5000/api/events${qs ? `?${qs}` : ""}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let message = "Failed to fetch events";
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

/** Admin only — events with event_date before today (same filters/sort as public list). */
export async function getPastEventsForAdmin(filters = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error("Not authenticated");
  }

  const { keyword, category, dateFrom, dateTo, location, sortBy } = filters;

  const params = new URLSearchParams();
  if (keyword != null && String(keyword).trim() !== "") {
    params.set("keyword", String(keyword).trim());
  }
  if (category != null && String(category).trim() !== "") {
    params.set("category", String(category).trim());
  }
  if (dateFrom != null && String(dateFrom).trim() !== "") {
    params.set("date_from", String(dateFrom).trim());
  }
  if (dateTo != null && String(dateTo).trim() !== "") {
    params.set("date_to", String(dateTo).trim());
  }
  if (location != null && String(location).trim() !== "") {
    params.set("location", String(location).trim());
  }
  if (sortBy != null && String(sortBy).trim() !== "") {
    params.set("sort", String(sortBy).trim());
  }

  const qs = params.toString();
  const url = `http://localhost:5000/api/events/admin/past${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to fetch past events";
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export async function getEventCategories() {
  const response = await fetch("http://localhost:5000/api/events/categories");

  if (!response.ok) {
    let message = "Failed to fetch categories";
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export async function createEvent(body, token) {
  const response = await fetch("http://localhost:5000/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create event");
  }
  return data;
}

export async function getMyEvents(token) {
  const response = await fetch("http://localhost:5000/api/events/my-events", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch my events");
  }
  return data;
}

export async function getMyRegisteredEvents(token) {
  const response = await fetch("http://localhost:5000/api/events/my-registrations", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch your registrations");
  }
  return data;
}

export async function getPendingEvents(token) {
  const response = await fetch("http://localhost:5000/api/events/pending", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch pending events");
  }
  return data;
}

export async function getAllEventsForAdmin(token) {
  const response = await fetch("http://localhost:5000/api/events/all", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch all events");
  }
  return data;
}

export async function getEventById(id, tokenMaybe) {
  const token = typeof tokenMaybe === "string" ? tokenMaybe : typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:5000/api/events/${id}`, { headers });

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

export async function getEventAttendees(id, token) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/attendees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch attendees");
  }
  return data;
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

export async function deleteEventById(id, token) {
  const response = await fetch(`http://localhost:5000/api/events/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to delete event");
  }
  return data;
}

export async function approveEventById(id, token) {
  const response = await fetch(`http://localhost:5000/api/events/${id}/approve`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to approve event");
  }
  return data;
}

export async function rejectEventById(id, token, payload) {
  const rejection_reason =
    typeof payload?.rejection_reason === "string" ? payload.rejection_reason : "";
  const response = await fetch(`http://localhost:5000/api/events/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rejection_reason }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to disapprove event");
  }
  return data;
}
