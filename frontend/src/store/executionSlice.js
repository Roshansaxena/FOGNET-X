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
