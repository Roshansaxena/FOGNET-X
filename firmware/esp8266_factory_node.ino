/*
 * FOGNET-X Industrial IoT Node - ESP8266 Implementation
 * ======================================================
 * Complete sensor + actuator control with auto-registration
 * 
 * Hardware:
 * - ESP8266 (NodeMCU/WeMos D1 Mini)
 * - DHT11/DHT22 Temperature & Humidity Sensor
 * - MQ-2 Gas Sensor
 * - PIR Motion Sensor
 * - Ultrasonic Sensor (HC-SR04)
 * - Relay Module (for Fan/Pump control)
 * - Servo Motor (for Vent control)
 * - LED indicators
 * 
 * Features:
 * ✅ Auto-registers on first connection
 * ✅ Publishes sensor data every 2 seconds
 * ✅ Receives actuator commands from fog node
 * ✅ Local safety automation
 * ✅ Heartbeat monitoring
 * ✅ WiFi reconnection logic
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>

// ==================== PIN DEFINITIONS ====================
#define DHTPIN D2           // DHT11/22 data pin
#define DHTTYPE DHT11       // DHT11 or DHT22
#define PIR_PIN D5          // PIR motion sensor
#define TRIG_PIN D6         // Ultrasonic trigger
#define ECHO_PIN D7         // Ultrasonic echo
#define RELAY_PIN D1        // Relay (Fan/Pump)
#define SERVO_PIN D4        // Servo motor (Vent)
#define LED_GREEN D0        // Status LED (Green)
#define LED_RED D3          // Alert LED (Red)
#define MQ2_PIN A0          // MQ-2 Gas sensor analog

// ==================== CONFIGURATION ====================
const char* ssid = "BEYONDER 5430";
const char* password = "tejas143";
const char* mqtt_server = "10.136.75.54";  // Fog Node IP
const int mqtt_port = 1883;

// Unique Device ID (MUST match what fog expects!)
const char* DEVICE_ID = "arduino_factory_01";

// Safety Thresholds
const int GAS_THRESHOLD = 400;         // Gas alert threshold
const float TANK_OVERFLOW_CM = 5.0;    // Tank overflow distance
const int TEMP_HIGH = 40.0;            // High temp threshold

// Publishing interval (milliseconds)
const unsigned long PUBLISH_INTERVAL = 2000;

// ==================== GLOBAL OBJECTS ====================
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
Servo ventServo;

// ==================== STATE VARIABLES ====================
unsigned long lastPublishTime = 0;
bool autoMode = true;              // Automatic safety mode
bool wifiConnected = false;
bool mqttConnected = false;
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 10;

// Sensor readings
float temperature = 0.0;
float humidity = 0.0;
int gasValue = 0;
int motionDetected = 0;
float tankDistance = 0.0;

// Actuator states
bool fanOn = false;
int ventPosition = 0;  // 0=closed, 90=open

// ==================== FUNCTION DECLARATIONS ====================
void setup_wifi();
void reconnect_mqtt();
void callback(char* topic, byte* payload, unsigned int length);
void read_sensors();
void publish_data();
void process_actuator_command(String command, String value);
void update_leds();
float readUltrasonic();
void safety_logic();

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n");
  Serial.println("========================================");
  Serial.println("🏭 FOGNET-X Factory IoT Node");
  Serial.println("========================================");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  // Default states
  digitalWrite(RELAY_PIN, HIGH);   // Relay OFF (active low)
  digitalWrite(LED_GREEN, LOW);
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
  }
  
  delay(100);  // Prevent watchdog reset
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
    digitalWrite(LED_GREEN, HIGH);
  } else {
    wifiConnected = false;
    Serial.println("\n❌ WiFi Connection Failed!");
    digitalWrite(LED_RED, HIGH);
    delay(2000);
    ESP.restart();  // Restart if can't connect
  }
}

// ==================== MQTT RECONNECT ====================
void reconnect_mqtt() {
  if (mqttConnected) {
    Serial.println("⚠️ MQTT disconnected, attempting reconnect...");
    mqttConnected = false;
    digitalWrite(LED_GREEN, LOW);
  }
  
  while (!client.connected() && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    Serial.print("🔌 MQTT Attempt ");
    Serial.print(reconnectAttempts);
    Serial.print("/");
    Serial.print(MAX_RECONNECT_ATTEMPTS);
    Serial.print("...");
    
    // Connect with device ID
    if (client.connect(DEVICE_ID)) {
      Serial.println("✅ Connected!");
      mqttConnected = true;
      reconnectAttempts = 0;
      digitalWrite(LED_GREEN, HIGH);
      
      // Subscribe to actuator command topics
      if (client.subscribe("factory/actuator/#")) {
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

// ==================== MQTT CALLBACK (ACTUATOR COMMANDS) ====================
void callback(char* topic, byte* payload, unsigned int length) {
  // Convert topic and message to String
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
  
  // Process commands based on topic
  if (topicStr == "factory/actuator/fan") {
    process_actuator_command("FAN", message);
  }
  else if (topicStr == "factory/actuator/vent") {
    process_actuator_command("VENT", message);
  }
  else if (topicStr == "factory/actuator/mode") {
    if (message == "AUTO") {
      autoMode = true;
      Serial.println("✅ Switched to AUTO mode");
    } else if (message == "MANUAL") {
      autoMode = false;
      Serial.println("✅ Switched to MANUAL mode");
    }
  }
  
  // Acknowledge command
  client.publish("factory/actuator/ack", String("OK:" + topicStr).c_str());
}

// ==================== ACTUATOR CONTROL ====================
void process_actuator_command(String actuator, String value) {
  if (actuator == "FAN") {
    if (value == "ON") {
      digitalWrite(RELAY_PIN, LOW);   // Active low
      fanOn = true;
      Serial.println("✅ FAN ON");
    } else if (value == "OFF") {
      digitalWrite(RELAY_PIN, HIGH);
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

// ==================== SENSOR READING ====================
void read_sensors() {
  // Temperature & Humidity
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  
  if (isnan(t) || isnan(h)) {
    Serial.println("⚠️ DHT sensor read failed, using defaults");
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
  
  // Ultrasonic tank level
  tankDistance = readUltrasonic();
  
  // Debug output
  Serial.println("\n--- Sensor Readings ---");
  Serial.printf("🌡 Temperature: %.1f°C\n", temperature);
  Serial.printf("💧 Humidity: %.1f%%\n", humidity);
  Serial.printf("💨 Gas: %d ppm\n", gasValue);
  Serial.printf("🔔 Motion: %s\n", motionDetected ? "DETECTED" : "None");
  Serial.printf("📏 Tank Distance: %.1f cm\n", tankDistance);
}

// ==================== SAFETY LOGIC (AUTOMATION) ====================
void safety_logic() {
  if (!autoMode) return;  // Skip if in manual mode
  
  bool gasAlert = (gasValue > GAS_THRESHOLD);
  bool highTemp = (temperature > TEMP_HIGH);
  bool tankOverflow = (tankDistance < TANK_OVERFLOW_CM);
  
  // Emergency response
  if (gasAlert || highTemp) {
    // Turn on exhaust fan
    if (!fanOn) {
      digitalWrite(RELAY_PIN, LOW);
      fanOn = true;
      Serial.println("🚨 SAFETY: Fan ON (Gas/High Temp detected)");
    }
    
    // Open vent
    if (ventPosition == 0) {
      ventServo.write(90);
      ventPosition = 90;
      Serial.println("🚨 SAFETY: Vent OPEN");
    }
    
    // Flash red LED
    digitalWrite(LED_RED, HIGH);
  }
  else if (tankOverflow) {
    // Close valve (relay OFF)
    digitalWrite(RELAY_PIN, HIGH);
    fanOn = false;
    Serial.println("⚠️ WARNING: Tank overflow - Valve CLOSED");
    
    digitalWrite(LED_RED, HIGH);
  }
  else {
    // Normal conditions
    digitalWrite(RELAY_PIN, HIGH);
    fanOn = false;
    ventServo.write(0);
    ventPosition = 0;
    digitalWrite(LED_RED, LOW);
  }
}

// ==================== LED STATUS INDICATORS ====================
void update_leds() {
  if (wifiConnected && mqttConnected) {
    digitalWrite(LED_GREEN, HIGH);  // Solid green = connected
  } else {
    // Blink green slowly
    digitalWrite(LED_GREEN, !digitalRead(LED_GREEN));
  }
  
  // Red LED shows alerts
  if (gasValue > GAS_THRESHOLD || temperature > TEMP_HIGH) {
    digitalWrite(LED_RED, HIGH);  // Solid red = alert
  } else {
    digitalWrite(LED_RED, LOW);
  }
}

// ==================== ULTRASONIC READING ====================
float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout
  
  if (duration == 0) {
    return 999.0;  // Out of range
  }
  
  float distance = duration * 0.034 / 2.0;
  return distance;
}

// ==================== PUBLISH DATA TO MQTT ====================
void publish_data() {
  // Build JSON payload
  String json = "{";
  json += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  json += "\"temp\":" + String(temperature, 2) + ",";
  json += "\"humidity\":" + String(humidity, 2) + ",";
  json += "\"gas\":" + String(gasValue) + ",";
  json += "\"gas_alert\":" + String((gasValue > GAS_THRESHOLD) ? 1 : 0) + ",";
  json += "\"motion\":" + String(motionDetected) + ",";
  json += "\"tank_dist\":" + String(tankDistance, 2) + ",";
  json += "\"tank_overflow\":" + String((tankDistance < TANK_OVERFLOW_CM) ? 1 : 0) + ",";
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
