import { updateMetrics } from "../store/metricsSlice";
import { addExecutionEvent } from "../store/executionSlice";

export function handleMetricsEvent(dispatch, payload) {
  const mapped = {
    total_events: payload.total_events,
    fogLatency: {
      avg: payload.avg_fog_latency,
      p95: payload.p95_fog_latency
    },
    cloudLatency: {
      avg: payload.avg_cloud_latency,
      p95: payload.p95_cloud_latency
    },
    slaViolations: payload.sla_violations,
    bandwidth: payload.bandwidth,
    riskTrend: payload.risk_trend,
    allocation: payload.allocation_summary,
    system: payload.system
  };

  dispatch(updateMetrics(mapped));
}

export function handleDecisionEvent(dispatch, payload) {
  dispatch(addExecutionEvent(payload));
}