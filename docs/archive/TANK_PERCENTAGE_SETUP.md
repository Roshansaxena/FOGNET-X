# 🛢️ Tank Level Percentage Calculation Guide

## ✅ What's Been Added

Your ESP8266 now calculates **tank capacity percentage** based on ultrasonic sensor readings!

---

## 📊 How It Works

### **Tank Setup:**
- **Tank Height**: 10 cm (from sensor to bottom)
- **Flap Up** (close to sensor) = **FULL tank** (100%)
- **Flap Down** (far from sensor) = **EMPTY tank** (0%)

### **Calculation Logic:**

```cpp
// Inverse relationship: closer = more full
float percentage = ((TANK_MAX_HEIGHT_CM - distance) / TANK_MAX_HEIGHT_CM) * 100.0;
```

**Example:**
- Distance = 2 cm → Tank = **80% full** (flap is up)
- Distance = 5 cm → Tank = **50% full** (half full)
- Distance = 10 cm → Tank = **0% full** (flap down, empty)
- Distance > 10 cm → Tank = **0%** (out of range)

---

## 🎯 JSON Payload (What Gets Sent)

```json
{
  "temp": 28.5,
  "humidity": 62.0,
  "gas": 245,
  "gas_alert": 0,
  "motion": 0,
  "tank_dist": 3.5,
  "tank_overflow": 1,
  "tank_percentage": 65.0,    ← NEW! Real-time percentage
  "security": "SECURE"
}
```

---

## 📈 Serial Monitor Output

```
Temp: 28.5 | Gas: 245 | Tank Distance: 3.5 cm (65.0%)
Temp: 28.6 | Gas: 248 | Tank Distance: 8.2 cm (18.0%)
Temp: 28.5 | Gas: 250 | Tank Distance: 1.5 cm (85.0%)
```

---

## 🔧 Configuration

### **Adjust Tank Height (if needed):**

In your code:
```cpp
const float TANK_MAX_HEIGHT_CM = 10.0; // Change this to match your tank
```

**For different tanks:**
- 15 cm tank: `TANK_MAX_HEIGHT_CM = 15.0`
- 20 cm tank: `TANK_MAX_HEIGHT_CM = 20.0`
- etc.

---

## 🎮 Testing the Percentage

### **Test 1: Full Tank Demo**
1. Hold flap **close to sensor** (~2 cm)
2. Watch serial monitor:
   ```
   Tank Distance: 2.0 cm (80.0%)
   ```
3. Dashboard should show **80% tank level**

### **Test 2: Empty Tank Demo**
1. Lower flap **away from sensor** (~10 cm)
2. Watch serial monitor:
   ```
   Tank Distance: 10.0 cm (0.0%)
   ```
3. Dashboard shows **0% tank level**

### **Test 3: Overflow Detection**
1. Bring flap **very close** (< 5 cm)
2. Triggers overflow alert:
   ```
   tank_overflow: 1
   ```
3. Serial output:
   ```
   ⚠️ Tank overflow warning!
   ```

---

## 📊 Dashboard Display Ideas

### **Gauge Visualization:**
```
Tank Level
┌─────────────────┐
│ ████████░░░░░░░ │  65%
└─────────────────┘
```

### **Progress Bar:**
```html
<div class="tank-level">
  <div class="progress-bar" style="width: 65%">
    65% Full
  </div>
</div>
```

### **Color-Coded Status:**
- 🟢 **Green**: 60-100% (Good)
- 🟡 **Yellow**: 20-60% (Medium)
- 🔴 **Red**: 0-20% (Low/Empty)

---

## 🧮 Percentage Calculation Examples

| Distance (cm) | Calculation | Percentage | Status |
|---------------|-------------|------------|---------|
| 0.5 | (10 - 0.5) / 10 × 100 | **95%** | 🟢 Nearly Full |
| 1.0 | (10 - 1.0) / 10 × 100 | **90%** | 🟢 Full |
| 2.5 | (10 - 2.5) / 10 × 100 | **75%** | 🟢 Good |
| 5.0 | (10 - 5.0) / 10 × 100 | **50%** | 🟡 Half Full |
| 7.5 | (10 - 7.5) / 10 × 100 | **25%** | 🟡 Low |
| 9.0 | (10 - 9.0) / 10 × 100 | **10%** | 🔴 Very Low |
| 10.0 | (10 - 10.0) / 10 × 100 | **0%** | 🔴 Empty |
| 15.0 | Out of range | **0%** | ❌ Invalid |

---

## ⚠️ Edge Cases Handled

### **1. Out of Range (> 10 cm)**
```cpp
if (distance >= TANK_MAX_HEIGHT_CM || distance < 0) {
  return 0.0; // Shows as empty
}
```

**Why?** Flap removed or sensor error

---

### **2. Negative Values**
```cpp
return constrain(percentage, 0.0, 100.0);
```

**Why?** Prevents impossible percentages

---

### **3. Exactly at Max Height (10.0 cm)**
```cpp
Percentage = ((10.0 - 10.0) / 10.0) × 100 = 0%
```

**Result:** Shows as empty

---

## 🎯 Integration with Dashboard

### **Frontend Code (React Example):**

```jsx
// In your dashboard component
const tankPercentage = device.tank_percentage || 0;

<div className="tank-gauge">
  <div 
    className="tank-fill" 
    style={{ 
      height: `${tankPercentage}%`,
      backgroundColor: getTankColor(tankPercentage)
    }}
  />
  <span>{tankPercentage.toFixed(1)}%</span>
</div>

function getTankColor(percentage) {
  if (percentage > 60) return '#10b981'; // Green
  if (percentage > 20) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
}
```

---

## 📱 Mobile Alert Example

When tank is low:

```javascript
if (tankPercentage < 20) {
  sendNotification({
    title: "🛢️ Tank Low!",
    message: `Tank level is at ${tankPercentage.toFixed(1)}%`,
    priority: "HIGH"
  });
}
```

---

## 🔍 Troubleshooting

### **Problem: Percentage always shows 0%**

**Check:**
1. Is sensor reading valid distance?
   ```cpp
   Serial.println(tankDistance);
   ```
2. Is `TANK_MAX_HEIGHT_CM` set correctly?
3. Is flap moving properly?

---

### **Problem: Percentage exceeds 100%**

**Shouldn't happen anymore!** The `constrain()` function limits it:
```cpp
return constrain(percentage, 0.0, 100.0);
```

If you see >100%, check your sensor calibration.

---

### **Problem: Percentage jumps around**

**Causes:**
- Sensor noise
- Flap vibrating
- Poor connections

**Fixes:**
1. Add averaging:
   ```cpp
   // Take 5 readings and average
   float total = 0;
   for (int i = 0; i < 5; i++) {
     total += readUltrasonic();
     delay(50);
   }
   float avgDistance = total / 5;
   float percentage = calculateTankPercentage(avgDistance);
   ```

2. Add debounce capacitor (100nF) across sensor VCC-GND

---

## 🎓 Advanced Features

### **Add Tank Level History:**

Track percentage over time:
```cpp
// Store last 10 readings
float tankHistory[10];
int historyIndex = 0;

void updateHistory(float percentage) {
  tankHistory[historyIndex] = percentage;
  historyIndex = (historyIndex + 1) % 10;
}

float getAveragePercentage() {
  float sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += tankHistory[i];
  }
  return sum / 10;
}
```

---

### **Predict Time Until Empty:**

Calculate consumption rate:
```cpp
float previousPercentage = 0;
unsigned long lastChangeTime = 0;

void trackConsumption(float currentPercentage) {
  if (currentPercentage < previousPercentage) {
    unsigned long timeDiff = millis() - lastChangeTime;
    float percentagePerHour = (previousPercentage - currentPercentage) * (3600000.0 / timeDiff);
    float hoursUntilEmpty = currentPercentage / percentagePerHour;
    
    Serial.print("Hours until empty: ");
    Serial.println(hoursUntilEmpty);
  }
  previousPercentage = currentPercentage;
  lastChangeTime = millis();
}
```

---

## 🏆 Summary

### **What You Get:**

✅ **Real-time percentage**: Based on 10cm tank height  
✅ **Inverse logic**: Closer = fuller, farther = emptier  
✅ **JSON field**: `tank_percentage` sent to dashboard  
✅ **Serial display**: Shows both distance and percentage  
✅ **Overflow detection**: Alerts when tank too full  
✅ **Edge case handling**: Invalid readings show 0%  

---

### **Quick Reference:**

```
Flap UP (close)  → Small distance → HIGH percentage (Full)
Flap DOWN (far)  → Large distance → LOW percentage (Empty)

Distance: 2cm  →  80% Full
Distance: 5cm  →  50% Full
Distance: 10cm →   0% Empty
```

---

**Upload the updated code and test with your flap! 🛢️**

Watch the percentage change in real-time on your dashboard! ✨
