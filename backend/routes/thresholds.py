from flask import Blueprint, request, jsonify
import sqlite3
import json
import time
from core.config import DB_NAME
from datetime import datetime

thresholds_bp = Blueprint('thresholds', __name__)

# =====================================================
# THRESHOLD MANAGEMENT
# =====================================================

@thresholds_bp.route('/api/thresholds', methods=['GET'])
def get_all_thresholds():
    """Get thresholds for all devices"""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        thresholds = conn.execute('''
            SELECT * FROM device_thresholds 
            ORDER BY device_id
        ''').fetchall()
        conn.close()
        
        return jsonify([dict(t) for t in thresholds]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thresholds_bp.route('/api/thresholds/<device_id>', methods=['GET'])
def get_thresholds(device_id):
    """Get thresholds for specific device"""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        threshold = conn.execute(
            'SELECT * FROM device_thresholds WHERE device_id = ?',
            (device_id,)
        ).fetchone()
        conn.close()
        
        if threshold:
            return jsonify(dict(threshold)), 200
        else:
            return jsonify({"error": "Device not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thresholds_bp.route('/api/thresholds/<device_id>', methods=['PUT'])
def update_thresholds(device_id):
    """Update thresholds for a device"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DB_NAME)
        conn.execute('''
            INSERT INTO device_thresholds (
                device_id,
                temp_warning, temp_critical, temp_emergency,
                gas_warning, gas_critical, gas_emergency,
                humidity_warning, humidity_critical,
                tank_min, tank_max,
                pressure_warning, pressure_critical,
                auto_fan_enabled, auto_vent_enabled, auto_pump_enabled, auto_alarm_enabled,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(device_id) DO UPDATE SET
                temp_warning = ?,
                temp_critical = ?,
                temp_emergency = ?,
                gas_warning = ?,
                gas_critical = ?,
                gas_emergency = ?,
                humidity_warning = ?,
                humidity_critical = ?,
                tank_min = ?,
                tank_max = ?,
                pressure_warning = ?,
                pressure_critical = ?,
                auto_fan_enabled = ?,
                auto_vent_enabled = ?,
                auto_pump_enabled = ?,
                auto_alarm_enabled = ?,
                updated_at = CURRENT_TIMESTAMP
        ''', (
            device_id,
            data.get('temp_warning', 35), data.get('temp_critical', 45), data.get('temp_emergency', 55),
            data.get('gas_warning', 400), data.get('gas_critical', 700), data.get('gas_emergency', 900),
            data.get('humidity_warning', 80), data.get('humidity_critical', 90),
            data.get('tank_min', 10), data.get('tank_max', 100),
            data.get('pressure_warning', 1050), data.get('pressure_critical', 1100),
            data.get('auto_fan_enabled', 1), data.get('auto_vent_enabled', 1), 
            data.get('auto_pump_enabled', 1), data.get('auto_alarm_enabled', 1),
            # For ON CONFLICT
            data.get('temp_warning', 35), data.get('temp_critical', 45), data.get('temp_emergency', 55),
            data.get('gas_warning', 400), data.get('gas_critical', 700), data.get('gas_emergency', 900),
            data.get('humidity_warning', 80), data.get('humidity_critical', 90),
            data.get('tank_min', 10), data.get('tank_max', 100),
            data.get('pressure_warning', 1050), data.get('pressure_critical', 1100),
            data.get('auto_fan_enabled', 1), data.get('auto_vent_enabled', 1), 
            data.get('auto_pump_enabled', 1), data.get('auto_alarm_enabled', 1)
        ))
        conn.commit()
        conn.close()
        
        # MQTT: Send thresholds to device
        try:
            from services.mqtt_service import publish_thresholds_to_device
            publish_thresholds_to_device(device_id, data)
        except Exception as mqtt_error:
            print(f"⚠️ MQTT publish failed: {mqtt_error}")
        
        return jsonify({
            "status": "ok",
            "message": "Thresholds updated successfully",
            "device_id": device_id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# ACTUATOR CONTROL
# =====================================================

@thresholds_bp.route('/api/actuators', methods=['GET'])
def get_all_actuators():
    """Get actuator states for all devices"""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        actuators = conn.execute('''
            SELECT * FROM actuator_states 
            ORDER BY device_id
        ''').fetchall()
        conn.close()
        
        return jsonify([dict(a) for a in actuators]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thresholds_bp.route('/api/actuators/<device_id>', methods=['GET'])
def get_actuator_state(device_id):
    """Get actuator state for specific device"""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        state = conn.execute(
            'SELECT * FROM actuator_states WHERE device_id = ?',
            (device_id,)
        ).fetchone()
        conn.close()
        
        if state:
            return jsonify(dict(state)), 200
        else:
            return jsonify({"error": "Device not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thresholds_bp.route('/api/actuators/<device_id>/control', methods=['POST'])
def control_actuator(device_id):
    """Control a specific actuator"""
    try:
        data = request.json
        actuator = data.get('actuator')  # fan, vent, pump, alarm
        action = data.get('action')  # ON/OFF, OPEN/CLOSED
        control_mode = data.get('mode', 'MANUAL')  # AUTO/MANUAL
        
        if not actuator or not action:
            return jsonify({"error": "actuator and action are required"}), 400
        
        # Validate actuator name
        valid_actuators = ['fan', 'vent', 'pump', 'alarm']
        if actuator not in valid_actuators:
            return jsonify({"error": f"Invalid actuator. Must be one of: {valid_actuators}"}), 400
        
        # Update database
        conn = sqlite3.connect(DB_NAME)
        conn.execute('''
            UPDATE actuator_states 
            SET {}_state = ?, 
                control_mode = ?,
                last_command_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE device_id = ?
        '''.format(actuator), (action, control_mode, device_id))
        conn.commit()
        
        # Get updated state
        state = conn.execute(
            'SELECT * FROM actuator_states WHERE device_id = ?',
            (device_id,)
        ).fetchone()
        conn.close()
        
        # MQTT: Send command to device
        try:
            from services.mqtt_service import client as mqtt_client
            
            # Map actuator to MQTT topic
            mqtt_topics = {
                'fan': 'factory/actuator/fan',
                'vent': 'factory/actuator/vent',
                'pump': 'factory/actuator/pump',
                'alarm': 'factory/actuator/alarm'
            }
            
            mqtt_topic = mqtt_topics[actuator]
            mqtt_client.publish(mqtt_topic, action)
            print(f"📤 MQTT: {mqtt_topic} -> {action}")
            
            # Also send mode change if specified
            if control_mode:
                mqtt_client.publish('factory/actuator/mode', control_mode)
                print(f"📤 MQTT: factory/actuator/mode -> {control_mode}")
                
        except Exception as mqtt_error:
            print(f"⚠️ MQTT publish failed: {mqtt_error}")
        
        return jsonify({
            "status": "ok",
            "message": f"{actuator.upper()} turned {action}",
            "device_id": device_id,
            "actuator": actuator,
            "action": action,
            "state": dict(state) if state else {}
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@thresholds_bp.route('/api/actuators/<device_id>/auto-mode', methods=['POST'])
def set_auto_mode(device_id):
    """Enable/disable auto mode for all actuators"""
    try:
        data = request.json
        auto_mode = data.get('auto_mode', False)  # True = AUTO, False = MANUAL
        
        control_mode = 'AUTO' if auto_mode else 'MANUAL'
        
        conn = sqlite3.connect(DB_NAME)
        conn.execute('''
            UPDATE actuator_states 
            SET control_mode = ?,
                last_command_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE device_id = ?
        ''', (control_mode, device_id))
        conn.commit()
        conn.close()
        
        # MQTT: Send mode command
        try:
            from services.mqtt_service import client as mqtt_client
            mqtt_client.publish('factory/actuator/mode', control_mode)
            print(f"📤 MQTT: factory/actuator/mode -> {control_mode}")
        except Exception as mqtt_error:
            print(f"⚠️ MQTT publish failed: {mqtt_error}")
        
        return jsonify({
            "status": "ok",
            "message": f"Mode set to {control_mode}",
            "device_id": device_id,
            "mode": control_mode
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# COMBINED DEVICE CONTROL INFO
# =====================================================

@thresholds_bp.route('/api/device-control/<device_id>', methods=['GET'])
def get_device_control_info(device_id):
    """Get both thresholds and actuator states for a device"""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        
        # Get thresholds
        thresholds = conn.execute(
            'SELECT * FROM device_thresholds WHERE device_id = ?',
            (device_id,)
        ).fetchone()
        
        # If device doesn't exist in thresholds table, create it
        if not thresholds:
            print(f"📝 Auto-registering device {device_id} for threshold control")
            conn.execute('''
                INSERT INTO device_thresholds (device_id) VALUES (?)
            ''', (device_id,))
            conn.commit()
            thresholds = conn.execute(
                'SELECT * FROM device_thresholds WHERE device_id = ?',
                (device_id,)
            ).fetchone()
        
        # Get actuators
        actuators = conn.execute(
            'SELECT * FROM actuator_states WHERE device_id = ?',
            (device_id,)
        ).fetchone()
        
        # If device doesn't exist in actuators table, create it
        if not actuators:
            print(f"📝 Auto-registering device {device_id} for actuator control")
            conn.execute('''
                INSERT INTO actuator_states (device_id) VALUES (?)
            ''', (device_id,))
            conn.commit()
            actuators = conn.execute(
                'SELECT * FROM actuator_states WHERE device_id = ?',
                (device_id,)
            ).fetchone()
        
        conn.close()
        
        return jsonify({
            "device_id": device_id,
            "thresholds": dict(thresholds) if thresholds else {},
            "actuators": dict(actuators) if actuators else {}
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
