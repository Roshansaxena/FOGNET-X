/*
 * FOGNET-X ESP32 on Wokwi Simulator
 * ===================================
 * Simulate MQTT sensor node without hardware!
 * 
 * Instructions:
 * 1. Open https://wokwi.com/esp32
 * 2. Create new project
 * 3. Add components: DHT22, Potentiometer, PIR, LEDs
 * 4. Copy this code
 * 5. Update WiFi & MQTT settings
 * 6. Click Play!
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Pin Definitions (Wokwi)
#define DHTPIN 23
#define DHTTYPE DHT22
#define GAS_PIN 34      // Potentiometer simulates gas sensor
#define PIR_PIN 27
#define LED_GREEN 0
#define LED_RED 17

// Configuration - UPDATE THESE!
const char* ssid = "YOUR_WIFI_NAME";        // Your WiFi
const char* password = "YOUR_PASSWORD";      // Your Password
const char* mqtt_server = "10.136.75.54";   // Your Fog Node IP
const int mqtt_port = 1883;

// Unique Device ID
const char* DEVICE_ID = "wokwi_sim_01";

// Thresholds
const int GAS_THRESHOLD = 400;
const float TEMP_HIGH = 40.0;

// Global objects
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

// State variables
unsigned long lastPublishTime = 0;
bool wifiConnected = false;
bool mqttConnected = false;
int reconnectAttempts = 0;

void setup_wifi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_GREEN, HIGH);
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi Failed!");
    
    // Fallback: Use Wokwi's simulated network for testing
    Serial.println("⚠️ Using offline mode - sensors will still work!");
    digitalWrite(LED_RED, HIGH);
  }
}

void reconnect_mqtt() {
  if (!client.connected()) {
    Serial.print("🔌 Attempting MQTT connection...");
    
    if (client.connect(DEVICE_ID)) {
      Serial.println("✅ Connected to FOGNET-X!");
      mqttConnected = true;
      
      // Subscribe to actuator commands
      client.subscribe("factory/actuator/#");
      Serial.println("📡 Subscribed to factory/actuator/#");
      
      // Send heartbeat
      client.publish("factory/status/heartbeat", "alive");
      
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5s...");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message;
  
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("\n📩 Command Received:");
  Serial.print("Topic: ");
  Serial.println(topicStr);
  Serial.print("Message: ");
  Serial.println(message);
  
  // Process commands
  if (topicStr == "factory/actuator/fan") {
    Serial.println(message == "ON" ? "✅ FAN ON" : "✅ FAN OFF");
  }
  else if (topicStr == "factory/actuator/vent") {
    Serial.println(message == "OPEN" ? "✅ VENT OPEN" : "✅ VENT CLOSED");
  }
}

void read_sensors(float &temp, float &humidity, int &gas, int &motion) {
  // Read DHT22
  temp = dht.readTemperature();
  humidity = dht.readHumidity();
  
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("⚠️ DHT read failed - using simulated values");
    temp = 25.0 + random(50) / 10.0;  // Simulate 25-30°C
    humidity = 50.0 + random(200) / 10.0;  // Simulate 50-70%
  }
  
  // Read gas (potentiometer 0-4095 on ADC)
  gas = analogRead(GAS_PIN);
  
  // Map potentiometer (0-4095) to gas range (0-1000 ppm)
  gas = map(gas, 0, 4095, 0, 1000);
  
  // Read motion (simulated with button/random)
  motion = digitalRead(PIR_PIN);
  
  // Optional: Random motion for testing
  if (random(100) < 5) {  // 5% chance of random motion
    motion = HIGH;
  }
}

void publish_data(float temp, float humidity, int gas, int motion) {
  // Create JSON payload
  StaticJsonDocument<256> doc;
  
  doc["device_id"] = DEVICE_ID;
  doc["temp"] = temp;
  doc["humidity"] = humidity;
  doc["gas"] = gas;
  doc["gas_alert"] = (gas > GAS_THRESHOLD) ? 1 : 0;
  doc["motion"] = motion;
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  
  String json;
  serializeJson(doc, json);
  
  // Publish to MQTT
  if (client.publish("factory/sensor/data", json.c_str())) {
    Serial.println("✅ Published: " + json);
  } else {
    Serial.println("❌ Publish failed");
  }
  
  // Heartbeat
  client.publish("factory/status/heartbeat", "alive");
}

void safety_logic(float temp, int gas) {
  bool alert = (gas > GAS_THRESHOLD) || (temp > TEMP_HIGH);
  
  if (alert) {
    Serial.println("🚨 ALERT: Gas or Temperature high!");
    digitalWrite(LED_RED, HIGH);
    
    // Auto-trigger actuators
    if (mqttConnected) {
      client.publish("factory/actuator/fan", "ON");
      client.publish("factory/actuator/vent", "OPEN");
      Serial.println("⚠️ Actuators triggered: FAN ON, VENT OPEN");
    }
  } else {
    digitalWrite(LED_RED, LOW);
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n========================================");
  Serial.println("🏭 FOGNET-X Wokwi Simulator");
  Serial.println("========================================");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  
  // Initialize pins
  pinMode(GAS_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  
  // Initialize sensors
  dht.begin();
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  Serial.println("✨ Simulator ready!");
  Serial.println("========================================\n");
  Serial.println("💡 Controls:");
  Serial.println("- Turn potentiometer to change 'gas' level");
  Serial.println("- Press button to trigger 'motion'");
  Serial.println("- Watch Serial Monitor for data!");
  Serial.println("========================================\n");
}

void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();
  
  // Read sensors every 2 seconds
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= 2000) {
    lastPublishTime = currentTime;
    
    // Read all sensors
    float temperature, humidity;
    int gasValue, motionDetected;
    read_sensors(temperature, humidity, gasValue, motionDetected);
    
    // Debug output
    Serial.println("\n--- Sensor Readings ---");
    Serial.printf("🌡 Temperature: %.1f°C\n", temperature);
    Serial.printf("💧 Humidity: %.1f%%\n", humidity);
    Serial.printf("💨 Gas: %d ppm\n", gasValue);
    Serial.printf("🔔 Motion: %s\n", motionDetected ? "DETECTED" : "None");
    
    // Safety logic
    safety_logic(temperature, gasValue);
    
    // Publish data
    if (mqttConnected) {
      publish_data(temperature, humidity, gasValue, motionDetected);
    } else {
      Serial.println("⚠️ MQTT not connected - showing local data only");
    }
    
    Serial.println("======================\n");
  }
  
  delay(100);
}
