#!/usr/bin/env python3
"""
Test script for FOGNET-X Enhanced System
Tests the new multi-sensor decision engine and context-aware orchestration
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.decision_engine import DecisionEngine, DeviceContext
from core.orchestrator import Orchestrator
from core.orchestration_config import OrchestrationConfig
from core.context_model import ContextModel


def test_decision_engine():
    """Test the enhanced decision engine"""
    print("=" * 60)
    print("TESTING DECISION ENGINE")
    print("=" * 60)
    
    de = DecisionEngine()
    
    # Test Case 1: Normal conditions
    print("\n[TEST 1] Normal Conditions")
    test_data = {
        'device_id': 'test_device_1',
        'temperature': 28,
        'gas': 250,
        'humidity': 55,
        'pressure': 1013,
        'battery': 85,
        'rssi': -70
    }
    context = DeviceContext(
        device_id='test_device_1',
        battery_level=85,
        signal_strength=-70,
        cpu_usage=45,
        memory_usage=60,
        network_latency=40,
        packet_loss=0.5,
        uptime=86400,
        capabilities=['temperature', 'gas', 'humidity']
    )
    severity, risk, analysis = de.evaluate(test_data, context)
    print(f"  Severity: {severity}")
    print(f"  Risk Score: {risk}")
    print(f"  Device Health: {analysis['device_health_score']}")
    assert severity == "NORMAL", f"Expected NORMAL, got {severity}"
    print("  ✓ PASSED")
    
    # Test Case 2: Critical gas leak
    print("\n[TEST 2] Critical Gas Leak")
    test_data = {
        'device_id': 'test_device_2',
        'temperature': 35,
        'gas': 850,  # Very high gas
        'humidity': 70,
        'air_quality_index': 180,
        'battery': 60,
        'rssi': -75
    }
    context = DeviceContext(
        device_id='test_device_2',
        battery_level=60,
        signal_strength=-75,
        cpu_usage=50,
        memory_usage=55,
        network_latency=60,
        packet_loss=1.0,
        uptime=3600,
        capabilities=['temperature', 'gas', 'air_quality_index']
    )
    severity, risk, analysis = de.evaluate(test_data, context)
    print(f"  Severity: {severity}")
    print(f"  Risk Score: {risk}")
    print(f"  Dominant Sensors: {analysis['dominant_sensors']}")
    print(f"  Recommendations: {analysis['recommendations']}")
    assert severity in ["CRITICAL", "EMERGENCY"], f"Expected CRITICAL/EMERGENCY, got {severity}"
    print("  ✓ PASSED")
    
    # Test Case 3: Multiple moderate issues
    print("\n[TEST 3] Multiple Moderate Issues")
    test_data = {
        'device_id': 'test_device_3',
        'temperature': 48,  # Very high temp (critical)
        'gas': 750,  # High gas (critical)
        'humidity': 88,  # High humidity
        'vibration': 12,  # High vibration (critical)
        'air_quality_index': 160,  # Poor AQI (critical)
        'battery': 25,  # Low battery
        'rssi': -88  # Weak signal
    }
    context = DeviceContext(
        device_id='test_device_3',
        battery_level=25,
        signal_strength=-88,
        cpu_usage=75,
        memory_usage=80,
        network_latency=150,
        packet_loss=3.0,
        uptime=7202,
        capabilities=['temperature', 'gas', 'humidity', 'vibration', 'air_quality_index']
    )
    severity, risk, analysis = de.evaluate(test_data, context)
    print(f"  Severity: {severity}")
    print(f"  Risk Score: {risk}")
    print(f"  Context Adjustment: {analysis['context_adjustment']}")
    print(f"  Recommendations: {analysis['recommendations']}")
    assert risk > 0.5, f"Expected risk > 0.5, got {risk}"
    print("  ✓ PASSED")
    
    # Test Case 4: Low battery with network issues
    print("\n[TEST 4] Device Health Issues")
    test_data = {
        'device_id': 'test_device_4',
        'temperature': 30,
        'gas': 300,
        'battery': 8,  # Critical battery
        'rssi': -95,  # Very weak signal
        'device_cpu': 92,  # High CPU
        'device_memory': 88  # High memory
    }
    context = DeviceContext(
        device_id='test_device_4',
        battery_level=8,
        signal_strength=-95,
        cpu_usage=92,
        memory_usage=88,
        network_latency=300,
        packet_loss=8.0,
        uptime=1800,
        capabilities=['temperature', 'gas']
    )
    severity, risk, analysis = de.evaluate(test_data, context)
    print(f"  Severity: {severity}")
    print(f"  Risk Score: {risk}")
    print(f"  Device Health Score: {analysis['device_health_score']}")
    assert analysis['device_health_score'] < 50, f"Expected health < 50, got {analysis['device_health_score']}"
    print("  ✓ PASSED")
    
    print("\n✓ ALL DECISION ENGINE TESTS PASSED")
    return True


def test_orchestrator():
    """Test the enhanced orchestrator"""
    print("\n" + "=" * 60)
    print("TESTING ORCHESTRATOR")
    print("=" * 60)
    
    orch = Orchestrator()
    config = OrchestrationConfig()
    
    # Test Case 1: Emergency allocation
    print("\n[TEST 1] Emergency Allocation")
    context = DeviceContext(
        device_id='emergency_device',
        battery_level=50,
        signal_strength=-70,
        cpu_usage=40,
        memory_usage=50,
        network_latency=50,
        packet_loss=0.5,
        uptime=3600,
        capabilities=['temperature', 'gas']
    )
    allocation = orch.allocate_task('emergency_device', 'EMERGENCY', 0.9, context, None)
    print(f"  Allocation: {allocation}")
    assert allocation == 'FOG_EXECUTION', f"Expected FOG_EXECUTION for emergency, got {allocation}"
    print("  ✓ PASSED")
    
    # Test Case 2: Low battery - should prefer cloud
    print("\n[TEST 2] Low Battery Allocation")
    context = DeviceContext(
        device_id='low_battery_device',
        battery_level=15,  # Low battery
        signal_strength=-70,
        cpu_usage=40,
        memory_usage=50,
        network_latency=50,
        packet_loss=0.5,
        uptime=3600,
        capabilities=['temperature', 'gas']
    )
    allocation_rec = {'recommended_layer': 'CLOUD', 'reasoning': 'Low battery'}
    allocation = orch.allocate_task('low_battery_device', 'NORMAL', 0.3, context, allocation_rec)
    print(f"  Allocation: {allocation}")
    assert allocation == 'CLOUD_EXECUTION', f"Expected CLOUD_EXECUTION for low battery, got {allocation}"
    print("  ✓ PASSED")
    
    # Test Case 3: Poor network - should prefer fog
    print("\n[TEST 3] Poor Network Allocation")
    context = DeviceContext(
        device_id='poor_network_device',
        battery_level=80,
        signal_strength=-92,  # Poor signal
        cpu_usage=40,
        memory_usage=50,
        network_latency=250,  # High latency
        packet_loss=8.0,  # High packet loss
        uptime=3600,
        capabilities=['temperature', 'gas']
    )
    allocation = orch.allocate_task('poor_network_device', 'NORMAL', 0.3, context, None)
    print(f"  Allocation: {allocation}")
    assert allocation == 'FOG_EXECUTION', f"Expected FOG_EXECUTION for poor network, got {allocation}"
    print("  ✓ PASSED")
    
    # Test Case 4: Device overloaded - should not use fog
    print("\n[TEST 4] Overloaded Device Allocation")
    context = DeviceContext(
        device_id='overloaded_device',
        battery_level=50,
        signal_strength=-70,
        cpu_usage=98,  # Very high CPU
        memory_usage=95,  # Very high memory
        network_latency=50,
        packet_loss=0.5,
        uptime=3600,
        capabilities=['temperature', 'gas']
    )
    allocation = orch.allocate_task('overloaded_device', 'WARNING', 0.6, context, None)
    print(f"  Allocation: {allocation}")
    # Should be HYBRID since device can't handle fog but risk is elevated
    assert allocation in ['CLOUD_EXECUTION', 'FOG_AND_CLOUD'], f"Expected CLOUD/HYBRID for overloaded device, got {allocation}"
    print("  ✓ PASSED")
    
    print("\n✓ ALL ORCHESTRATOR TESTS PASSED")
    return True


def test_context_model():
    """Test the enhanced context model"""
    print("\n" + "=" * 60)
    print("TESTING CONTEXT MODEL")
    print("=" * 60)
    
    cm = ContextModel()
    
    # Test Case 1: Device registration and update
    print("\n[TEST 1] Device Registration")
    sensor_data = {
        'device_id': 'ctx_test_device',
        'device_type': 'industrial',
        'location': 'Factory Floor 1',
        'firmware_version': '2.1.0',
        'temperature': 32,
        'gas': 350,
        'humidity': 65,
        'capabilities': ['temperature', 'gas', 'humidity'],
        'battery': 78,
        'rssi': -72,
        'device_cpu': 55,
        'device_memory': 62,
        'network_latency': 45,
        'packet_loss': 0.8,
        'uptime': 86400
    }
    cm.update('ctx_test_device', sensor_data)
    
    context = cm.get_device_context('ctx_test_device')
    assert context is not None, "Device context should exist"
    assert context.device_id == 'ctx_test_device'
    assert context.location == 'Factory Floor 1'
    print(f"  Device: {context.device_id}")
    print(f"  Location: {context.location}")
    print(f"  Health Score: {context.health.health_score}")
    print(f"  Network Quality: {context.network.quality_score}")
    print("  ✓ PASSED")
    
    # Test Case 2: Health check
    print("\n[TEST 2] Device Health Check")
    health_check = cm.check_device_health('ctx_test_device')
    print(f"  Is Healthy: {health_check['is_healthy']}")
    print(f"  Health Score: {health_check['health_score']}")
    print(f"  Issues: {health_check['issues']}")
    assert health_check['is_healthy'] == True, "Device should be healthy"
    print("  ✓ PASSED")
    
    # Test Case 3: Global context
    print("\n[TEST 3] Global Context")
    global_ctx = cm.get_global_context()
    print(f"  Total Devices: {global_ctx['total_devices']}")
    print(f"  Active Devices: {global_ctx['active_devices']}")
    print(f"  Average Health: {global_ctx['average_health_score']}")
    assert global_ctx['total_devices'] == 1
    print("  ✓ PASSED")
    
    # Test Case 4: Device by capability
    print("\n[TEST 4] Device Capability Search")
    temp_devices = cm.get_devices_by_capability('temperature')
    print(f"  Devices with temperature sensor: {temp_devices}")
    assert 'ctx_test_device' in temp_devices
    print("  ✓ PASSED")
    
    print("\n✓ ALL CONTEXT MODEL TESTS PASSED")
    return True


def test_config():
    """Test the enhanced orchestration config"""
    print("\n" + "=" * 60)
    print("TESTING ORCHESTRATION CONFIG")
    print("=" * 60)
    
    config = OrchestrationConfig()
    
    # Test Case 1: Get all config values
    print("\n[TEST 1] Get Configuration")
    cfg = config.get()
    print(f"  Mode: {cfg.get('mode')}")
    print(f"  Risk Threshold: {cfg.get('risk_threshold')}")
    print(f"  Battery Aware: {cfg.get('enable_battery_aware_routing')}")
    print(f"  Network Aware: {cfg.get('enable_network_aware_routing')}")
    assert 'mode' in cfg
    assert 'risk_threshold' in cfg
    print("  ✓ PASSED")
    
    # Test Case 2: Get sensor thresholds
    print("\n[TEST 2] Sensor Thresholds")
    thresholds = config.get_sensor_thresholds()
    print(f"  Temperature: {thresholds['temperature']}")
    print(f"  Gas: {thresholds['gas']}")
    print(f"  Humidity: {thresholds['humidity']}")
    assert 'temperature' in thresholds
    assert 'warning' in thresholds['temperature']
    print("  ✓ PASSED")
    
    # Test Case 3: Get sensor weights
    print("\n[TEST 3] Sensor Weights")
    weights = config.get_sensor_weights()
    print(f"  Temperature Weight: {weights['temperature']}")
    print(f"  Gas Weight: {weights['gas']}")
    print(f"  Total Weight Sum: {sum(weights.values()):.2f}")
    assert 'temperature' in weights
    assert 'gas' in weights
    print("  ✓ PASSED")
    
    print("\n✓ ALL CONFIG TESTS PASSED")
    return True


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("FOGNET-X ENHANCED SYSTEM TEST SUITE")
    print("=" * 60)
    
    all_passed = True
    
    try:
        all_passed &= test_decision_engine()
    except Exception as e:
        print(f"\n✗ DECISION ENGINE TESTS FAILED: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    try:
        all_passed &= test_orchestrator()
    except Exception as e:
        print(f"\n✗ ORCHESTRATOR TESTS FAILED: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    try:
        all_passed &= test_context_model()
    except Exception as e:
        print(f"\n✗ CONTEXT MODEL TESTS FAILED: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    try:
        all_passed &= test_config()
    except Exception as e:
        print(f"\n✗ CONFIG TESTS FAILED: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED - SYSTEM READY")
    else:
        print("✗ SOME TESTS FAILED - CHECK OUTPUT ABOVE")
    print("=" * 60)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
