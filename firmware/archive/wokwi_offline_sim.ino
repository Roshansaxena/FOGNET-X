/*
 * FOGNET-X Wokwi Simulator - OFFLINE VERSION
 * ===========================================
 * No WiFi/MQTT required - simulates everything locally!
 * Perfect for testing sensor logic and visualization
 */

#include <DHT.h>
#include <ArduinoJson.h>

// Pin Definitions
#define DHTPIN 23
#define DHTTYPE DHT22
#define GAS_PIN 34
#define PIR_PIN 27
#define LED_GREEN 0
#define LED_RED 17

// Thresholds
const int GAS_THRESHOLD = 400;
const float TEMP_HIGH = 40.0;

DHT dht(DHTPIN, DHTTYPE);

unsigned long lastUpdate = 0;
int simulatedGas = 200;
float simulatedTemp = 28.0;

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n========================================");
  Serial.println("🏭 FOGNET-X Offline Simulator");
  Serial.println("========================================");
  Serial.println("Device ID: wokwi_offline_01");
  
  pinMode(GAS_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  digitalWrite(LED_GREEN, HIGH);  // Always on (offline mode)
  dht.begin();
  
  Serial.println("✨ Ready! Adjust potentiometer & button");
  Serial.println("========================================\n");
}

void loop() {
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate >= 2000) {
    lastUpdate = currentTime;
    
    // Read sensors
    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();
    int gas = analogRead(GAS_PIN);
    int motion = digitalRead(PIR_PIN);
    
    // Map gas (potentiometer 0-4095 → 0-1000 ppm)
    gas = map(gas, 0, 4095, 0, 1000);
    
    // Use simulated values if DHT fails
    if (isnan(temp)) temp = simulatedTemp;
    if (isnan(humidity)) humidity = 50.0;
    
    // Add some random variation
    if (random(100) < 10) {
      simulatedTemp += (random(100) - 50) / 10.0;  // ±0.5°C
      simulatedTemp = constrain(simulatedTemp, 25, 35);
    }
    
    // Random motion if no button press
    if (motion == LOW && random(100) < 5) {
      motion = HIGH;
    }
    
    // Display readings
    Serial.println("\n=== SENSOR READINGS ===");
    Serial.printf("🌡 Temperature: %.1f°C\n", temp);
    Serial.printf("💧 Humidity: %.1f%%\n", humidity);
    Serial.printf("💨 Gas: %d ppm\n", gas);
    Serial.printf("🔔 Motion: %s\n", motion ? "DETECTED" : "None");
    
    // Safety logic
    bool alert = (gas > GAS_THRESHOLD) || (temp > TEMP_HIGH);
    
    if (alert) {
      Serial.println("\n🚨 ALERT TRIGGERED!");
      Serial.println("⚠️ Automatic Response:");
      Serial.println("   - FAN ON");
      Serial.println("   - VENT OPEN");
      Serial.println("   - ALARM ACTIVATED");
      digitalWrite(LED_RED, HIGH);
    } else {
      digitalWrite(LED_RED, LOW);
    }
    
    // Simulate MQTT payload (for reference)
    StaticJsonDocument<256> doc;
    doc["device_id"] = "wokwi_offline_01";
    doc["temp"] = temp;
    doc["humidity"] = humidity;
    doc["gas"] = gas;
    doc["gas_alert"] = alert ? 1 : 0;
    doc["motion"] = motion;
    
    String json;
    serializeJson(doc, json);
    
    Serial.println("\n📡 Would publish to MQTT:");
    Serial.println(json);
    Serial.println("========================\n");
    
    // Update simulated values based on user input
    simulatedGas = gas;
    simulatedTemp = temp;
  }
  
  delay(100);
}
