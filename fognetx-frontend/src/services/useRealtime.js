import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useRealtime(onMessage) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:8000", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Realtime connected");
    });

    socketRef.current.on("metrics_update", (data) => {
      onMessage("metrics", data);
    });

    socketRef.current.on("decision_event", (data) => {
      onMessage("decision", data);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Realtime disconnected");
    });

    return () => socketRef.current.disconnect();
  }, []);

  return socketRef;
}