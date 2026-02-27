#!/bin/bash

echo "Upgrading FOGNET-X Frontend Architecture..."

FRONTEND_DIR="fognetx-frontend/src"

# Create directories
mkdir -p $FRONTEND_DIR/store
mkdir -p $FRONTEND_DIR/core
mkdir -p $FRONTEND_DIR/utils
mkdir -p $FRONTEND_DIR/services

# Create ringBuffer.js
cat <<EOF > $FRONTEND_DIR/utils/ringBuffer.js
export class RingBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = [];
  }

  push(item) {
    if (this.buffer.length >= this.size) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  getAll() {
    return this.buffer;
  }

  clear() {
    this.buffer = [];
  }
}
EOF

echo "Created ringBuffer.js"

# Create metricsSlice.js
cat <<EOF > $FRONTEND_DIR/store/metricsSlice.js
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
EOF

echo "Created metricsSlice.js"

# Create executionSlice.js
cat <<EOF > $FRONTEND_DIR/store/executionSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  events: []
};

const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    addExecutionEvent(state, action) {
      state.events.push(action.payload);
      if (state.events.length > 1000) {
        state.events.shift();
      }
    },
    clearExecution(state) {
      state.events = [];
    }
  }
});

export const { addExecutionEvent, clearExecution } = executionSlice.actions;
export default executionSlice.reducer;
EOF

echo "Created executionSlice.js"

# Create store/index.js
cat <<EOF > $FRONTEND_DIR/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import metricsReducer from "./metricsSlice";
import executionReducer from "./executionSlice";

export const store = configureStore({
  reducer: {
    metrics: metricsReducer,
    execution: executionReducer
  }
});
EOF

echo "Created store/index.js"

# Create eventProcessor.js
cat <<EOF > $FRONTEND_DIR/core/eventProcessor.js
import { updateMetrics } from "../store/metricsSlice";
import { addExecutionEvent } from "../store/executionSlice";

export function handleMetricsEvent(dispatch, payload) {
  dispatch(updateMetrics(payload));
}

export function handleDecisionEvent(dispatch, payload) {
  dispatch(addExecutionEvent(payload));
}
EOF

echo "Created eventProcessor.js"

# Create socket.js
cat <<EOF > $FRONTEND_DIR/services/socket.js
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
EOF

echo "Created socket.js"

# Inject Redux Provider into main.jsx
MAIN_FILE="$FRONTEND_DIR/main.jsx"

if ! grep -q "Provider" $MAIN_FILE; then
  sed -i '1i import { Provider } from "react-redux";' $MAIN_FILE
  sed -i '1i import { store } from "./store";' $MAIN_FILE
  sed -i 's/<App \/>/<Provider store={store}><App \/><\/Provider>/' $MAIN_FILE
  echo "Injected Redux Provider into main.jsx"
else
  echo "Redux Provider already exists in main.jsx"
fi

echo "Frontend architecture scaffold complete."