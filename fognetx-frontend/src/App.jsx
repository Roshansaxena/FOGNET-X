import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Layout from "./layout/Layout";

import Overview from "./pages/Overview";
import Orchestration from "./pages/Orchestration";
import Latency from "./pages/Latency";
import Network from "./pages/Network";
import Devices from "./pages/Devices";
import Logs from "./pages/Logs";
import Login from "./pages/Login";
import OAuthSuccess from "./pages/OAuthSuccess";
import LiveExecution from "./pages/LiveExecution";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Routes>

      {/* Public routes */}
      <Route path="/login" element={<Login setToken={setToken} />} />
      <Route path="/oauth-success" element={<OAuthSuccess setToken={setToken} />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/overview" element={<Overview />} />
        <Route path="/orchestration" element={<Orchestration />} />
        <Route path="/latency" element={<Latency />} />
        <Route path="/network" element={<Network />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/logs" element={<Logs />} />
          <Route path="/live" element={<LiveExecution />} />
      </Route>

      {/* Default redirect */}
      {/*<Route*/}
      {/*  path="/"*/}
      {/*  element={*/}
      {/*    token ? <Navigate to="/overview" /> : <Navigate to="/login" />*/}
      {/*  }*/}
      {/*/>*/}
        <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
