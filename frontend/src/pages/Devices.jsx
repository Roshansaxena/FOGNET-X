import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Cpu, 
  Wifi, 
  Battery, 
  Signal, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Server,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Gauge
} from "lucide-react";
import { fetchDevices, registerDevice, updateDevice, deleteDevice } from "../services/api";

const STATUS_COLORS = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500'
};

function DeviceCard({ device, onEdit, onDelete, onRefresh }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Delete device ${device.device_id}?`)) {
      setIsDeleting(true);
      await deleteDevice(device.device_id);
      onRefresh();
    }
  };

  return (
    <motion.div
      className="glass-card p-6 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, translateY: -2 }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${device.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
            <Cpu size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{device.device_name || device.device_id}</h3>
            <p className="text-xs text-slate-400">{device.device_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[device.status] || 'bg-slate-500'} animate-pulse`}></div>
          <span className="text-xs font-semibold text-slate-300 uppercase">{device.status}</span>
        </div>
      </div>

      {/* Device Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400">Signal</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{parseFloat(device.signal_strength || -70).toFixed(1)} dBm</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Battery size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400">Battery</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{parseFloat(device.battery_level || 100).toFixed(1)}%</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400">CPU</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{parseFloat(device.cpu_usage || 0).toFixed(1)}%</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Server size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400">Memory</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{parseFloat(device.memory_usage || 0).toFixed(1)}%</div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-2">Capabilities</div>
        <div className="flex flex-wrap gap-1">
          {JSON.parse(device.capabilities || '[]').slice(0, 5).map((cap, idx) => (
            <span key={idx} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-300">
              {cap}
            </span>
          ))}
          {JSON.parse(device.capabilities || '[]').length > 5 && (
            <span className="px-2 py-1 bg-slate-500/10 border border-slate-500/20 rounded text-xs text-slate-400">
              +{JSON.parse(device.capabilities || '[]').length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Last Seen */}
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
        <CheckCircle size={12} />
        <span>Last seen: {new Date(device.last_seen).toLocaleString()}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(device)}
          className="flex-1 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Edit size={14} />
          Edit
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-2 bg-slate-500/20 border border-slate-500/30 rounded-lg text-slate-300 hover:bg-slate-500/30 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function DeviceModal({ isOpen, onClose, onSave, device }) {
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    device_type: 'iot_sensor',
    capabilities: [],
    location: '',
    status: 'offline'
  });

  useEffect(() => {
    if (device) {
      setFormData({
        device_id: device.device_id || '',
        device_name: device.device_name || '',
        device_type: device.device_type || 'iot_sensor',
        capabilities: JSON.parse(device.capabilities || '[]'),
        location: device.location || '',
        status: device.status || 'offline'
      });
    } else {
      setFormData({
        device_id: '',
        device_name: '',
        device_type: 'iot_sensor',
        capabilities: [],
        location: '',
        status: 'offline'
      });
    }
  }, [device]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      capabilities: JSON.stringify(formData.capabilities)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-2xl border border-slate-700/50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {device ? 'Edit Device' : 'Register New Device'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Device ID</label>
              <input
                type="text"
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="DEV-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Device Name</label>
              <input
                type="text"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="Factory Sensor 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Device Type</label>
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1rem'
                }}
              >
                <option value="iot_sensor" className="bg-slate-800 text-white">IoT Sensor</option>
                <option value="gateway" className="bg-slate-800 text-white">Gateway</option>
                <option value="actuator" className="bg-slate-800 text-white">Actuator</option>
                <option value="controller" className="bg-slate-800 text-white">Controller</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1rem'
                }}
              >
                <option value="offline" className="bg-slate-800 text-white">Offline</option>
                <option value="online" className="bg-slate-800 text-white">Online</option>
                <option value="warning" className="bg-slate-800 text-white">Warning</option>
                <option value="critical" className="bg-slate-800 text-white">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="Building A, Floor 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Capabilities</label>
            <div className="grid grid-cols-3 gap-2">
              {['temperature', 'humidity', 'gas', 'motion', 'pressure', 'tank_level', 'power', 'vibration', 'light'].map((cap) => (
                <label key={cap} className="flex items-center gap-2 p-3 bg-white/5 border border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes(cap)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, capabilities: [...formData.capabilities, cap] });
                      } else {
                        setFormData({ ...formData, capabilities: formData.capabilities.filter(c => c !== cap) });
                      }
                    }}
                    className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-300 capitalize">{cap.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-500/20 border border-slate-500/30 rounded-lg text-slate-300 hover:bg-slate-500/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-500 border border-indigo-500/50 rounded-lg text-white hover:bg-indigo-600 transition-colors font-medium"
            >
              {device ? 'Update Device' : 'Register Device'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const loadDevices = async () => {
    try {
      const data = await fetchDevices();
      setDevices(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Check for global search from header
  useEffect(() => {
    const globalSearch = localStorage.getItem('globalSearch');
    if (globalSearch) {
      setSearchTerm(globalSearch);
      localStorage.removeItem('globalSearch');
    }
  }, []);

  const handleSave = async (deviceData) => {
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.device_id, deviceData);
      } else {
        await registerDevice(deviceData);
      }
      setModalOpen(false);
      setEditingDevice(null);
      loadDevices();
    } catch (error) {
      console.error('Failed to save device:', error);
      alert('Failed to save device');
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = (device.device_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || device.device_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    critical: devices.filter(d => d.status === 'critical').length
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        className="glass-card p-8 border border-slate-700/50 relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Device Management</h1>
              <p className="text-slate-400">Monitor and manage all connected IoT devices</p>
            </div>
            <button
              onClick={() => {
                setEditingDevice(null);
                setModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Register Device
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-1">Total Devices</div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
              <div className="text-sm text-emerald-400 mb-1">Online</div>
              <div className="text-3xl font-bold text-emerald-400">{stats.online}</div>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
              <div className="text-sm text-amber-400 mb-1">Warning</div>
              <div className="text-3xl font-bold text-amber-400">{stats.warning}</div>
            </div>
            <div className="bg-rose-500/10 rounded-lg p-4 border border-rose-500/20">
              <div className="text-sm text-rose-400 mb-1">Critical</div>
              <div className="text-3xl font-bold text-rose-400">{stats.critical}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1rem',
            paddingRight: '2.5rem'
          }}
        >
          <option value="all" className="bg-slate-800 text-white">All Types</option>
          <option value="iot_sensor" className="bg-slate-800 text-white">Sensors</option>
          <option value="gateway" className="bg-slate-800 text-white">Gateways</option>
          <option value="actuator" className="bg-slate-800 text-white">Actuators</option>
          <option value="controller" className="bg-slate-800 text-white">Controllers</option>
        </select>
        <button
          onClick={loadDevices}
          className="px-4 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 hover:bg-indigo-500/30 transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Devices Found</h3>
          <p className="text-slate-400">Register your first device to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map((device, index) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              onEdit={(d) => {
                setEditingDevice(d);
                setModalOpen(true);
              }}
              onDelete={loadDevices}
              onRefresh={loadDevices}
            />
          ))}
        </div>
      )}

      {/* Device Modal */}
      <DeviceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDevice(null);
        }}
        onSave={handleSave}
        device={editingDevice}
      />
    </div>
  );
}
