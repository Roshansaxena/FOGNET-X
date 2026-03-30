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

// Device Management APIs
export async function fetchDevices() {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`/api/devices`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg);
  return data;
}

export async function registerDevice(deviceData) {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`/api/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg);
  return data;
}

export async function updateDevice(deviceId, deviceData) {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`/api/devices/${deviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(deviceData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg);
  return data;
}

export async function deleteDevice(deviceId) {
  const token = localStorage.getItem("token");
  
  const res = await fetch(`/api/devices/${deviceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg);
  return data;
}
