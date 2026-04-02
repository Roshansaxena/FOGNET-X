/*
 * FOGNET-X ESP8266 Factory Node - Optimized Version
 * ==================================================
 * Includes ONLY the sensors and actuators you actually have
 * 
 * Hardware:
 * - ESP8266 NodeMCU (ESP-12E)
 * - DHT11/DHT22: Temperature & Humidity
 * - MQ-2: Gas sensor
 * - PIR: Motion detection
 * - HC-SR04: Ultrasonic (tank level)
 * - Relay Module: Fan control
 * - SG90 Servo: Vent control
 * - LEDs: Status indicators
 * 
 * Features:
 * ✅ Auto-registers on first connection
 * ✅ Publishes sensor data every 2 seconds
 * ✅ Receives actuator commands via MQTT
 * ✅ Local safety automation
 * ✅ WiFi reconnection logic
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>

// ==================== PIN DEFINITIONS (NodeMCU) ====================
// DHT Sensor
#define DHTPIN D2           // GPIO 4
#define DHTTYPE DHT11       // or DHT22

// MQ-2 Gas Sensor
#define MQ2_PIN A0          // Analog pin

// PIR Motion Sensor
#define PIR_PIN D5          // GPIO 14

// Ultrasonic Sensor (HC-SR04)
#define TRIG_PIN D6         // GPIO 12
#define ECHO_PIN D7         // GPIO 13

// Actuators
#define RELAY_FAN D1        // GPIO 5 - Fan control
#define SERVO_PIN D4        // GPIO 2 - Vent control

// Status LEDs
#define LED_GREEN D0        // GPIO 16 (built-in LED, inverted)
#define LED_RED D3          // GPIO 0

// ==================== CONFIGURATION ====================
const char* ssid = "BEYONDER 5430";
const char* password = "tejas143";
const char* mqtt_server = "10.136.75.54";  // Fog Node IP
const int mqtt_port = 1883;

// Unique Device ID (CHANGE for each device!)
const char* DEVICE_ID = "esp8266_factory_01";

// Safety Thresholds
const int GAS_THRESHOLD = 400;
const int GAS_CRITICAL = 700;
const float TEMP_HIGH = 40.0;
const float TEMP_CRITICAL = 50.0;
const float TANK_LOW_CM = 10.0;

// Publishing interval
const unsigned long PUBLISH_INTERVAL = 2000;  // 2 seconds

// ==================== GLOBAL OBJECTS ====================
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
Servo ventServo;

// ==================== STATE VARIABLES ====================
unsigned long lastPublishTime = 0;
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 15;

bool wifiConnected = false;
bool mqttConnected = false;
bool autoMode = true;

// Actuator states
bool fanOn = false;
int ventPosition = 0;  // 0=closed, 90=open
bool alarmActive = false;

// Sensor readings
float temperature = 25.0;
float humidity = 50.0;
int gasValue = 0;
int motionDetected = 0;
float tankDistance = 0.0;

// ==================== FUNCTION DECLARATIONS ====================
void setup_wifi();
void reconnect_mqtt();
void callback(char* topic, byte* payload, unsigned int length);
void read_sensors();
void publish_data();
void process_actuator_command(String command, String value);
void safety_logic();
void update_leds();
float readUltrasonic();
void test_hc_sr04();  // Diagnostic function

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n");
  Serial.println("========================================");
  Serial.println("🏭 FOGNET-X ESP8266 Factory Node");
  Serial.println("========================================");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("Chip Model: ");
  Serial.println(ESP.getChipModel());
  Serial.print("CPU Frequency: ");
  Serial.print(ESP.getCpuFreqMHz());
  Serial.println(" MHz");
  
  // Initialize pins
  pinMode(MQ2_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(SERVO_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  // Default states (all OFF)
  digitalWrite(RELAY_FAN, HIGH);   // Active low relay
  digitalWrite(LED_GREEN, HIGH);   // Built-in LED is inverted
  digitalWrite(LED_RED, LOW);
  
  // Initialize servo
  ventServo.attach(SERVO_PIN);
  ventServo.write(0);  // Closed position
  
  // Initialize sensors
  dht.begin();
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  Serial.println("✨ Initialization complete!");
  Serial.println("========================================\n");
  
  // Run HC-SR04 diagnostic test
  Serial.println("🔍 Running HC-SR04 diagnostic...");
  test_hc_sr04();
  Serial.println();
}

// ==================== MAIN LOOP ====================
void loop() {
  // Maintain MQTT connection
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();
  
  // Read sensors and publish at intervals
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = currentTime;
    
    read_sensors();
    safety_logic();
    publish_data();
    update_leds();
    
    Serial.printf("✅ Published | Temp: %.1f°C | Gas: %d | Motion: %s\n", 
                  temperature, gasValue, motionDetected ? "YES" : "NO");
  }
  
  yield();  // ESP8266 needs this for background tasks
  delay(100);
}

// ==================== WIFI SETUP ====================
void setup_wifi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.println(WiFi.RSSI());
    digitalWrite(LED_GREEN, LOW);  // Turn on (inverted)
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi Connection Failed!");
    digitalWrite(LED_RED, HIGH);
    delay(2000);
    ESP.restart();
  }
}

// ==================== MQTT RECONNECT ====================
void reconnect_mqtt() {
  if (mqttConnected) {
    Serial.println("⚠️ MQTT disconnected, attempting reconnect...");
    mqttConnected = false;
    digitalWrite(LED_GREEN, HIGH);  // Turn off (inverted)
  }
  
  while (!client.connected() && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    Serial.print("🔌 MQTT Attempt ");
    Serial.print(reconnectAttempts);
    Serial.print("/");
    Serial.print(MAX_RECONNECT_ATTEMPTS);
    Serial.print("...");
    
    if (client.connect(DEVICE_ID)) {
      Serial.println("✅ Connected!");
      mqttConnected = true;
      reconnectAttempts = 0;
      digitalWrite(LED_GREEN, LOW);  // Turn on (inverted)
      
      // Subscribe to actuator topics
      if (client.subscribe("factory/actuator/#", 1)) {
        Serial.println("📡 Subscribed to: factory/actuator/#");
      }
      
      // Send initial heartbeat
      client.publish("factory/status/heartbeat", "alive");
      Serial.println("💓 Initial heartbeat sent");
      
    } else {
      Serial.print("❌ Failed (rc=");
      Serial.print(client.state());
      Serial.println("), retrying in 5s...");
      delay(5000);
    }
  }
  
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    Serial.println("❌ Max reconnect attempts reached. Restarting...");
    delay(2000);
    ESP.restart();
  }
}

// ==================== MQTT CALLBACK ====================
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
    process_actuator_command("FAN", message);
  }
  else if (topicStr == "factory/actuator/vent") {
    process_actuator_command("VENT", message);
  }
  else if (topicStr == "factory/actuator/mode") {
    if (message == "AUTO") {
      autoMode = true;
      Serial.println("✅ AUTO mode enabled");
    } else if (message == "MANUAL") {
      autoMode = false;
      Serial.println("✅ MANUAL mode enabled");
    }
  }
  
  // Acknowledge
  client.publish("factory/actuator/ack", String("OK:" + topicStr).c_str());
}

// ==================== ACTUATOR CONTROL ====================
void process_actuator_command(String actuator, String value) {
  if (actuator == "FAN") {
    if (value == "ON") {
      digitalWrite(RELAY_FAN, LOW);
      fanOn = true;
      Serial.println("✅ FAN ON");
    } else if (value == "OFF") {
      digitalWrite(RELAY_FAN, HIGH);
      fanOn = false;
      Serial.println("✅ FAN OFF");
    }
  }
  else if (actuator == "VENT") {
    if (value == "OPEN") {
      ventServo.write(90);
      ventPosition = 90;
      Serial.println("✅ VENT OPEN");
    } else if (value == "CLOSE") {
      ventServo.write(0);
      ventPosition = 0;
      Serial.println("✅ VENT CLOSED");
    }
  }
}

// ==================== READ SENSORS ====================
void read_sensors() {
  // Temperature & Humidity
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  
  if (isnan(t) || isnan(h)) {
    Serial.println("⚠️ DHT read failed");
    temperature = 25.0;
    humidity = 50.0;
  } else {
    temperature = t;
    humidity = h;
  }
  
  // Gas sensor
  gasValue = analogRead(MQ2_PIN);
  
  // Motion sensor
  motionDetected = digitalRead(PIR_PIN);
  
  // Ultrasonic (tank level)
  tankDistance = readUltrasonic();
  
  // Debug output
  Serial.println("\n--- Sensor Readings ---");
  Serial.printf("🌡 Temperature: %.1f°C\n", temperature);
  Serial.printf("💧 Humidity: %.1f%%\n", humidity);
  Serial.printf("💨 Gas: %d ppm\n", gasValue);
  Serial.printf("🔔 Motion: %s\n", motionDetected ? "DETECTED" : "None");
  if (tankDistance < 999.0) {
    Serial.printf("📏 Tank Distance: %.1f cm ✅\n", tankDistance);
  } else {
    Serial.printf("📏 Tank Distance: OUT OF RANGE (no echo) ❌\n");
  }
}

// ==================== SAFETY LOGIC ====================
void safety_logic() {
  if (!autoMode) return;
  
  bool gasAlert = (gasValue > GAS_THRESHOLD);
  bool gasCritical = (gasValue > GAS_CRITICAL);
  bool highTemp = (temperature > TEMP_HIGH);
  bool tempCritical = (temperature > TEMP_CRITICAL);
  bool tankLow = (tankDistance < TANK_LOW_CM);
  
  // Emergency response
  if (gasCritical || tempCritical) {
    // Turn on exhaust fan
    if (!fanOn) {
      digitalWrite(RELAY_FAN, LOW);
      fanOn = true;
      Serial.println("🚨 EMERGENCY: Fan ON");
    }
    
    // Open vent
    if (ventPosition == 0) {
      ventServo.write(90);
      ventPosition = 90;
      Serial.println("🚨 EMERGENCY: Vent OPEN");
    }
    
    // Flash red LED
    digitalWrite(LED_RED, HIGH);
  }
  else if (gasAlert || highTemp) {
    // Warning level
    digitalWrite(RELAY_FAN, LOW);
    fanOn = true;
    ventServo.write(90);
    ventPosition = 90;
    digitalWrite(LED_RED, HIGH);
  }
  else if (tankLow) {
    // Close valve to prevent overflow
    if (fanOn) {
      digitalWrite(RELAY_FAN, HIGH);
      fanOn = false;
      Serial.println("⚠️ Tank low - Pump OFF");
    }
  }
  else {
    // Normal conditions - everything OFF
    digitalWrite(RELAY_FAN, HIGH);
    fanOn = false;
    ventServo.write(0);
    ventPosition = 0;
    digitalWrite(LED_RED, LOW);
  }
}

// ==================== LED STATUS ====================
void update_leds() {
  if (wifiConnected && mqttConnected) {
    digitalWrite(LED_GREEN, LOW);  // Solid on (inverted)
  } else {
    digitalWrite(LED_GREEN, !digitalRead(LED_GREEN));  // Blink
  }
  
  // Red = alert
  if (gasValue > GAS_THRESHOLD || temperature > TEMP_HIGH) {
    digitalWrite(LED_RED, HIGH);
  } else {
    digitalWrite(LED_RED, LOW);
  }
}

// ==================== ULTRASONIC READING ====================
float readUltrasonic() {
  // Ensure pins are set correctly
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Clear the trigger pin
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Send 10us trigger pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo with timeout (30ms = ~5 meters max)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  // Check for invalid readings
  if (duration == 0) {
    Serial.println("⚠️ HC-SR04: No echo received (timeout or out of range)");
    return 999.0;  // Out of range
  }
  
  // Calculate distance (speed of sound = 340m/s = 0.034 cm/us)
  float distance = duration * 0.034 / 2.0;
  
  // Validate reasonable range (2cm to 400cm)
  if (distance < 2.0 || distance > 400.0) {
    Serial.printf("⚠️ HC-SR04: Invalid reading %.1f cm\n", distance);
    return 999.0;
  }
  
  return distance;
}

// ==================== HC-SR04 DIAGNOSTIC TEST ====================
void test_hc_sr04() {
  Serial.println("\n--- HC-SR04 Diagnostic ---");
  Serial.printf("Trig Pin: D%d (GPIO %d)\n", 6, 12);
  Serial.printf("Echo Pin: D%d (GPIO %d)\n", 7, 13);
  
  // Take 5 readings
  int validReadings = 0;
  float total = 0;
  
  for (int i = 0; i < 5; i++) {
    float dist = readUltrasonic();
    if (dist < 999.0) {
      validReadings++;
      total += dist;
      Serial.printf("Reading %d: %.1f cm ✅\n", i+1, dist);
    } else {
      Serial.printf("Reading %d: FAILED ❌\n", i+1);
    }
    delay(100);
  }
  
  if (validReadings > 0) {
    Serial.printf("\n✅ SUCCESS: %d/5 valid readings\n", validReadings);
    Serial.printf("Average distance: %.1f cm\n", total / validReadings);
  } else {
    Serial.println("\n❌ FAILED: No valid readings!");
    Serial.println("\nTroubleshooting:");
    Serial.println("1. Check VCC connection (use 5V if possible)");
    Serial.println("2. Check GND connection");
    Serial.println("3. Check Trig/Echo wire connections");
    Serial.println("4. Echo pin may need voltage divider (5V→3.3V)");
    Serial.println("5. Object too close (<2cm) or too far (>400cm)");
  }
}

// ==================== PUBLISH DATA ====================
void publish_data() {
  // Build JSON manually (no ArduinoJson needed for simple data)
  String json = "{";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"temp\":" + String(temperature, 1) + ",";
  json += "\"humidity\":" + String(humidity, 1) + ",";
  json += "\"gas\":" + String(gasValue) + ",";
  json += "\"gas_alert\":" + String((gasValue > GAS_THRESHOLD) ? 1 : 0) + ",";
  json += "\"motion\":" + String(motionDetected) + ",";
  json += "\"tank_dist\":" + String(tankDistance, 1) + ",";
  json += "\"tank_overflow\":" + String((tankDistance < TANK_LOW_CM) ? 1 : 0) + ",";
  json += "\"fan_status\":" + String(fanOn ? 1 : 0) + ",";
  json += "\"vent_position\":" + String(ventPosition) + ",";
  json += "\"auto_mode\":" + String(autoMode ? 1 : 0) + ",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"uptime\":" + String(millis() / 1000);
  json += "}";
  
  // Publish sensor data
  boolean published1 = client.publish("factory/sensor/data", json.c_str());
  
  // Publish heartbeat
  boolean published2 = client.publish("factory/status/heartbeat", "alive");
  
  if (published1 && published2) {
    Serial.println("✅ Data published successfully");
  } else {
    Serial.println("❌ Publish failed");
  }
}
