import { useState, useEffect } from "react";
import axios from "axios";
import {
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Power,
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function DeviceControl() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Thresholds state
  const [thresholds, setThresholds] = useState({
    temp_warning: 35,
    temp_critical: 45,
    temp_emergency: 55,
    gas_warning: 400,
    gas_critical: 700,
    gas_emergency: 900,
    humidity_warning: 80,
    humidity_critical: 90,
    tank_min: 10,
    tank_max: 100,
    pressure_warning: 1050,
    pressure_critical: 1100,
    auto_fan_enabled: true,
    auto_vent_enabled: true,
    auto_pump_enabled: true,
    auto_alarm_enabled: true
  });

  // Actuators state
  const [actuators, setActuators] = useState({
    fan_state: 'OFF',
    vent_state: 'CLOSED',
    pump_state: 'OFF',
    alarm_state: 'OFF',
    control_mode: 'AUTO'
  });

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, []);

  // Load thresholds and actuators when device selected
  useEffect(() => {
    if (selectedDevice) {
      loadDeviceControl(selectedDevice);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      const res = await axios.get("/api/devices");
      setDevices(res.data);
      
      // Auto-select first device if none selected
      if (res.data.length > 0 && !selectedDevice) {
        setSelectedDevice(res.data[0].device_id);
      }
      
      if (res.data.length === 0) {
        console.warn("No devices found. Devices will appear when they send data.");
      }
    } catch (err) {
      console.error("Failed to load devices:", err);
    }
  };

  const loadDeviceControl = async (deviceId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/device-control/${deviceId}`);
      
      if (res.data.thresholds && Object.keys(res.data.thresholds).length > 0) {
        setThresholds({
          temp_warning: res.data.thresholds.temp_warning || 35,
          temp_critical: res.data.thresholds.temp_critical || 45,
          temp_emergency: res.data.thresholds.temp_emergency || 55,
          gas_warning: res.data.thresholds.gas_warning || 400,
          gas_critical: res.data.thresholds.gas_critical || 700,
          gas_emergency: res.data.thresholds.gas_emergency || 900,
          humidity_warning: res.data.thresholds.humidity_warning || 80,
          humidity_critical: res.data.thresholds.humidity_critical || 90,
          tank_min: res.data.thresholds.tank_min || 10,
          tank_max: res.data.thresholds.tank_max || 100,
          pressure_warning: res.data.thresholds.pressure_warning || 1050,
          pressure_critical: res.data.thresholds.pressure_critical || 1100,
          auto_fan_enabled: Boolean(res.data.thresholds.auto_fan_enabled),
          auto_vent_enabled: Boolean(res.data.thresholds.auto_vent_enabled),
          auto_pump_enabled: Boolean(res.data.thresholds.auto_pump_enabled),
          auto_alarm_enabled: Boolean(res.data.thresholds.auto_alarm_enabled)
        });
      }

      if (res.data.actuators && Object.keys(res.data.actuators).length > 0) {
        setActuators({
          fan_state: res.data.actuators.fan_state || 'OFF',
          vent_state: res.data.actuators.vent_state || 'CLOSED',
          pump_state: res.data.actuators.pump_state || 'OFF',
          alarm_state: res.data.actuators.alarm_state || 'OFF',
          control_mode: res.data.actuators.control_mode || 'AUTO'
        });
      }
    } catch (err) {
      console.error("Failed to load device control:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveThresholds = async () => {
    try {
      await axios.put(`/api/thresholds/${selectedDevice}`, thresholds);
      alert("✅ Thresholds saved successfully!");
    } catch (err) {
      console.error("Failed to save thresholds:", err);
      alert("❌ Failed to save thresholds");
    }
  };

  const controlActuator = async (actuator, action) => {
    try {
      await axios.post(`/api/actuators/${selectedDevice}/control`, {
        actuator,
        action,
        mode: actuators.control_mode
      });
      
      // Update local state
      setActuators(prev => ({
        ...prev,
        [`${actuator}_state`]: action
      }));
    } catch (err) {
      console.error("Failed to control actuator:", err);
      alert("❌ Failed to control actuator");
    }
  };

  const toggleMode = async () => {
    const newMode = actuators.control_mode === 'AUTO' ? 'MANUAL' : 'AUTO';
    try {
      await axios.post(`/api/actuators/${selectedDevice}/auto-mode`, {
        auto_mode: newMode === 'AUTO'
      });
      
      setActuators(prev => ({
        ...prev,
        control_mode: newMode
      }));
    } catch (err) {
      console.error("Failed to toggle mode:", err);
    }
  };

  if (!selectedDevice) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-xl font-bold text-white mb-2">No Devices Found</h2>
          <p className="text-gray-400">Connect a device to start controlling thresholds and actuators</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Device Control Center
          </h1>
          <p className="text-gray-400 mt-1">Configure thresholds and control actuators</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.map(device => (
              <option key={device.device_id} value={device.device_id}>
                {device.device_name || device.device_id}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => loadDeviceControl(selectedDevice)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Control Mode Toggle */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Control Mode</h3>
            <p className="text-sm text-gray-400">
              {actuators.control_mode === 'AUTO' 
                ? 'Device automatically responds to sensor thresholds' 
                : 'Manual control only - device ignores automatic triggers'}
            </p>
          </div>
          
          <button
            onClick={toggleMode}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              actuators.control_mode === 'AUTO'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            } text-white`}
          >
            {actuators.control_mode === 'AUTO' ? '🤖 AUTO' : '🔧 MANUAL'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threshold Configuration */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Threshold Configuration
            </h2>

            <div className="space-y-6">
              {/* Temperature Thresholds */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature (°C)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Warning</label>
                    <input
                      type="number"
                      value={thresholds.temp_warning}
                      onChange={(e) => setThresholds({...thresholds, temp_warning: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Critical</label>
                    <input
                      type="number"
                      value={thresholds.temp_critical}
                      onChange={(e) => setThresholds({...thresholds, temp_critical: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Emergency</label>
                    <input
                      type="number"
                      value={thresholds.temp_emergency}
                      onChange={(e) => setThresholds({...thresholds, temp_emergency: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gas Thresholds */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  Gas Level (PPM)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Warning</label>
                    <input
                      type="number"
                      value={thresholds.gas_warning}
                      onChange={(e) => setThresholds({...thresholds, gas_warning: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Critical</label>
                    <input
                      type="number"
                      value={thresholds.gas_critical}
                      onChange={(e) => setThresholds({...thresholds, gas_critical: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Emergency</label>
                    <input
                      type="number"
                      value={thresholds.gas_emergency}
                      onChange={(e) => setThresholds({...thresholds, gas_emergency: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Humidity Thresholds */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Humidity (%)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Warning</label>
                    <input
                      type="number"
                      value={thresholds.humidity_warning}
                      onChange={(e) => setThresholds({...thresholds, humidity_warning: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Critical</label>
                    <input
                      type="number"
                      value={thresholds.humidity_critical}
                      onChange={(e) => setThresholds({...thresholds, humidity_critical: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Control Toggles */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-400 mb-3">Auto-Control Enabled</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'auto_fan_enabled', label: 'Fan', icon: '🌀' },
                    { key: 'auto_vent_enabled', label: 'Vent', icon: '💨' },
                    { key: 'auto_pump_enabled', label: 'Pump', icon: '💧' },
                    { key: 'auto_alarm_enabled', label: 'Alarm', icon: '🚨' }
                  ].map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center justify-between p-2 bg-slate-800 rounded cursor-pointer hover:bg-slate-700">
                      <span className="text-white text-sm">{icon} {label}</span>
                      <input
                        type="checkbox"
                        checked={thresholds[key]}
                        onChange={(e) => setThresholds({...thresholds, [key]: e.target.checked})}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveThresholds}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-5 h-5" />
                Save Thresholds
              </button>
            </div>
          </div>

          {/* Actuator Control */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Power className="w-6 h-6" />
              Actuator Control
            </h2>

            <div className="space-y-4">
              {/* Fan Control */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    🌀 Exhaust Fan
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    actuators.fan_state === 'ON' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {actuators.fan_state}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlActuator('fan', 'ON')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.fan_state === 'ON'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    ON
                  </button>
                  <button
                    onClick={() => controlActuator('fan', 'OFF')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.fan_state === 'OFF'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    OFF
                  </button>
                </div>
              </div>

              {/* Vent Control */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    💨 Air Vent
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    actuators.vent_state === 'OPEN' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {actuators.vent_state}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlActuator('vent', 'OPEN')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.vent_state === 'OPEN'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    OPEN
                  </button>
                  <button
                    onClick={() => controlActuator('vent', 'CLOSE')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.vent_state === 'CLOSED'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    CLOSE
                  </button>
                </div>
              </div>

              {/* Pump Control */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    💧 Water Pump
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    actuators.pump_state === 'ON' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {actuators.pump_state}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlActuator('pump', 'ON')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.pump_state === 'ON'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    ON
                  </button>
                  <button
                    onClick={() => controlActuator('pump', 'OFF')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.pump_state === 'OFF'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    OFF
                  </button>
                </div>
              </div>

              {/* Alarm Control */}
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    🚨 Alarm/Buzzer
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    actuators.alarm_state === 'ON' ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    {actuators.alarm_state}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlActuator('alarm', 'ON')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.alarm_state === 'ON'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    ON
                  </button>
                  <button
                    onClick={() => controlActuator('alarm', 'OFF')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      actuators.alarm_state === 'OFF'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white`}
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    OFF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
