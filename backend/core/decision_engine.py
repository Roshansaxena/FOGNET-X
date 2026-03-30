import joblib
import pandas as pd
import json
import os
from typing import Dict, Tuple, Any, List
from dataclasses import dataclass
from enum import Enum

class SeverityLevel(Enum):
    NORMAL = 0
    INFO = 1
    WARNING = 2
    CRITICAL = 3
    EMERGENCY = 4

@dataclass
class SensorReading:
    """Standardized sensor reading with metadata"""
    value: float
    sensor_type: str
    unit: str
    timestamp: float
    confidence: float = 1.0  # 0-1, sensor quality
    
@dataclass
class DeviceContext:
    """Device context for decision making"""
    device_id: str
    battery_level: float  # 0-100
    signal_strength: float  # RSSI dBm
    cpu_usage: float  # 0-100
    memory_usage: float  # 0-100
    network_latency: float  # ms
    packet_loss: float  # 0-100
    uptime: int  # seconds
    capabilities: List[str]


class DecisionEngine:
    """
    Enhanced Decision Engine with multi-sensor fusion and context-aware risk assessment.
    """

    # Sensor weight configuration for risk calculation
    SENSOR_WEIGHTS = {
        'gas': 0.25,
        'temperature': 0.20,
        'smoke': 0.20,
        'fire': 0.25,
        'vibration': 0.10,
        'motion': 0.05,
        'sound_db': 0.05,
        'air_quality_index': 0.15,
        'humidity': 0.05,
        'pressure': 0.05,
        'tank_level': 0.10,
        'flow_rate': 0.10,
        'power_consumption': 0.05,
    }
    
    # Threshold configurations (can be overridden per device)
    DEFAULT_THRESHOLDS = {
        'temperature': {'warning': 35, 'critical': 45, 'emergency': 55},
        'gas': {'warning': 400, 'critical': 700, 'emergency': 900},
        'humidity': {'warning': 80, 'critical': 90, 'emergency': 95},
        'pressure': {'warning_min': 980, 'warning_max': 1030, 'critical_min': 950, 'critical_max': 1050},
        'air_quality_index': {'warning': 100, 'critical': 150, 'emergency': 200},
        'tank_level': {'warning_min': 10, 'critical_min': 5, 'emergency_min': 2},
        'vibration': {'warning': 5.0, 'critical': 10.0, 'emergency': 20.0},
        'sound_db': {'warning': 70, 'critical': 85, 'emergency': 100},
        'battery': {'warning': 30, 'critical': 20, 'emergency': 10},
        'signal_strength': {'warning': -80, 'critical': -90, 'emergency': -100},
    }
    
    # Device health impact on risk score
    DEVICE_HEALTH_WEIGHT = 0.15

    def __init__(self):
        from core.config import PROJECT_ROOT
        
        model_path = os.path.join(PROJECT_ROOT, "risk_model.pkl")
        try:
            self.model = joblib.load(model_path)
        except (FileNotFoundError, Exception):
            self.model = None
            
        self._load_thresholds()
    
    def _load_thresholds(self):
        """Load thresholds from database or use defaults"""
        # TODO: Load from database for per-device customization
        self.thresholds = self.DEFAULT_THRESHOLDS.copy()

    def evaluate(self, sensor_data: Dict[str, Any], device_context: DeviceContext = None) -> Tuple[str, float, Dict]:
        """
        Evaluate sensor data and return severity, risk score, and detailed analysis.
        
        Returns:
            Tuple of (severity_label, risk_score_0_to_1, analysis_dict)
        """
        # Normalize all sensor inputs
        normalized_data = self._normalize_sensors(sensor_data)
        
        # Calculate individual sensor risks
        sensor_risks = self._calculate_sensor_risks(normalized_data)
        
        # Calculate base risk score from sensors
        base_risk = self._calculate_weighted_risk(sensor_risks, normalized_data)
        
        # Apply device context adjustments
        if device_context:
            context_adjustment = self._calculate_context_adjustment(device_context)
            final_risk = min(1.0, base_risk + context_adjustment)
        else:
            context_adjustment = 0.0
            final_risk = base_risk
            device_context = self._create_default_context(sensor_data)
        
        # Determine severity
        severity = self._determine_severity(final_risk, sensor_risks, normalized_data)
        
        # Build detailed analysis
        analysis = {
            'sensor_risks': sensor_risks,
            'base_risk': round(base_risk, 4),
            'context_adjustment': round(context_adjustment, 4),
            'final_risk': round(final_risk, 4),
            'dominant_sensors': self._get_dominant_sensors(sensor_risks),
            'device_health_score': self._calculate_device_health_score(device_context),
            'recommendations': self._generate_recommendations(severity, sensor_risks, device_context)
        }
        
        return severity, round(final_risk, 3), analysis

    def _normalize_sensors(self, sensor_data: Dict[str, Any]) -> Dict[str, float]:
        """Normalize various sensor input formats to standard values."""
        normalized = {}
        
        # Temperature (Celsius)
        temp = sensor_data.get('temperature', sensor_data.get('temp', 25))
        normalized['temperature'] = float(temp)
        
        # Gas (PPM or raw ADC)
        gas = sensor_data.get('gas', sensor_data.get('gas_ppm', 0))
        # Normalize if raw ADC (0-1023)
        if gas > 1000:
            normalized['gas'] = gas  # Assume already PPM
        else:
            normalized['gas'] = gas * 1.0  # Keep as-is for now
            
        # Humidity (%)
        normalized['humidity'] = float(sensor_data.get('humidity', 50))
        
        # Pressure (hPa)
        normalized['pressure'] = float(sensor_data.get('pressure', 1013))
        
        # Light (lux)
        normalized['light_lux'] = float(sensor_data.get('light_lux', sensor_data.get('light', 500)))
        
        # Motion (boolean to 0/1)
        motion = sensor_data.get('motion', sensor_data.get('pir', 0))
        normalized['motion'] = 1.0 if motion in [1, True, 'true', 'True'] else 0.0
        
        # Sound (dB)
        normalized['sound_db'] = float(sensor_data.get('sound_db', sensor_data.get('noise', 40)))
        
        # Vibration (Hz or amplitude)
        normalized['vibration'] = float(sensor_data.get('vibration', 0))
        
        # Air Quality Index
        normalized['air_quality_index'] = float(sensor_data.get('air_quality_index', 
                                                                sensor_data.get('aqi', 50)))
        
        # Tank Level (%)
        normalized['tank_level'] = float(sensor_data.get('tank_level', 
                                                         sensor_data.get('tank', 50)))
        
        # Flow Rate (L/min)
        normalized['flow_rate'] = float(sensor_data.get('flow_rate', 0))
        
        # Power consumption (W)
        normalized['power_consumption'] = float(sensor_data.get('power_consumption', 
                                                                sensor_data.get('power', 0)))
        
        # Voltage (V)
        normalized['voltage'] = float(sensor_data.get('voltage', 0))
        
        # Current (A)
        normalized['current_amp'] = float(sensor_data.get('current', 
                                                          sensor_data.get('current_amp', 0)))
        
        return normalized

    def _calculate_sensor_risks(self, normalized_data: Dict[str, float]) -> Dict[str, float]:
        """Calculate individual risk scores for each sensor."""
        risks = {}
        
        # Temperature risk
        temp = normalized_data['temperature']
        thresholds = self.thresholds['temperature']
        if temp >= thresholds['emergency']:
            risks['temperature'] = 1.0
        elif temp >= thresholds['critical']:
            risks['temperature'] = 0.7 + 0.3 * (temp - thresholds['critical']) / (thresholds['emergency'] - thresholds['critical'])
        elif temp >= thresholds['warning']:
            risks['temperature'] = 0.4 + 0.3 * (temp - thresholds['warning']) / (thresholds['critical'] - thresholds['warning'])
        else:
            risks['temperature'] = max(0, 0.4 * (temp - 20) / (thresholds['warning'] - 20))
        
        # Gas risk
        gas = normalized_data['gas']
        thresholds = self.thresholds['gas']
        if gas >= thresholds['emergency']:
            risks['gas'] = 1.0
        elif gas >= thresholds['critical']:
            risks['gas'] = 0.7 + 0.3 * (gas - thresholds['critical']) / (thresholds['emergency'] - thresholds['critical'])
        elif gas >= thresholds['warning']:
            risks['gas'] = 0.4 + 0.3 * (gas - thresholds['warning']) / (thresholds['critical'] - thresholds['warning'])
        else:
            risks['gas'] = max(0, 0.4 * gas / thresholds['warning'])
        
        # Humidity risk (high humidity can indicate problems)
        humidity = normalized_data['humidity']
        thresholds = self.thresholds['humidity']
        if humidity >= thresholds['emergency']:
            risks['humidity'] = 0.8
        elif humidity >= thresholds['critical']:
            risks['humidity'] = 0.5 + 0.3 * (humidity - thresholds['critical']) / (thresholds['emergency'] - thresholds['critical'])
        elif humidity >= thresholds['warning']:
            risks['humidity'] = 0.2 + 0.3 * (humidity - thresholds['warning']) / (thresholds['critical'] - thresholds['warning'])
        else:
            risks['humidity'] = 0.0
        
        # Air Quality risk
        aqi = normalized_data['air_quality_index']
        thresholds = self.thresholds['air_quality_index']
        if aqi >= thresholds['emergency']:
            risks['air_quality_index'] = 1.0
        elif aqi >= thresholds['critical']:
            risks['air_quality_index'] = 0.7 + 0.3 * (aqi - thresholds['critical']) / (thresholds['emergency'] - thresholds['critical'])
        elif aqi >= thresholds['warning']:
            risks['air_quality_index'] = 0.4 + 0.3 * (aqi - thresholds['warning']) / (thresholds['critical'] - thresholds['warning'])
        else:
            risks['air_quality_index'] = max(0, 0.4 * aqi / thresholds['warning'])
        
        # Tank level risk (low level is bad)
        tank = normalized_data['tank_level']
        thresholds = self.thresholds['tank_level']
        if tank <= thresholds.get('emergency_min', 2):
            risks['tank_level'] = 0.9
        elif tank <= thresholds.get('critical_min', 5):
            risks['tank_level'] = 0.6 + 0.3 * (thresholds['critical_min'] - tank) / thresholds['critical_min']
        elif tank <= thresholds.get('warning_min', 10):
            risks['tank_level'] = 0.3 + 0.3 * (thresholds['warning_min'] - tank) / thresholds['warning_min']
        else:
            risks['tank_level'] = max(0, 0.3 * (50 - tank) / 40)
        
        # Vibration risk
        vibration = normalized_data['vibration']
        thresholds = self.thresholds['vibration']
        if vibration >= thresholds['emergency']:
            risks['vibration'] = 1.0
        elif vibration >= thresholds['critical']:
            risks['vibration'] = 0.7 + 0.3 * (vibration - thresholds['critical']) / (thresholds['emergency'] - thresholds['critical'])
        elif vibration >= thresholds['warning']:
            risks['vibration'] = 0.4 + 0.3 * (vibration - thresholds['warning']) / (thresholds['critical'] - thresholds['warning'])
        else:
            risks['vibration'] = max(0, 0.4 * vibration / thresholds['warning'])
        
        # Sound risk
        sound = normalized_data['sound_db']
        thresholds = self.thresholds['sound_db']
        if sound >= thresholds['emergency']:
            risks['sound_db'] = 0.8
        elif sound >= thresholds['critical']:
            risks['sound_db'] = 0.5 + 0.3 * (sound - thresholds['critical']) / (thresholds['emergency'] - thresholds['critical'])
        elif sound >= thresholds['warning']:
            risks['sound_db'] = 0.2 + 0.3 * (sound - thresholds['warning']) / (thresholds['critical'] - thresholds['warning'])
        else:
            risks['sound_db'] = 0.0
        
        # Motion is contextual - usually not a direct risk unless combined
        risks['motion'] = normalized_data['motion'] * 0.3  # Max 0.3 contribution
        
        return risks

    def _calculate_weighted_risk(self, sensor_risks: Dict[str, float], 
                                  normalized_data: Dict[str, float]) -> float:
        """Calculate weighted risk score from individual sensor risks."""
        total_weight = 0
        weighted_sum = 0
        
        for sensor_type, risk in sensor_risks.items():
            weight = self.SENSOR_WEIGHTS.get(sensor_type, 0.05)
            weighted_sum += risk * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        # Normalize to 0-1 range
        base_risk = weighted_sum / total_weight
        
        # Apply non-linear scaling to emphasize higher risks
        # This makes the system more sensitive to multiple simultaneous issues
        if base_risk > 0.5:
            # Boost risk when multiple sensors are elevated
            active_sensors = sum(1 for r in sensor_risks.values() if r > 0.3)
            if active_sensors >= 3:
                base_risk = min(1.0, base_risk * 1.2)
        
        return min(1.0, base_risk)

    def _calculate_context_adjustment(self, context: DeviceContext) -> float:
        """Calculate risk adjustment based on device context."""
        adjustment = 0.0
        
        # Battery level impact
        if context.battery_level < 10:
            adjustment += 0.15  # Critical battery increases risk
        elif context.battery_level < 20:
            adjustment += 0.08
        elif context.battery_level < 30:
            adjustment += 0.03
        
        # Signal strength impact
        if context.signal_strength < -100:
            adjustment += 0.10  # Very poor signal
        elif context.signal_strength < -90:
            adjustment += 0.05
        elif context.signal_strength < -80:
            adjustment += 0.02
        
        # Device overload impact
        if context.cpu_usage > 90:
            adjustment += 0.08
        if context.memory_usage > 90:
            adjustment += 0.05
        
        # Network quality impact
        if context.packet_loss > 10:
            adjustment += 0.10
        elif context.packet_loss > 5:
            adjustment += 0.05
        
        if context.network_latency > 500:
            adjustment += 0.08
        elif context.network_latency > 200:
            adjustment += 0.04
        
        return min(0.3, adjustment)  # Cap context adjustment at 30%

    def _determine_severity(self, risk_score: float, sensor_risks: Dict[str, float],
                           normalized_data: Dict[str, float]) -> str:
        """Determine severity label based on risk score and sensor states."""
        # Check for emergency conditions first
        if normalized_data.get('gas', 0) >= self.thresholds['gas']['emergency']:
            return "EMERGENCY"
        if normalized_data.get('temperature', 0) >= self.thresholds['temperature']['emergency']:
            return "EMERGENCY"
        
        # Check for critical individual sensors
        max_sensor_risk = max(sensor_risks.values()) if sensor_risks else 0
        
        if risk_score >= 0.85 or max_sensor_risk >= 0.95:
            return "EMERGENCY"
        elif risk_score >= 0.70 or max_sensor_risk >= 0.85:
            return "CRITICAL"
        elif risk_score >= 0.50 or max_sensor_risk >= 0.70:
            return "WARNING"
        elif risk_score >= 0.25:
            return "INFO"
        else:
            return "NORMAL"

    def _get_dominant_sensors(self, sensor_risks: Dict[str, float], top_n: int = 3) -> List[Dict]:
        """Get the top N sensors contributing most to risk."""
        sorted_sensors = sorted(sensor_risks.items(), key=lambda x: x[1], reverse=True)
        return [
            {'sensor': name, 'risk': round(risk, 3)}
            for name, risk in sorted_sensors[:top_n] if risk > 0.1
        ]

    def _calculate_device_health_score(self, context: DeviceContext) -> float:
        """Calculate overall device health score (0-100)."""
        score = 100.0
        
        # Battery impact
        score -= max(0, (30 - context.battery_level)) * 1.5
        
        # Signal impact
        if context.signal_strength < -80:
            score -= abs(context.signal_strength + 80) * 0.5
        
        # Resource usage impact
        score -= max(0, context.cpu_usage - 50) * 0.3
        score -= max(0, context.memory_usage - 70) * 0.3
        
        # Network impact
        score -= context.packet_loss * 2
        score -= max(0, context.network_latency - 100) * 0.05
        
        return max(0, min(100, round(score, 1)))

    def _generate_recommendations(self, severity: str, sensor_risks: Dict[str, float],
                                  context: DeviceContext) -> List[str]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        if severity in ["EMERGENCY", "CRITICAL"]:
            recommendations.append("Immediate action required - check physical environment")
            
        if sensor_risks.get('gas', 0) > 0.6:
            recommendations.append("Ventilate area and check gas sources")
        
        if sensor_risks.get('temperature', 0) > 0.6:
            recommendations.append("Check cooling systems and heat sources")
            
        if sensor_risks.get('tank_level', 0) > 0.5:
            recommendations.append("Refill tank - low level detected")
            
        if context and context.battery_level < 20:
            recommendations.append("Device battery low - schedule charging/replacement")
            
        if context and context.signal_strength < -90:
            recommendations.append("Poor signal strength - consider repositioning device")
            
        if not recommendations and severity != "NORMAL":
            recommendations.append("Monitor situation closely")
            
        return recommendations

    def _create_default_context(self, sensor_data: Dict[str, Any]) -> DeviceContext:
        """Create default device context when none provided."""
        return DeviceContext(
            device_id=sensor_data.get('device_id', 'unknown'),
            battery_level=sensor_data.get('battery', 100.0),
            signal_strength=sensor_data.get('rssi', -70.0),
            cpu_usage=sensor_data.get('device_cpu', 50.0),
            memory_usage=sensor_data.get('device_memory', 50.0),
            network_latency=sensor_data.get('network_latency', 50.0),
            packet_loss=sensor_data.get('packet_loss', 0.0),
            uptime=sensor_data.get('uptime', 0),
            capabilities=sensor_data.get('capabilities', ['temperature', 'gas'])
        )

    def get_allocation_recommendation(self, risk_score: float, analysis: Dict,
                                       device_context: DeviceContext = None) -> Dict:
        """
        Get detailed allocation recommendation based on risk and context.
        
        Returns dict with:
        - recommended_layer: 'FOG', 'CLOUD', 'HYBRID'
        - priority: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        - reasoning: explanation string
        - estimated_latency: expected processing time
        """
        severity = analysis.get('dominant_sensors', [{}])[0].get('sensor', 'unknown')
        
        # Base recommendation on risk score
        if risk_score >= 0.8:
            layer = 'FOG'
            priority = 'CRITICAL'
            reasoning = 'Emergency-level risk requires immediate fog processing'
            latency = 10
        elif risk_score >= 0.6:
            layer = 'FOG'
            priority = 'HIGH'
            reasoning = 'High risk situation - prioritize fog execution'
            latency = 25
        elif risk_score >= 0.4:
            layer = 'HYBRID'
            priority = 'MEDIUM'
            reasoning = 'Moderate risk - hybrid processing for redundancy'
            latency = 50
        else:
            # Check device context for cloud preference
            if device_context:
                if device_context.battery_level < 15:
                    layer = 'CLOUD'
                    priority = 'LOW'
                    reasoning = 'Low device battery - offload to cloud'
                    latency = 100
                elif device_context.cpu_usage > 85:
                    layer = 'CLOUD'
                    priority = 'LOW'
                    reasoning = 'Device overloaded - offload to cloud'
                    latency = 100
                else:
                    layer = 'CLOUD'
                    priority = 'LOW'
                    reasoning = 'Normal conditions - cloud processing sufficient'
                    latency = 100
            else:
                layer = 'CLOUD'
                priority = 'LOW'
                reasoning = 'Normal conditions - cloud processing sufficient'
                latency = 100
        
        return {
            'recommended_layer': layer,
            'priority': priority,
            'reasoning': reasoning,
            'estimated_latency_ms': latency
        }
