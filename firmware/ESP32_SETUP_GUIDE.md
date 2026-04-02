# 🚀 ESP32 Complete Industrial IoT Node - Setup Guide

## Full Implementation with ALL Sensors & Actuators

---

## 📦 Hardware Components List

### **ESP32 Board:**
- ESP32 DevKit V1 (or NodeMCU-32S, DOIT ESP32 DEVKIT V1)
- Built-in WiFi + Bluetooth
- Dual-core 240MHz CPU
- 520KB RAM

### **Environmental Sensors:**
| Sensor | Model | Purpose |
|--------|-------|---------|
| DHT11/DHT22 | DHT11 or DHT22 | Temperature & Humidity |
| BMP180/BMP280 | BMP180 or BMP280 | Barometric Pressure |
| MQ-2 | MQ-2 | Gas/Smoke detection |
| LDR | Photoresistor | Light intensity |

### **Safety & Security:**
| Sensor | Model | Purpose |
|--------|-------|---------|
| PIR | HC-SR501 | Motion detection |
| Sound | KY-037 | Noise level |
| Vibration | SW-420 | Vibration detection |

### **Liquid Monitoring:**
| Sensor | Model | Purpose |
|--------|-------|---------|
| Ultrasonic | HC-SR04 | Tank level (distance) |
| Soil Moisture | Capacitive v1.2 | Soil moisture |
| Water Flow | YF-S201 | Flow rate measurement |

### **Actuators:**
| Component | Purpose |
|-----------|---------|
| Relay Module (2-channel) | Fan & Pump control |
| SG90 Servo | Vent damper control |
| Active Buzzer (5V) | Local alarm |
| LEDs (Green, Yellow, Red) | Status indicators |

---

## 🔌 Wiring Diagram

### **Power Connections:**
```
ESP32     →   All Sensors
------        -----------
3.3V    →   VCC (DHT, BMP, PIR)
5V      →   VCC (Relay module, Servo, Buzzer)
GND     →   GND (ALL components - common ground!)
```

### **Analog Sensors (ADC1):**
```
ESP32 GPIO   →   Sensor
------------     ------
GPIO 34 (VP) →   MQ-2 OUT (Gas)
GPIO 35 (VN) →   Soil Moisture OUT
GPIO 36 (VP) →   LDR OUT (Light)
GPIO 32      →   Sound Sensor OUT
GPIO 33      →   Vibration Sensor OUT
```

### **Digital Sensors:**
```
ESP32 GPIO   →   Sensor
------------     ------
GPIO 23      →   DHT11 DATA (add 10k pull-up resistor)
GPIO 27      →   PIR OUT
GPIO 25      →   HC-SR04 ECHO
GPIO 26      →   HC-SR04 TRIG
GPIO 14      →   YF-S201 Flow (interrupt)
```

### **I2C Sensors:**
```
ESP32      →   BMP180/280
------         ----------
GPIO 21 (SDA)→   SDA
GPIO 22 (SCL)→   SCL
```

### **Actuators:**
```
ESP32 GPIO   →   Actuator
------------     --------
GPIO 2       →   Relay 1 IN (Fan)
GPIO 4       →   Relay 2 IN (Pump)
GPIO 18      →   Servo Signal (PWM)
GPIO 5       →   Buzzer +
GPIO 0       →   Green LED (via 220Ω)
GPIO 16      →   Yellow LED (via 220Ω)
GPIO 17      →   Red LED (via 220Ω)
```

### **Complete Schematic:**
```
                        ┌─────────────────┐
                        │     ESP32       │
                        │   DevKit V1     │
                        └─────────────────┘
                                 │
        ┌────────────┬──────────┼──────────┬────────────┐
        │            │          │          │            │
    [DHT11]      [BMP280]   [MQ-2]    [PIR]      [HC-SR04]
    Temp/Hum    Pressure    Gas      Motion    Ultrasonic
        │            │          │          │            │
      GPIO23     I2C(21,22)  GPIO34   GPIO27   GPIO25,26
        │            │          │          │            │
        └────────────┴──────────┴──────────┴────────────┘
        
        ┌────────────┬──────────┬──────────┬────────────┐
        │            │          │          │            │
    [Soil]      [Sound]   [Vibration]  [LDR]     [Flow YF-S201]
   Moisture      Level                  Light       Interrupt
   GPIO35       GPIO32    GPIO33     GPIO36      GPIO14
        │            │          │          │            │
        └────────────┴──────────┴──────────┴────────────┘
        
        ┌────────────┬──────────┬──────────┬────────────┐
        │            │          │          │            │
    [Relay1]    [Relay2]   [Servo]   [Buzzer]    [LEDs x3]
      FAN        PUMP       VENT      ALARM    G/Y/R
   GPIO2        GPIO4     GPIO18    GPIO5    GPIO0,16,17
        │            │          │          │            │
        └────────────┴──────────┴──────────┴────────────┘
```

---

## 💻 Software Setup

### **Step 1: Install Arduino Libraries**

Open Arduino IDE → Sketch → Include Library → Manage Libraries:

Install these libraries:
```
1. ESP32 by Espressif Systems (Board support)
2. PubSubClient by Nick O'Leary (MQTT)
3. DHT sensor library by Adafruit
4. Adafruit BMP085 Library (for BMP180/280)
5. ArduinoJson by Benoit Blanchon
6. Servo by ESP32 Community
```

### **Step 2: Install ESP32 Board Support**

If not already installed:

1. File → Preferences
2. Additional Boards Manager URLs: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Tools → Board → Boards Manager
4. Search "ESP32" and install

### **Step 3: Configure Board**

```
Tools → Board: "ESP32 Dev Module"
Tools → Upload Speed: "115200"
Tools → CPU Frequency: "240MHz"
Tools → Flash Size: "4MB (32Mb)"
Tools → Partition Scheme: "Default 4MB with spiffs"
Tools → Port: [Select your COM port]
```

### **Step 4: Edit Configuration**

Open `firmware/esp32_complete_node.ino` and update:

```cpp
// WiFi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Fog Node IP
const char* mqtt_server = "10.136.75.54";  // Your fog node IP

// Unique Device ID (IMPORTANT: Change for each device!)
const char* DEVICE_ID = "esp32_factory_01";  // Make unique!
```

### **Step 5: Upload Firmware**

1. Connect ESP32 via USB-C/Micro USB
2. Hold BOOT button while uploading if needed
3. Click Upload (Ctrl+U)
4. Open Serial Monitor (115200 baud)

---

## ✅ Expected Output

### **Serial Monitor on Startup:**
```
========================================
🏭 FOGNET-X ESP32 Industrial Node
========================================
Device ID: esp32_factory_01
Chip Model: ESP32-D0WDQ6
CPU Frequency: 240 MHz
✅ BMP pressure sensor initialized
📶 Connecting to WiFi: BEYONDER 5430
✅ WiFi Connected!
IP Address: 192.168.1.100
Signal Strength (RSSI): -65 dBm
✨ Initialization complete!
========================================

🔌 MQTT Attempt 1/15...✅ Connected!
📡 Subscribed to: factory/actuator/#
💓 Initial heartbeat sent
```

### **During Operation:**
```
--- Sensor Readings ---
🌡 Temperature: 28.5°C
💧 Humidity: 62.0%
📊 Pressure: 1013.2 hPa
💨 Gas: 245 ppm
🔔 Motion: None
📏 Tank Distance: 15.2 cm
🌱 Soil Moisture: 2150 (WET)
🔊 Sound: 45
📳 Vibration: NO
💡 Light: 850
🌊 Flow Rate: 2.5 L/min
✅ Published | Temp: 28.5°C | Gas: 245 | Motion: NO
```

### **When Alert Triggered:**
```
🚨 EMERGENCY: Fan ON
🚨 EMERGENCY: Vent OPEN
🚨 ALARM ACTIVATED
```

---

## 🎮 MQTT Topics Supported

### **Publishes (ESP32 → Fog):**
- `factory/sensor/data` - All sensor readings (JSON)
- `factory/status/heartbeat` - Keep-alive signal

### **Subscribes (Fog → ESP32):**
- `factory/actuator/fan` - ON/OFF
- `factory/actuator/pump` - ON/OFF
- `factory/actuator/vent` - OPEN/CLOSE
- `factory/actuator/alarm` - ON/OFF
- `factory/actuator/mode` - AUTO/MANUAL
- `factory/actuator/#` - All commands (wildcard)

---

## 🛠️ Sensor Calibration

### **MQ-2 Gas Sensor:**
```cpp
// Warm up for 24-48 hours for accurate readings
// Adjust threshold based on baseline
const int GAS_THRESHOLD = 400;  // Adjust as needed
```

### **Soil Moisture:**
```cpp
// Calibrate in air (dry) and water (wet)
// Dry value: ~3000-4095
// Wet value: ~1000-2000
const int SOIL_DRY = 3000;
const int SOIL_WET = 1500;
```

### **Ultrasonic Tank Level:**
```cpp
// Measure distance from sensor to tank bottom
// Low level = large distance
const float TANK_LOW_CM = 10.0;
```

### **Sound Sensor:**
```cpp
// Test in quiet and loud environments
const int SOUND_THRESHOLD = 80;  // Adjust as needed
```

---

## 📊 Dashboard Integration

All 15+ sensors automatically appear on dashboard:

### **Environmental:**
- Temperature (°C)
- Humidity (%)
- Pressure (hPa)
- Gas (ppm)
- Light Level

### **Safety:**
- Motion Detection
- Sound Level
- Vibration Detection
- Gas Alert Flag

### **Liquid Management:**
- Tank Distance (cm)
- Tank Overflow Flag
- Soil Moisture
- Flow Rate (L/min)
- Total Flow (L)

### **Actuator Status:**
- Fan ON/OFF
- Pump ON/OFF
- Vent Position (%)
- Alarm Status
- Auto/Manual Mode

### **Device Health:**
- RSSI (dBm)
- Uptime (seconds)
- Free Heap Memory
- Chip Temperature

---

## 🔧 Troubleshooting

### **WiFi Not Connecting:**
- ESP32 only supports 2.4GHz WiFi
- Check SSID/password (case-sensitive!)
- Move closer to router
- Try static IP if DHCP fails

### **BMP Sensor Not Found:**
```
⚠️ BMP sensor not found!
```
- Check I2C wiring (SDA=GPIO21, SCL=GPIO22)
- Add pull-up resistors (4.7kΩ) on SDA/SCL lines
- Verify sensor voltage (3.3V not 5V)

### **DHT Readings Fail:**
- Add 10k pull-up resistor between VCC and DATA
- Check data pin (GPIO23)
- Try different DHTTYPE (DHT11 vs DHT22)

### **Servo Jitter:**
- Use separate 5V power supply for servo
- Add capacitor (100uF) across servo power
- Ensure common ground

### **Flow Sensor Not Counting:**
- Check interrupt pin (GPIO14)
- Verify flow direction (arrow on sensor)
- Ensure minimum flow rate (0.5 L/min)

---

## 🎯 Advanced Features

### **Deep Sleep Mode:**
```cpp
// Add to end of loop() for battery operation
esp_sleep_enable_timer_wakeup(60 * 1000000);  // Wake every 60 seconds
esp_deep_sleep_start();
```

### **OTA Updates:**
```cpp
#include <ArduinoOTA.h>

void setupOTA() {
  ArduinoOTA.setHostname(DEVICE_ID);
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  // ... rest of code
}
```

### **Multiple Devices:**
Change DEVICE_ID for each node:
```cpp
// Node 1
const char* DEVICE_ID = "esp32_zone_A";

// Node 2
const char* DEVICE_ID = "esp32_zone_B";

// Node 3
const char* DEVICE_ID = "esp32_tank_monitor";
```

Each will auto-register separately!

---

## 📈 Power Consumption

| State | Current Draw |
|-------|--------------|
| Active (WiFi on) | ~100mA |
| Transmitting | ~250mA |
| Deep Sleep | ~10μA |
| With all sensors | ~350mA |

**Recommendation:** Use 5V 2A power supply for full setup

---

## 🎉 Quick Start Checklist

- [ ] All sensors connected per schematic
- [ ] Common ground established
- [ ] WiFi credentials configured
- [ ] Unique DEVICE_ID set
- [ ] Fog node IP correct
- [ ] Serial shows successful connection
- [ ] Dashboard displays all sensors
- [ ] Actuators respond to commands
- [ ] Alerts trigger appropriately

**All checked?** Your ESP32 industrial node is production-ready! 🏆

---

## 📞 Useful Commands

```bash
# Monitor all devices
python check_devices.py

# Watch MQTT traffic
mosquitto_sub -h localhost -v -t 'factory/#'

# Test actuators
mosquitto_pub -h localhost -t "factory/actuator/fan" -m "ON"
mosquitto_pub -h localhost -t "factory/actuator/pump" -m "OFF"
mosquitto_pub -h localhost -t "factory/actuator/vent" -m "OPEN"

# View dashboard
http://localhost:8000/dashboard
```

---

**🚀 That's it! Your ESP32 node is ready for industrial deployment!**

The system will:
✅ Auto-register on first connection
✅ Publish 15+ sensor parameters
✅ Respond to actuator commands
✅ Trigger safety automation automatically
✅ Show all data on dashboard in real-time

No manual backend configuration needed! Just power it up! 🎉
