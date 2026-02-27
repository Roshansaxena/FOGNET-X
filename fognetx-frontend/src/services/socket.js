import { io } from "socket.io-client";

let socket = null;

export function initSocket(token) {
  socket = io("http://localhost:8000", {
    transports: ["websocket"],
    auth: { token }
  });

  return socket;
}

export function getSocket() {
  return socket;
}
