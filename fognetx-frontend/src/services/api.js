const BASE_URL = "http://localhost:8000";

export async function fetchDashboard() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}