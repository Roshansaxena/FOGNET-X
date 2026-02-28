from core.orchestration_config import OrchestrationConfig
from services.realtime import emit_decision


class Orchestrator:

    def __init__(self):
        self.config = OrchestrationConfig()

    def allocate_task(self, device_id, severity, risk):
        """
        Allocates execution layer based on configuration and risk.
        Emits real-time decision event.
        """

        cfg = self.config.get()

        mode = cfg["mode"]
        threshold = cfg["risk_threshold"]

        # Forced Modes
        if mode == "force_fog":
            allocation = "FOG_EXECUTION"

        elif mode == "force_cloud":
            allocation = "CLOUD_EXECUTION"

        elif mode == "hybrid":
            allocation = "FOG_AND_CLOUD"

        else:
            # Dynamic Mode
            if risk >= threshold:
                allocation = "FOG_EXECUTION"
            else:
                allocation = "CLOUD_EXECUTION"

        emit_decision(device_id, allocation, risk)

        return allocation
    print("ORCHESTRATION STATE HIT")

