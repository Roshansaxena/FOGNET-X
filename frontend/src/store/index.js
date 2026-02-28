import { configureStore } from "@reduxjs/toolkit";
import metricsReducer from "./metricsSlice";
import executionReducer from "./executionSlice";

export const store = configureStore({
  reducer: {
    metrics: metricsReducer,
    execution: executionReducer
  }
});
