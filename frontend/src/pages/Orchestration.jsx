import { useEffect, useState } from "react";
import axios from "axios";

export default function Orchestration() {
  const [state, setState] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`
  };

  // -----------------------------------
  // FETCH ORCHESTRATION STATE
  // -----------------------------------
  const fetchState = async () => {
    try {
      const res = await axios.get(
        "api/orchestration/state",
        { headers }
      );
      setState(res.data);
    } catch (err) {
      console.error("Failed to fetch orchestration state", err);
    }
  };

  // -----------------------------------
  // FETCH RECENT DECISIONS
  // -----------------------------------
  const fetchRecent = async () => {
    try {
      const res = await axios.get(
        "api/orchestration/recent",
        { headers }
      );
      setRecent(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch recent decisions", err);
    }
  };

  // -----------------------------------
  // UPDATE CONFIG
  // -----------------------------------
  const updateConfig = async () => {
    try {
      await axios.post(
        "api/orchestration/config",
        {
          mode: state.mode,
          risk_threshold: state.risk_threshold,
          sla_fog_ms: state.sla_fog_ms,
          sla_cloud_ms: state.sla_cloud_ms,
          cpu_threshold: state.cpu_threshold
        },
        { headers }
      );

      alert("Configuration Updated");
    } catch (err) {
      console.error("Failed to update config", err);
    }
  };

  useEffect(() => {
    fetchState();
    fetchRecent();

    // const interval = setInterval(() => {
    //   fetchState();
    //   fetchRecent();
    // }, 5000);
    //
    // return () => clearInterval(interval);
  }, []);

  if (!state) return <div>No Data Yet</div>;

  const totalAlloc =
    state.allocation.FOG_EXECUTION +
    state.allocation.CLOUD_EXECUTION +
    state.allocation.FOG_AND_CLOUD;

  const fogPercent = totalAlloc
    ? ((state.allocation.FOG_EXECUTION / totalAlloc) * 100).toFixed(1)
    : 0;

  const cloudPercent = totalAlloc
    ? ((state.allocation.CLOUD_EXECUTION / totalAlloc) * 100).toFixed(1)
    : 0;

  const hybridPercent = totalAlloc
    ? ((state.allocation.FOG_AND_CLOUD / totalAlloc) * 100).toFixed(1)
    : 0;

  return (
  <div className="page-container">

    <h2 className="page-title">Orchestration Control Panel</h2>

    {/* ========================= */}
    {/* CONFIGURATION CARD */}
    {/* ========================= */}

    <div className="card config-card">
      <div className="grid-2">

        <div>
          <label>Execution Mode</label>
          <select
            value={state.mode}
            onChange={(e) =>
              setState({ ...state, mode: e.target.value })
            }
          >
            <option value="dynamic">Dynamic</option>
            <option value="force_fog">Force Fog</option>
            <option value="force_cloud">Force Cloud</option>
            <option value="hybrid">Hybrid Only</option>
          </select>
        </div>

        <div>
          <label>Risk Threshold: {state.risk_threshold}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={state.risk_threshold}
            onChange={(e) =>
              setState({
                ...state,
                risk_threshold: parseFloat(e.target.value)
              })
            }
          />
        </div>

        <div>
          <label>SLA Fog (ms)</label>
          <input
            type="number"
            value={state.sla_fog_ms}
            onChange={(e) =>
              setState({
                ...state,
                sla_fog_ms: parseInt(e.target.value)
              })
            }
          />
        </div>

        <div>
          <label>SLA Cloud (ms)</label>
          <input
            type="number"
            value={state.sla_cloud_ms}
            onChange={(e) =>
              setState({
                ...state,
                sla_cloud_ms: parseInt(e.target.value)
              })
            }
          />
        </div>

      </div>

      <button className="primary-btn" onClick={updateConfig}>
        Apply Changes
      </button>
    </div>

    {/* ========================= */}
    {/* SYSTEM METRICS */}
    {/* ========================= */}

    <div className="grid-2">

      <div className="card metric-card">
        <h3>System Health</h3>
        <p>CPU Usage: <strong>{state.fog_cpu}%</strong></p>
        <p>Memory Usage: <strong>{state.memory_usage}%</strong></p>
      </div>

      <div className="card metric-card">
  <h3>SLA Pressure</h3>

  <div className="sla-bar">
    <div
      className={`sla-fill ${
        state.sla_pressure > 0.2
          ? "danger"
          : state.sla_pressure > 0.1
          ? "warning"
          : "healthy"
      }`}
      style={{ width: `${state.sla_pressure * 100}%` }}
    />
  </div>

  <p className="sla-text">
    {(state.sla_pressure * 100).toFixed(2)}%
  </p>
</div>

    </div>

    {/* ========================= */}
    {/* ALLOCATION */}
    {/* ========================= */}

    <div className="card">
  <h3>Allocation Distribution (Last 200 Events)</h3>

  <div className="alloc-row">
    <span>Fog</span>
    <div className="alloc-bar">
      <div
        className="alloc-fill fog"
        style={{ width: `${fogPercent}%` }}
      />
    </div>
    <span>{fogPercent}%</span>
  </div>

  <div className="alloc-row">
    <span>Cloud</span>
    <div className="alloc-bar">
      <div
        className="alloc-fill cloud"
        style={{ width: `${cloudPercent}%` }}
      />
    </div>
    <span>{cloudPercent}%</span>
  </div>

  <div className="alloc-row">
    <span>Hybrid</span>
    <div className="alloc-bar">
      <div
        className="alloc-fill hybrid"
        style={{ width: `${hybridPercent}%` }}
      />
    </div>
    <span>{hybridPercent}%</span>
  </div>
</div>
    {/* ========================= */}
    {/* RECENT DECISIONS */}
    {/* ========================= */}

    <div className="card">
      <h3>Recent Decisions</h3>
      <table className="decision-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Device</th>
            <th>Risk</th>
            <th>Decision</th>
            <th>Latency</th>
            <th>SLA</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((d, i) => (
            <tr key={i} className={d.sla_breach ? "breach-row" : "normal-row"}>
              <td>{d.timestamp}</td>
              <td>{d.device_id}</td>
              <td>{d.risk}</td>
              <td>
               <span className={`decision-badge ${d.decision}`}>
                {d.decision}
               </span>
              </td>
              <td>{d.latency} ms</td>
              <td>
                <span className={d.sla_breach ? "sla-breach" : "sla-ok"}>
                  {d.sla_breach ? "SLA Breach" : "OK"}
                </span>
              </td>
            </tr>

          ))}
        </tbody>
      </table>
    </div>

  </div>
);
}