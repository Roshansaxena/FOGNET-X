# FOGNET-X Factory Model - Complete Wiring Diagram

## 📋 Master Component List

| # | Component | Quantity | Purpose |
|---|-----------|----------|---------|
| 1 | ESP8266 NodeMCU | 1 | Main microcontroller |
| 2 | DHT11 Sensor | 1 | Temperature & Humidity |
| 3 | MQ2 Gas Sensor | 1 | Gas/Smoke detection |
| 4 | HC-SR04 Ultrasonic | 1 | Tank level measurement |
| 5 | PIR Sensor | 1-2 | Motion detection |
| 6 | SG90 Servo | 1 | Vent flap control |
| 7 | 5V Relay Module | 1 | Fan control |
| 8 | DC Fan (5V/12V) | 1 | Exhaust system |
| 9 | Active Buzzer | 1 | Local alarm |
| 10 | LDR Sensor | 1 (opt) | Light detection |
| 11 | Breadboard | 1 | Prototyping |
| 12 | Jumper Wires | ~30 | Connections |

---

## 🔌 Complete Wiring Schematic

### ESP8266 Pin Allocation

```
ESP8266 NodeMCU Pinout:
┌─────────────────────────┐
│  USB      ┌─────────┐   │
│  PORT     │  ESP8266 │   │
│           │         │   │
│  [D0]────►│ GPIO16  │   │ ← Not used (bootstrapping)
│  [D1]────►│ GPIO5   │   │ ← RELAY (Fan Control)
│  [D2]────►│ GPIO4   │   │ ← DHT11 Data
│  [D3]────►│ GPIO0   │   │ ← BUZZER
│  [D4]────►│ GPIO2   │   │ ← SERVO Signal
│           │         │   │
│  [D5]────►│ GPIO14  │   │ ← PIR Entry
│  [D6]────►│ GPIO12  │   │ ← ULTRASONIC Trig
│  [D7]────►│ GPIO13  │   │ ← ULTRASONIC Echo
│  [D8]────►│ GPIO15  │   │ ← PIR Exit (optional)
│           │         │   │
│  [A0]────►│ ADC     │   │ ← MQ2 & LDR (via voltage divider)
│           │         │   │
│  [VIN]───►│ 5V IN   │   │ ← Power for sensors
│  [3V3]───►│ 3.3V    │   │ ← For low-power sensors
│  [GND]───►│ GND     │   │ ← Common ground
│  [GND]───►│ GND     │   │
└───────────┴─────────┘
```

---

## 🔹 Section A: Gas Storage Tank Wiring

### HC-SR04 Ultrasonic Sensor
```
HC-SR04 Pinout:
┌─────────────────┐
│   HC-SR04       │
│                 │
│  VCC ───────────┼──► VIN (5V)
│  Trig ──────────┼──► D6 (GPIO12)
│  Echo ──────────┼──► D7 (GPIO13)
│  GND ───────────┼──► GND
└─────────────────┘

Note: If using 3-wire version (no VCC pin), power from 3.3V
```

### MQ2 Gas Sensor Module
```
MQ2 Module Pinout:
┌─────────────────┐
│   MQ-2          │
│                 │
│  VCC ───────────┼──► VIN (5V)
│  AOUT ──────────┼──► A0 (Analog)
│  DOUT ──────────┼──► Not connected (using analog)
│  GND ───────────┼──► GND
└─────────────────┘

Important: Let sensor warm up for 2-3 minutes before use
```

### DHT11 Temperature/Humidity
```
DHT11 Pinout (front view):
┌─────────────────┐
│  DHT11          │
│  ●●●●           │
│  1 2 3 4        │
└─────────────────┘
Pin 1 (Left) ─────► VIN (5V)
Pin 2 ─────────────► D2 (GPIO4)
Pin 3 ─────────────► Not connected
Pin 4 (Right) ─────► GND

Add 10K pull-up resistor between Pin 1 and Pin 2
(most modules have this built-in)
```

---

## 🔹 Section B: Ventilation System Wiring

### 5V Relay Module (for Fan)
```
Relay Module Pinout:
┌─────────────────┐
│   RELAY         │
│                 │
│  VCC ───────────┼──► VIN (5V)
│  IN  ───────────┼──► D1 (GPIO5)
│  GND ───────────┼──► GND
│                 │
│  COM ───────────┼──► Fan + wire
│  NO  ───────────┼──► External 5V+
│  NC  ───────────┼──► Not connected
└─────────────────┘

Fan Wiring:
Fan + ───► Relay COM
Fan - ───► External 5V supply GND
External 5V+ ───► Relay NO (Normally Open)

When relay activates:
- COM connects to NO
- Circuit completes
- Fan turns ON
```

### SG90 Servo Motor (for Vent Flap)
```
SG90 Servo Pinout:
┌─────────────────┐
│  SG90           │
│  Brown/Red/Org  │
│  Wire colors:   │
└─────────────────┘
Brown ───────────► GND
Red ─────────────► VIN (5V)
Orange/Yellow ───► D4 (GPIO2)

Servo draws significant current!
Use separate 5V supply if jittery.
```

---

## 🔹 Section C: Security System Wiring

### PIR Motion Sensor
```
PIR Sensor Pinout:
┌─────────────────┐
│   PIR           │
│   HC-SR501      │
│                 │
│  VCC ───────────┼──► VIN (5V)
│  OUT ───────────┼──► D5 (GPIO14)
│  GND ───────────┼──► GND
└─────────────────┘

Adjustment Potentiometers:
- Time Delay: How long output stays HIGH
- Sensitivity: Detection range (2-7 meters)

For demo: Set sensitivity to medium, delay to short
```

### Active Buzzer
```
Buzzer Connection:
┌─────────────────┐
│  BUZZER         │
│  +  -           │
└─────────────────┘
+ (Long leg) ────► D3 (GPIO0) via NPN transistor
- (Short leg) ───► GND

Transistor Circuit (if buzzer > 20mA):
D3 ───► 1K resistor ───► Transistor Base
Buzzer + ───► Transistor Collector
Transistor Emitter ───► GND
Buzzer - ───► GND

Simple buzzers (<20mA) can connect directly to D3
```

---

## 🔹 Optional: Light Sensor (LDR)

```
LDR Circuit:
     5V
      │
      ├───┬─── A1 (Analog)
      │   │
     LDR  10K Resistor
      │   │
      ├───┴─── GND
      │
     GND

Voltage divider configuration:
- Bright light = Low resistance = Higher voltage at A1
- Dark = High resistance = Lower voltage at A1
```

---

## 🎯 Complete Assembly Diagram

### Physical Layout
```
┌─────────────────────────────────────────────────────┐
│                  FACTORY MODEL                      │
│                                                     │
│  ┌──────────────┐                                   │
│  │  TANK        │                                   │
│  │  SECTION     │                                   │
│  │              │                                   │
│  │  [ULTRASONIC]◄── Top of tank                    │
│  │      │       │                                   │
│  │      │       │                                   │
│  │  ┌───────┐   │                                   │
│  │  │TANK   │   │                                   │
│  │  │LIQUID │   │                                   │
│  │  └───────┘   │                                   │
│  │      │       │                                   │
│  │  [MQ2]       │◄── Near bottom/outlet             │
│  └──────────────┘                                   │
│                                                     │
│  ┌──────────────┐                                   │
│  │  VENTILATION │                                   │
│  │  SECTION     │                                   │
│  │              │                                   │
│  │  [FAN]       │◄── Mounted on wall                │
│  │              │                                   │
│  │  [SERVO]────[FLAP]                              │
│  └──────────────┘                                   │
│                                                     │
│  ┌──────────────┐                                   │
│  │  ENTRY       │                                   │
│  │  SECTION     │                                   │
│  │              │                                   │
│  │  [PIR]◄──At doorway                             │
│  │              │                                   │
│  │  [BUZZER]    │◄── Audible alert                  │
│  └──────────────┘                                   │
│                                                     │
│           ┌─────────────┐                           │
│           │ ESP8266     │                           │
│           │ + Sensors   │                           │
│           └─────────────┘                           │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Power Distribution

### Recommended Power Scheme
```
Main Power Input (USB or Barrel Jack)
        │
        ▼
┌───────────────────┐
│ ESP8266 VIN       │
│ 5V Regulator      │
└───────────────────┘
        │
        ├──────────────┬──────────────┬─────────────┐
        │              │              │             │
        ▼              ▼              ▼             ▼
   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
   │Sensors │    │Servo   │    │Relay   │    │Other   │
   │(5V)    │    │(5V)    │    │Coil    │    │(3.3V)  │
   │DHT11   │    │SG90    │    │5V      │    │        │
   │MQ2     │    │        │    │        │    │        │
   │HC-SR04 │    │        │    │        │    │        │
   │PIR     │    │        │    │        │    │        │
   └────────┘    └────────┘    └────────┘    └────────┘
   
Total Current Draw (estimated):
- Sensors: ~150mA
- Servo: ~200mA (under load)
- Relay coil: ~70mA
- ESP8266: ~80mA (WiFi TX)
- Total: ~500mA

Use good quality 5V 1A power supply minimum
```

---

## ⚠️ Important Notes

### Voltage Levels
- **ESP8266 I/O pins are 3.3V logic**
- Most sensors work with both 3.3V and 5V
- When in doubt, power sensors from 3.3V

### Grounding
- **ALL grounds must be common**
- Connect all GND pins together
- Prevents floating inputs and erratic behavior

### Current Limits
- ESP8266 GPIO pin max current: **12mA** per pin
- Total current from all GPIO: **~200mA**
- For high-current devices (servo, relay): Use external power

### Boot Strapping Pins
Avoid these pins for general I/O:
- **GPIO15 (D8)**: Must be LOW at boot
- **GPIO2 (D4)**: Has internal LED, pulls HIGH at boot
- **GPIO0 (D3)**: Used for flashing firmware
- **GPIO16 (D0)**: Used for deep sleep wake

### Analog Input
- A0 range: **0-1.0V** on most ESP8266 boards
- MQ2 outputs 0-5V → Use voltage divider!
- Or use module with built-in voltage divider

---

## 🔧 Troubleshooting Guide

### Issue: ESP8266 Resets When Servo Moves
**Cause:** Servo draws too much current  
**Solution:** 
- Use separate 5V supply for servo
- Add 100uF capacitor across power rails
- Reduce servo speed

### Issue: Gas Sensor Reads 0 or Max
**Cause:** Wrong wiring or insufficient warm-up  
**Solution:**
- Check VCC/GND connections
- Wait 2-3 minutes after power-on
- Verify A0 connection

### Issue: Ultrasonic Gives Erratic Readings
**Cause:** Timing issues or power noise  
**Solution:**
- Add 10uF capacitor near sensor
- Use separate ground wire
- Increase delay between readings

### Issue: PIR Always Triggers
**Cause:** Sensitivity too high or interference  
**Solution:**
- Adjust potentiometer counter-clockwise
- Move away from heat sources
- Add delay in code

### Issue: Relay Clicks But Fan Doesn't Spin
**Cause:** Insufficient fan voltage/current  
**Solution:**
- Check fan voltage rating
- Verify external power supply
- Test relay contacts with multimeter

---

## 📐 Mechanical Assembly Tips

### Mounting Sensors
- Use hot glue or double-sided tape
- Keep MQ2 away from direct airflow
- Position ultrasonic perpendicular to liquid surface
- Angle PIR toward expected motion path

### Wire Management
- Use zip ties or cable clips
- Label wires with tape
- Keep signal wires away from power wires
- Leave slack for adjustments

### Enclosure Design
- Ensure ventilation for heat dissipation
- Make MQ2 accessible for testing
- Provide window/display for dashboard
- Include on/off switch

---

## ✅ Pre-Demo Checklist

### Electrical
- [ ] All connections secure
- [ ] No loose wires or shorts
- [ ] Power supply adequate (5V 1A+)
- [ ] All grounds connected together

### Functional Tests
- [ ] WiFi connects successfully
- [ ] MQTT publishes data
- [ ] Each sensor returns reasonable values
- [ ] Relay clicks when gas detected
- [ ] Servo moves smoothly
- [ ] PIR detects motion
- [ ] Buzzer sounds

### Calibration
- [ ] Gas sensor warmed up (2-3 min)
- [ ] Ultrasonic reads correct distance
- [ ] PIR sensitivity adjusted
- [ ] Thresholds set appropriately

### Software
- [ ] Code uploaded to ESP8266
- [ ] SSID/password updated
- [ ] MQTT broker IP correct
- [ ] Serial monitor shows expected output

### Demo Ready
- [ ] Dashboard accessible
- [ ] Backend services running
- [ ] Test scenarios rehearsed
- [ ] Backup plan prepared

---

**You're now ready to build! 🛠️**

Take your time with wiring, double-check connections, and test each section individually before integrating.

Good luck! 🚀
