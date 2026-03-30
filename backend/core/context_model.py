import time
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class DeviceStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"
    DEGRADED = "degraded"


@dataclass
class DeviceCapabilities:
    """Device capability profile"""
    sensors: List[str]  # List of supported sensor types
    actuators: List[str]  # List of supported actuator types
    max_sample_rate: int  # Hz
    supports_edge_ml: bool = False
    supports_encryption: bool = False
    
    def to_dict(self):
        return asdict(self)


@dataclass
class DeviceHealth:
    """Device health metrics"""
    battery_level: float  # 0-100
    signal_strength: float  # dBm
    cpu_usage: float  # 0-100
    memory_usage: float  # 0-100
    disk_usage: float  # 0-100
    temperature: float  # Device internal temp
    uptime_seconds: int
    last_heartbeat: float
    
    def to_dict(self):
        return asdict(self)
    
    @property
    def is_healthy(self) -> bool:
        """Quick health check"""
        return (
            self.battery_level > 10 and
            self.signal_strength > -100 and
            self.cpu_usage < 90 and
            self.memory_usage < 90
        )
    
    @property
    def health_score(self) -> float:
        """Calculate overall health score 0-100"""
        score = 100.0
        
        # Battery impact (0-30 points)
        if self.battery_level < 20:
            score -= 30
        elif self.battery_level < 50:
            score -= 15
        
        # Signal impact (0-25 points)
        if self.signal_strength < -90:
            score -= 25
        elif self.signal_strength < -75:
            score -= 10
        
        # Resource impact (0-25 points)
        score -= max(0, (self.cpu_usage - 70)) * 0.5
        score -= max(0, (self.memory_usage - 80)) * 0.5
        
        # Uptime bonus (0-20 points)
        if self.uptime_seconds < 60:  # Just started
            score -= 10
        elif self.uptime_seconds > 86400:  # Running for a day
            score += 5
        
        return max(0, min(100, score))


@dataclass
class NetworkContext:
    """Network quality context"""
    latency_ms: float
    packet_loss_percent: float
    jitter_ms: float
    bandwidth_kbps: float
    connection_type: str  # 'wifi', 'ethernet', 'cellular', 'lora'
    
    def to_dict(self):
        return asdict(self)
    
    @property
    def quality_score(self) -> float:
        """Network quality 0-100"""
        score = 100.0
        
        # Latency impact
        if self.latency_ms > 500:
            score -= 40
        elif self.latency_ms > 200:
            score -= 20
        elif self.latency_ms > 100:
            score -= 10
        
        # Packet loss impact
        score -= self.packet_loss_percent * 5
        
        # Jitter impact
        if self.jitter_ms > 50:
            score -= 15
        
        return max(0, min(100, score))


@dataclass
class DeviceContext:
    """Complete device context"""
    device_id: str
    device_type: str  # 'sensor', 'actuator', 'gateway', 'hybrid'
    location: str
    status: DeviceStatus
    capabilities: DeviceCapabilities
    health: DeviceHealth
    network: NetworkContext
    firmware_version: str
    
    # Runtime data
    last_sensor_data: Dict[str, Any]
    last_updated: float
    
    def to_dict(self):
        return {
            'device_id': self.device_id,
            'device_type': self.device_type,
            'location': self.location,
            'status': self.status.value,
            'capabilities': self.capabilities.to_dict(),
            'health': self.health.to_dict(),
            'network': self.network.to_dict(),
            'firmware_version': self.firmware_version,
            'last_sensor_data': self.last_sensor_data,
            'last_updated': self.last_updated
        }


class ContextModel:
    """
    Enhanced Context Model with device capabilities, health monitoring,
    and network quality tracking.
    """

    def __init__(self):
        self.state: Dict[str, DeviceContext] = {}
        self._device_history: Dict[str, List[Dict]] = {}  # Last N readings per device
        self._max_history = 100

    def update(self, device_id: str, sensor_data: Dict[str, Any]):
        """
        Update device context with new sensor data.
        Creates new context if device not exists.
        """
        current_time = time.time()
        
        # Extract device metadata from sensor data
        device_type = sensor_data.get('device_type', 'sensor')
        location = sensor_data.get('location', 'unknown')
        firmware = sensor_data.get('firmware_version', 'unknown')
        
        # Extract capabilities
        capabilities = DeviceCapabilities(
            sensors=sensor_data.get('capabilities', ['temperature', 'gas']),
            actuators=sensor_data.get('actuator_types', []),
            max_sample_rate=sensor_data.get('max_sample_rate', 1),
            supports_edge_ml=sensor_data.get('supports_edge_ml', False),
            supports_encryption=sensor_data.get('supports_encryption', False)
        )
        
        # Extract health metrics
        health = DeviceHealth(
            battery_level=sensor_data.get('battery', sensor_data.get('battery_level', 100.0)),
            signal_strength=sensor_data.get('rssi', sensor_data.get('signal_strength', -70.0)),
            cpu_usage=sensor_data.get('device_cpu', sensor_data.get('cpu', 50.0)),
            memory_usage=sensor_data.get('device_memory', sensor_data.get('memory', 50.0)),
            disk_usage=sensor_data.get('disk_usage', 0.0),
            temperature=sensor_data.get('device_temp', 40.0),
            uptime_seconds=sensor_data.get('uptime', 0),
            last_heartbeat=current_time
        )
        
        # Extract network context
        network = NetworkContext(
            latency_ms=sensor_data.get('network_latency', 50.0),
            packet_loss_percent=sensor_data.get('packet_loss', 0.0),
            jitter_ms=sensor_data.get('network_jitter', 0.0),
            bandwidth_kbps=sensor_data.get('bandwidth', 1000.0),
            connection_type=sensor_data.get('connection_type', 'wifi')
        )
        
        # Determine status
        if not health.is_healthy:
            status = DeviceStatus.DEGRADED
        else:
            status = DeviceStatus.ACTIVE
        
        # Create or update device context
        if device_id in self.state:
            # Update existing context
            existing = self.state[device_id]
            existing.health = health
            existing.network = network
            existing.last_sensor_data = sensor_data
            existing.last_updated = current_time
            existing.status = status
        else:
            # Create new context
            self.state[device_id] = DeviceContext(
                device_id=device_id,
                device_type=device_type,
                location=location,
                status=status,
                capabilities=capabilities,
                health=health,
                network=network,
                firmware_version=firmware,
                last_sensor_data=sensor_data,
                last_updated=current_time
            )
        
        # Update history
        self._update_history(device_id, sensor_data)

    def _update_history(self, device_id: str, sensor_data: Dict):
        """Maintain rolling history of sensor readings"""
        if device_id not in self._device_history:
            self._device_history[device_id] = []
        
        history = self._device_history[device_id]
        history.append({
            'timestamp': time.time(),
            'data': sensor_data.copy()
        })
        
        # Trim to max size
        if len(history) > self._max_history:
            self._device_history[device_id] = history[-self._max_history:]

    def get_device_context(self, device_id: str) -> Optional[DeviceContext]:
        """Get full device context"""
        return self.state.get(device_id)

    def get_device_summary(self, device_id: str) -> Dict[str, Any]:
        """Get summarized device info for quick checks"""
        context = self.state.get(device_id)
        if not context:
            return {}
        
        return {
            'device_id': device_id,
            'status': context.status.value,
            'health_score': context.health.health_score,
            'network_quality': context.network.quality_score,
            'battery_level': context.health.battery_level,
            'capabilities': context.capabilities.sensors,
            'last_seen': time.time() - context.last_updated
        }

    def get_global_context(self) -> Dict[str, Any]:
        """Get global system context summary"""
        total_devices = len(self.state)
        active_devices = sum(1 for d in self.state.values() if d.status == DeviceStatus.ACTIVE)
        degraded_devices = sum(1 for d in self.state.values() if d.status == DeviceStatus.DEGRADED)
        
        avg_health = sum(d.health.health_score for d in self.state.values()) / total_devices if total_devices > 0 else 0
        avg_network = sum(d.network.quality_score for d in self.state.values()) / total_devices if total_devices > 0 else 0
        
        return {
            'total_devices': total_devices,
            'active_devices': active_devices,
            'degraded_devices': degraded_devices,
            'offline_devices': total_devices - active_devices - degraded_devices,
            'average_health_score': round(avg_health, 2),
            'average_network_quality': round(avg_network, 2),
            'devices': {k: v.to_dict() for k, v in self.state.items()}
        }

    def get_devices_by_capability(self, capability: str) -> List[str]:
        """Get list of device IDs that support a specific capability"""
        return [
            device_id for device_id, context in self.state.items()
            if capability in context.capabilities.sensors
        ]

    def get_devices_by_location(self, location: str) -> List[str]:
        """Get list of device IDs in a specific location"""
        return [
            device_id for device_id, context in self.state.items()
            if context.location == location
        ]

    def get_device_history(self, device_id: str, limit: int = 20) -> List[Dict]:
        """Get historical readings for a device"""
        history = self._device_history.get(device_id, [])
        return history[-limit:] if history else []

    def check_device_health(self, device_id: str) -> Dict[str, Any]:
        """Perform comprehensive health check on a device"""
        context = self.state.get(device_id)
        if not context:
            return {'error': 'Device not found'}
        
        health = context.health
        network = context.network
        
        issues = []
        
        if health.battery_level < 20:
            issues.append(f"Low battery: {health.battery_level:.1f}%")
        if health.signal_strength < -90:
            issues.append(f"Weak signal: {health.signal_strength:.0f} dBm")
        if health.cpu_usage > 85:
            issues.append(f"High CPU usage: {health.cpu_usage:.1f}%")
        if health.memory_usage > 85:
            issues.append(f"High memory usage: {health.memory_usage:.1f}%")
        if network.latency_ms > 200:
            issues.append(f"High network latency: {network.latency_ms:.0f}ms")
        if network.packet_loss_percent > 5:
            issues.append(f"Packet loss: {network.packet_loss_percent:.1f}%")
        
        time_since_update = time.time() - context.last_updated
        if time_since_update > 60:
            issues.append(f"Stale data: {time_since_update:.0f}s since last update")
        
        return {
            'device_id': device_id,
            'health_score': health.health_score,
            'network_quality': network.quality_score,
            'is_healthy': health.is_healthy and len(issues) == 0,
            'issues': issues,
            'last_update_seconds_ago': time_since_update
        }

    def cleanup_stale_devices(self, timeout_seconds: float = 300):
        """Mark devices as offline if they haven't reported in a while"""
        current_time = time.time()
        for device_id, context in self.state.items():
            if current_time - context.last_updated > timeout_seconds:
                context.status = DeviceStatus.OFFLINE
