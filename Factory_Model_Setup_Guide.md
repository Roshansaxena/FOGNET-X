# FOGNET-X Factory Model Setup Guide

## 🏭 Complete Industrial IoT Demonstration System

This guide shows you how to build and demonstrate all **3 functional sections** of the FOGNET-X enhanced sensor system.

---

## 📋 Required Components

### Electronics
- ESP8266 NodeMCU (or ESP32)
- DHT11 Temperature & Humidity Sensor
- MQ2 Gas Sensor
- HC-SR04 Ultrasonic Sensor
- PIR Motion Sensor (x2 recommended)
- 5V Relay Module
- SG90 Servo Motor
- DC Fan (5V or 12V)
- Active Buzzer
- LDR (Light Dependent Resistor) - optional
- Jumper wires, breadboard

### Materials
- PVC pipe or cylindrical container (~50cm height) - for tank
- Cardboard/foam board - for enclosure
- Small gate/barrier - for entry section
- Lighter gas / ethanol (for testing)

---

## 🔹 SECTION A: Gas Storage Tank Section

### Build Instructions

```
┌─────────────────────────────┐
│    ULTRASONIC SENSOR        │ ← Mounted on top
│         (HC-SR04)           │   Measures distance to liquid
├─────────────────────────────┤
│                             │
│      TANK WALL              │
│     (PVC Pipe)              │
│                             │
│                             │
│  ┌───────────────────┐      │
│  │   LIQUID LEVEL    │      │ ← Level changes as tank fills
│  └───────────────────┘      │
│                             │
│    MQ2 Gas Sensor → []      │ ← Near outlet/bottom
└─────────────────────────────┘
```

### Wiring
| Component | ESP8266 Pin |
|-----------|-------------|
| Ultrasonic Trig | D6 (GPIO12) |
| Ultrasonic Echo | D7 (GPIO13) |
| MQ2 Gas (AO) | A0 (Analog) |
| MQ2 VCC | VIN (5V) |
| MQ2 GND | GND |

### Functionality
- **Tank Level Monitoring**: Ultrasonic measures distance → converts to percentage
- **Gas Leak Detection**: MQ2 detects gas concentration near tank outlet
- **Overflow Prevention**: Alerts when level > 90%

### Demo Scenarios
1. **Normal Operation**: Show stable readings
2. **Gas Leak Test**: 
   - Bring lighter gas close to MQ2
   - Watch gas value spike from ~200 to >700
   - Automatic fan/vent activation
3. **Overflow Simulation**:
   - Place hand/object closer to ultrasonic
   - Distance decreases → level increases
   - Alert triggers at >90%

---

## 🔹 SECTION B: Ventilation & Exhaust Section

### Build Instructions

```
                    ┌─────────────┐
                    │   VENT FLAP │ ← Servo-controlled cardboard flap
                    │   [====]    │
                    └─────────────┘
                         ↑
                    SG90 Servo
                         
    ┌─────────────────────────────┐
    │      EXHAUST FAN            │ ← Controlled by relay
    │         (DC)                │
    └─────────────────────────────┘
```

### Wiring
| Component | ESP8266 Pin |
|-----------|-------------|
| Relay IN | D1 (GPIO5) |
| Servo Signal | D4 (GPIO2) |
| Fan + | Relay COM |
| Fan - | External 5V |
| Servo VCC | VIN (5V) |
| Servo GND | GND |

### Functionality
- **Automatic Response**: When gas detected → Fan ON + Vent OPEN
- **Manual Override**: Can be controlled via MQTT commands
- **Energy Saving**: Turns off when gas clears

### Demo Sequence
```
NORMAL STATE:
├─ Fan: OFF
├─ Vent: CLOSED
└─ Status: Safe ✅

GAS DETECTED:
├─ Fan: ON (automatic exhaust)
├─ Vent: OPEN (airflow increase)
└─ Status: Emergency Response ⚠️

AFTER GAS CLEARS:
├─ Fan: OFF (after delay)
├─ Vent: CLOSED
└─ Status: Normal ✅
```

---

## 🔹 SECTION C: Entry Security Section

### Build Instructions

```
    ENTRY GATE
    ┌─────────────────┐
    │                 │
PIR │                 │ PIR
←→  │   ENTRYWAY      │ ←→
    │                 │
    └─────────────────┘
    
    Human movement →
```

### Wiring
| Component | ESP8266 Pin |
|-----------|-------------|
| PIR Entry | D5 (GPIO14) |
| PIR Exit (optional) | D8 (GPIO15) |
| Buzzer + | D3 (GPIO0) via transistor |
| Buzzer - | GND |

### Functionality
- **Perimeter Monitoring**: Detects human presence
- **Contextual Alerts**: 
  - Motion alone = INFO level
  - Motion + Gas = CRITICAL security alert
- **Local Alarm**: Buzzer sounds for high-priority alerts

### Demo Scenarios
1. **Normal Entry**: Wave hand in front of PIR → Shows "Motion Detected"
2. **Security Breach**: 
   - Trigger gas leak first
   - Then wave hand near PIR
   - System triggers HIGH PRIORITY alert
   - Rapid buzzer beeping

---

## 🎯 Complete Integrated Demo Flow

### Scenario 1: Normal Operations
```
1. System publishes sensor data every 2 seconds
2. Dashboard shows:
   ├─ Temperature: 28°C
   ├─ Humidity: 65%
   ├─ Gas: 250ppm (normal)
   ├─ Tank Level: 45%
   └─ Motion: Clear
3. All actuators OFF
4. Status: ✅ NORMAL
```

### Scenario 2: Gas Leak Emergency
```
1. Blow lighter gas near MQ2 sensor
2. Gas reading spikes: 250 → 800ppm
3. System detects CRITICAL condition
4. Automatic response:
   ├─ Relay activates → Fan turns ON
   ├─ Servo rotates → Vent opens
   ├─ Buzzer beeps once
   └─ MQTT alert sent to fog node
5. Dashboard updates:
   ├─ Severity: CRITICAL
   ├─ Allocation: FOG_EXECUTION
   ├─ Actuators: FAN ON, VENT OPEN
   └─ Recommendations displayed
6. Fog node logs event, tracks SLA
```

### Scenario 3: Combined Emergency (Highest Priority)
```
1. Gas leak active (from Scenario 2)
2. Person approaches entry (PIR detects)
3. System triggers SECURITY ALERT
4. Enhanced response:
   ├─ Rapid buzzer beeping (3x)
   ├─ Email/Telegram alerts sent
   ├─ Dashboard shows EMERGENCY
   └─ Fog node escalates priority
5. Dashboard shows:
   ├─ "Human in hazardous area!"
   ├─ Multiple alert flags set
   └─ Immediate action required
```

### Scenario 4: Tank Overflow Prevention
```
1. Gradually raise hand under ultrasonic
2. Tank level increases: 45% → 92%
3. At 90%: OVERFLOW WARNING triggered
4. System can:
   ├─ Send alert to dashboard
   ├─ Log overflow event
   └─ Optionally trigger pump control
5. Lower hand → Level drops → Alert clears
```

---

## 📊 What You'll See on Dashboard

### Real-time Metrics
- **Live Sensor Values**: Updated every 2 seconds
- **Device Health**: Battery (WiFi-based), CPU, Memory simulation
- **Network Quality**: Latency, packet loss
- **Alert Status**: Visual indicators for each alert type

### Orchestration Decisions
- **Task Allocation**: Shows whether processing happens on FOG or CLOUD
- **Risk Score**: 0-1 scale showing danger level
- **SLA Compliance**: Tracks if system responded within time limits
- **Latency Breakdown**: Fog vs Cloud processing times

### Historical Data
- **Trend Charts**: Risk score over time
- **Event Log**: All alerts with timestamps
- **Actuator History**: When fan/vent activated
- **Bandwidth Usage**: Data transmitted to cloud

---

## 🔧 Calibration & Testing

### Gas Sensor Calibration
```cpp
// In code, adjust these values:
const float GAS_NORMAL_MAX = 300;    // Below this = safe
const float GAS_WARNING_MAX = 500;   // Above this = warning
const float GAS_CRITICAL_MAX = 700;  // Above this = critical

// Test procedure:
1. Power on system, let warm up for 2 minutes
2. Note baseline gas reading (typically 200-300)
3. Test with gas source, note peak reading
4. Adjust thresholds based on your environment
```

### Ultrasonic Calibration
```cpp
// Tank height assumption (adjust for your tank):
float tankHeight = 50.0;  // cm

// Test procedure:
1. Measure actual tank height
2. Update tankHeight variable
3. Test with known water levels
4. Verify percentage matches reality
```

### PIR Sensitivity
```
Most PIR sensors have two potentiometers:
- Time Delay: How long output stays HIGH
- Sensitivity: Detection range

Adjust for your demo space size.
```

---

## 💡 Pro Tips for Demos

### 1. Start with System Overview
- Explain the 3 sections clearly
- Show normal dashboard readings
- Point out device capabilities

### 2. Build Suspense
- Start with single sensor demo
- Then show integrated response
- Finish with multi-sensor emergency

### 3. Highlight Intelligence
- Emphasize CONTEXT-AWARE decisions
- Show how multiple factors affect allocation
- Point out automatic actuator control

### 4. Use the Dashboard
- Keep dashboard visible during demo
- Let judges see real-time updates
- Explain orchestration logic as it happens

### 5. Have Backup Plans
- If gas sensor fails, simulate with serial command
- If WiFi drops, show offline capability
- Always have video backup

---

## 📱 Mobile App Integration (Future)

The enhanced system supports:
- Telegram alerts for critical events
- Email notifications with details
- SMS integration (via gateway)
- Mobile dashboard access

---

## 🎓 Technical Concepts Demonstrated

1. **Edge Computing**: Local processing before cloud
2. **Fog Orchestration**: Intelligent task distribution
3. **Context Awareness**: Multi-sensor fusion
4. **Real-time Systems**: Sub-second response times
5. **IoT Protocols**: MQTT pub/sub architecture
6. **Embedded Systems**: Resource-constrained computing
7. **Sensor Fusion**: Combining multiple inputs
8. **Control Systems**: Feedback loops and automation

---

## 📞 Troubleshooting

### WiFi Connection Issues
- Check SSID/password in code
- Ensure ESP8266 has adequate power (use good USB cable)
- Move closer to router or use external antenna

### MQTT Not Connecting
- Verify broker IP address
- Check firewall settings
- Ensure Mosquitto service is running

### Sensor Readings Unstable
- Add averaging (already implemented)
- Check wiring connections
- Ensure proper grounding
- Keep gas sensor away from direct airflow

### Servo Jittery
- Use separate 5V supply for servo
- Add capacitor across power rails
- Reduce servo speed if needed

---

## 📈 Performance Metrics

With this setup, you can demonstrate:

- **Response Time**: < 100ms for local alerts
- **Update Rate**: 2 seconds per sensor reading
- **Network Efficiency**: Only essential data to cloud
- **Reliability**: Continues operating even if cloud disconnected
- **Scalability**: Same architecture works for 100+ devices

---

## 🏆 Competition Highlights

This system demonstrates:
✅ **Industry 4.0** principles
✅ **Smart Factory** concepts
✅ **Safety Automation**
✅ **Predictive Maintenance**
✅ **Energy Efficiency**
✅ **Real-time Analytics**
✅ **AI/ML Ready** infrastructure

Perfect for:
- Project exhibitions
- Hackathons
- Final year projects
- Research demonstrations
- Industry presentations

---

**Good luck with your demonstration! 🚀**

For questions or issues, refer to the main FOGNET-X documentation.
