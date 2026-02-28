import { io } from "socket.io-client";

let socket = null;

export function initSocket(token) {
  socket = io({
  path: "/socket.io",
  transports: ["websocket"]
})

  return socket;
}

export function getSocket() {
  return socket;
}
