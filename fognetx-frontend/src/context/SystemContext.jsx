import { createContext, useState } from "react";

export const SystemContext = createContext();

export function SystemProvider({ children }) {
  const [metrics, setMetrics] = useState({});
  const [decisions, setDecisions] = useState([
  {
    event_id: "E-1",
    risk_score: 0.82,
    execution_target: "FOG_EXECUTION",
    predicted_latency: 18,
    actual_latency: 21
  }
]);

  return (
    <SystemContext.Provider
      value={{
        metrics,
        decisions,
        setMetrics,
        setDecisions,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}