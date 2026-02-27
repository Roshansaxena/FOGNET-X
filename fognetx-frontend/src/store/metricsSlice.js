import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  totalEvents: 0,
  fogLatency: { avg: 0, p95: 0 },
  cloudLatency: { avg: 0, p95: 0 },
  slaViolations: 0,
  bandwidth: {},
  riskTrend: [],
  allocation: { fog: 0, cloud: 0, hybrid: 0 },
  system: {}
};

const metricsSlice = createSlice({
  name: "metrics",
  initialState,
  reducers: {
    updateMetrics(state, action) {
      return { ...state, ...action.payload };
    }
  }
});

export const { updateMetrics } = metricsSlice.actions;
export default metricsSlice.reducer;
