from typing import Dict, Any, Optional
from core.orchestration_config import OrchestrationConfig
from services.realtime import emit_decision
from core.decision_engine import DeviceContext


class Orchestrator:
    """
    Enhanced Orchestrator with context-aware task allocation.
    Supports battery-aware, network-aware, and capability-based routing.
    """

    def __init__(self):
        self.config = OrchestrationConfig()

    def allocate_task(self, device_id: str, severity: str, risk: float,
                      device_context: DeviceContext = None,
                      allocation_rec: Dict[str, Any] = None) -> str:
        """
        Allocates execution layer based on configuration, risk, and device context.
        Emits real-time decision event.
        
        Args:
            device_id: Device identifier
            severity: Severity level (NORMAL, INFO, WARNING, CRITICAL, EMERGENCY)
            risk: Risk score (0-1)
            device_context: Optional device context for enhanced decision making
            allocation_rec: Optional allocation recommendation from decision engine
        
        Returns:
            Allocation decision: 'FOG_EXECUTION', 'CLOUD_EXECUTION', or 'FOG_AND_CLOUD'
        """
        cfg = self.config.get()
        mode = cfg.get("mode", "dynamic")
        threshold = cfg.get("risk_threshold", 0.6)
        
        # Get constraint thresholds
        battery_threshold = cfg.get("battery_threshold_low", 20)
        signal_threshold = cfg.get("signal_strength_threshold", -85)
        latency_threshold = cfg.get("network_latency_threshold_ms", 100)
        packet_loss_threshold = cfg.get("packet_loss_threshold_pct", 5)
        enable_battery_aware = cfg.get("enable_battery_aware_routing", True)
        enable_network_aware = cfg.get("enable_network_aware_routing", True)

        # Forced Modes (override everything)
        if mode == "force_fog":
            allocation = "FOG_EXECUTION"

        elif mode == "force_cloud":
            allocation = "CLOUD_EXECUTION"

        elif mode == "hybrid":
            allocation = "FOG_AND_CLOUD"

        else:
            # Dynamic Mode with context-aware logic
            allocation = self._dynamic_allocation(
                risk=risk,
                severity=severity,
                threshold=threshold,
                device_context=device_context,
                allocation_rec=allocation_rec,
                battery_threshold=battery_threshold,
                signal_threshold=signal_threshold,
                latency_threshold=latency_threshold,
                packet_loss_threshold=packet_loss_threshold,
                enable_battery_aware=enable_battery_aware,
                enable_network_aware=enable_network_aware
            )

        # Emit decision with context
        decision_payload = {
            'device_id': device_id,
            'allocation': allocation,
            'risk': risk,
            'severity': severity,
            'mode': mode
        }
        
        if device_context:
            decision_payload['device_health'] = self._calculate_health_score(device_context)
            decision_payload['network_quality'] = self._calculate_network_quality(device_context)
        
        if allocation_rec:
            decision_payload['reasoning'] = allocation_rec.get('reasoning', '')
            decision_payload['priority'] = allocation_rec.get('priority', 'LOW')
        
        emit_decision(device_id, allocation, risk)

        return allocation

    def _dynamic_allocation(self, risk: float, severity: str, threshold: float,
                           device_context: DeviceContext,
                           allocation_rec: Dict[str, Any],
                           battery_threshold: float,
                           signal_threshold: float,
                           latency_threshold: float,
                           packet_loss_threshold: float,
                           enable_battery_aware: bool,
                           enable_network_aware: bool) -> str:
        """
        Determine allocation using dynamic logic with context awareness.
        """
        # Emergency/Critical always go to fog for immediate response
        if severity in ["EMERGENCY", "CRITICAL"]:
            return "FOG_EXECUTION"
        
        # Use recommendation if available and valid
        if allocation_rec:
            rec_layer = allocation_rec.get('recommended_layer', 'CLOUD')
            if rec_layer == 'FOG':
                return "FOG_EXECUTION"
            elif rec_layer == 'HYBRID':
                return "FOG_AND_CLOUD"
        
        # High risk threshold check
        if risk >= threshold:
            # Check if device can handle fog processing
            if device_context and self._can_process_on_fog(device_context):
                return "FOG_EXECUTION"
            else:
                # Device can't handle fog, use hybrid for safety
                return "FOG_AND_CLOUD"
        
        # Medium risk - consider hybrid for redundancy
        if risk >= threshold * 0.7:
            return "FOG_AND_CLOUD"
        
        # Low risk - prefer cloud, but check constraints
        if device_context and enable_battery_aware:
            # Low battery - offload to cloud to save device power
            # Support both simple (battery_level) and complex (health.battery_level) DeviceContext
            battery = getattr(device_context, 'battery_level', 
                            getattr(getattr(device_context, 'health', None), 'battery_level', 100))
            if battery < battery_threshold:
                return "CLOUD_EXECUTION"
        
        if device_context and enable_network_aware:
            # Poor network - process locally to avoid transmission issues
            latency = getattr(device_context, 'network_latency', 
                             getattr(getattr(device_context, 'network', None), 'latency_ms', 50))
            packet_loss = getattr(device_context, 'packet_loss',
                                 getattr(getattr(device_context, 'network', None), 'packet_loss_percent', 0))
            if (latency > latency_threshold or
                packet_loss > packet_loss_threshold):
                return "FOG_EXECUTION"
            
            # Very poor signal - definitely local processing
            signal = getattr(device_context, 'signal_strength',
                            getattr(getattr(device_context, 'health', None), 'signal_strength', -70))
            if signal < signal_threshold:
                return "FOG_EXECUTION"
        
        # Default to cloud for low-risk tasks
        return "CLOUD_EXECUTION"

    def _can_process_on_fog(self, device_context: DeviceContext) -> bool:
        """
        Check if device has sufficient resources for fog processing.
        """
        # Check resource availability using flat DeviceContext attributes
        if device_context.battery_level < 5:  # Critical battery
            return False
        
        if device_context.cpu_usage > 95:  # Overloaded
            return False
            
        if device_context.memory_usage > 95:  # Out of memory
            return False
        
        if self._calculate_health_score(device_context) < 30:  # Overall poor health
            return False
        
        return True

    def _calculate_health_score(self, ctx: DeviceContext) -> float:
        """Calculate a 0-100 health score from flat DeviceContext."""
        score = 100.0
        score -= max(0, (30 - ctx.battery_level)) * 1.5
        if ctx.signal_strength < -80:
            score -= abs(ctx.signal_strength + 80) * 0.5
        score -= max(0, ctx.cpu_usage - 50) * 0.3
        score -= max(0, ctx.memory_usage - 70) * 0.3
        score -= ctx.packet_loss * 2
        score -= max(0, ctx.network_latency - 100) * 0.05
        return max(0, min(100, round(score, 1)))

    def _calculate_network_quality(self, ctx: DeviceContext) -> float:
        """Calculate a 0-100 network quality score."""
        score = 100.0
        score -= ctx.packet_loss * 5
        score -= max(0, ctx.network_latency - 50) * 0.2
        if ctx.signal_strength < -70:
            score -= abs(ctx.signal_strength + 70) * 0.5
        return max(0, min(100, round(score, 1)))

    def get_allocation_stats(self) -> Dict[str, Any]:
        """
        Get statistics about allocation decisions.
        """
        # This would be populated from database in production
        return {
            'total_decisions': 0,
            'fog_executions': 0,
            'cloud_executions': 0,
            'hybrid_executions': 0,
            'average_risk': 0.0,
            'sla_compliance': 1.0
        }

