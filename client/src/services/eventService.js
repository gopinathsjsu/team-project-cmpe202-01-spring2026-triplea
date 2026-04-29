export async function getEvents() {
  const response = await fetch("http://localhost:5000/api/events");

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}
