export async function fetchDashboard() {
  const token = localStorage.getItem("token");

  const res = await fetch(`/api/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.msg);

  return data;
}

export async function registerUser(data) {
  const res = await fetch(`/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) throw new Error(result.msg);

  return result;
}

export async function loginUser(data) {
  const res = await fetch(`/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) throw new Error(result.msg);

  return result;
}
