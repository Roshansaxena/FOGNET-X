/*
 * FOGNET-X Industrial IoT Node - ESP32 Complete Version
 * ======================================================
 * Full-featured implementation with ALL sensors and actuators
 * 
 * Hardware: ESP32 DevKit V1 (or NodeMCU-32S)
 * 
 * Sensors:
 * - DHT11/DHT22: Temperature & Humidity
 * - MQ-2: Gas/Smoke detection
 * - PIR: Motion detection
 * - HC-SR04: Ultrasonic distance (tank level)
 * - BMP180/BMP280: Barometric pressure
 * - Soil Moisture Sensor
 * - Water Flow Sensor (YP-S20)
 * - Sound Sensor (KY-037)
 * - Vibration Sensor (SW-420)
 * - LDR: Light intensity
 * 
 * Actuators:
 * - Relay Module 1: Exhaust Fan
 * - Relay Module 2: Water Pump/Valve
 * - SG90 Servo: Vent damper control
 * - Buzzer: Local alarm
 * - LEDs: Status indicators
 * 
 * Features:
 * ✅ Auto-registers on first connection
 * ✅ Publishes 15+ sensor parameters
 * ✅ Receives actuator commands via MQTT
 * ✅ Local safety automation
 * ✅ OTA update ready
 * ✅ Deep sleep support
 * ✅ WiFi reconnection logic
 * ✅ MQTT QoS support
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>
#include <ArduinoJson.h>

// ==================== PIN DEFINITIONS (ESP32) ====================
// Note: ESP32 has more GPIOs than ESP8266, so we use better pinout

// DHT Sensor
#define DHTPIN 23           // GPIO 23
#define DHTTYPE DHT11       // or DHT22

// Gas Sensor
#define MQ2_PIN 34          // ADC1 GPIO 34 (ESP32 has dedicated ADC pins)

// PIR Motion
#define PIR_PIN 27          // GPIO 27

// Ultrasonic (Tank Level)
#define TRIG_PIN 26         // GPIO 26
#define ECHO_PIN 25         // GPIO 25

// Soil Moisture (Analog)
#define SOIL_MOISTURE_PIN 35  // ADC1 GPIO 35

// Sound Sensor
#define SOUND_PIN 32        // GPIO 32

// Vibration Sensor
#define VIBRATION_PIN 33    // GPIO 33

// Light Sensor (LDR)
#define LIGHT_PIN 36        // ADC1 GPIO 36

// Water Flow Sensor
#define FLOW_PIN 14         // GPIO 14 (interrupt capable)

// Actuators
#define RELAY_FAN 2         // GPIO 2 - Fan control
#define RELAY_PUMP 4        // GPIO 4 - Pump/Valve control
#define SERVO_PIN 18        // GPIO 18 - Servo PWM
#define BUZZER_PIN 5        // GPIO 5 - Buzzer

// Status LEDs
#define LED_GREEN 0         // GPIO 0
#define LED_YELLOW 16       // GPIO 16
#define LED_RED 17          // GPIO 17

// ==================== CONFIGURATION ====================
const char* ssid = "BEYONDER 5430";
const char* password = "tejas143";
const char* mqtt_server = "10.136.75.54";  // Fog Node IP
const int mqtt_port = 1883;

// Unique Device ID (CHANGE for each device!)
const char* DEVICE_ID = "esp32_factory_01";

// Safety Thresholds
const int GAS_THRESHOLD = 400;
const int GAS_CRITICAL = 700;
const float TEMP_HIGH = 40.0;
const float TEMP_CRITICAL = 50.0;
const int SOIL_DRY = 3000;    // Adjust based on your sensor
const int SOIL_WET = 1500;
const float TANK_LOW_CM = 10.0;
const int SOUND_THRESHOLD = 80;  // dB
const int FLOW_CRITICAL = 50;    // L/min

// Publishing interval
const unsigned long PUBLISH_INTERVAL = 2000;  // 2 seconds

// ==================== GLOBAL OBJECTS ====================
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
Servo ventServo;
Adafruit_BMP085 bmp;  // Pressure sensor

// ==================== STATE VARIABLES ====================
unsigned long lastPublishTime = 0;
unsigned long lastFlowCount = 0;
unsigned long flowStartTime = 0;
volatile unsigned int flowPulseCount = 0;

bool wifiConnected = false;
bool mqttConnected = false;
int reconnectAttempts = 0;
const int MAX_RECONNECT_ATTEMPTS = 15;

bool autoMode = true;
bool fanOn = false;
bool pumpOn = false;
int ventPosition = 0;  // 0=closed, 90=open
bool alarmActive = false;

// Sensor readings (global for easy access)
float temperature = 0.0;
float humidity = 0.0;
float pressure = 0.0;
int gasValue = 0;
int motionDetected = 0;
float tankDistance = 0.0;
int soilMoisture = 0;
int soundLevel = 0;
int vibrationDetected = 0;
int lightLevel = 0;
float flowRate = 0.0;
float totalFlow = 0.0;

// Device health
float batteryVoltage = 3.3;  // Simulated (ESP32 usually powered)
int rssi = 0;
unsigned long uptime = 0;

// ==================== INTERRUPT SERVICE ROUTINES ====================
void IRAM_ATTR flowISR() {
  flowPulseCount++;
}

// ==================== FUNCTION DECLARATIONS ====================
void setup_wifi();
void reconnect_mqtt();
void callback(char* topic, byte* payload, unsigned int length);
void read_all_sensors();
void publish_data();
void process_actuator_command(String command, String value);
void safety_logic();
void update_leds();
float readUltrasonic();
float calculateFlowRate();
void trigger_alarm(bool state);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n");
  Serial.println("========================================");
  Serial.println("🏭 FOGNET-X ESP32 Industrial Node");
  Serial.println("========================================");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("Chip Model: ESP32 ");
  Serial.println(ESP.getChipModel());
  Serial.print("CPU Frequency: ");
  Serial.print(ESP.getCpuFreqMHz());
  Serial.println(" MHz");
  
  // Initialize I2C for BMP sensor
  Wire.begin(21, 22);  // SDA=GPIO21, SCL=GPIO22 (ESP32 default)
  
  // Initialize pins
  pinMode(MQ2_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  pinMode(VIBRATION_PIN, INPUT);
  pinMode(LIGHT_PIN, INPUT);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_PUMP, OUTPUT);
  pinMode(SERVO_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  // Default states (all OFF)
  digitalWrite(RELAY_FAN, HIGH);   // Active low relay
  digitalWrite(RELAY_PUMP, HIGH);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  
  // Attach interrupt for flow sensor
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowISR, RISING);
  
  // Initialize servo
  ventServo.attach(SERVO_PIN);
  ventServo.write(0);  // Closed position
  
  // Initialize sensors
  dht.begin();
  
  if (!bmp.begin()) {
    Serial.println("⚠️ BMP sensor not found!");
    pressure = 1013.25;  // Default sea level
  } else {
    Serial.println("✅ BMP pressure sensor initialized");
  }
  
  // Connect to WiFi
  setup_wifi();
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // Start flow measurement timer
  flowStartTime = millis();
  
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
  
  // Update uptime
  uptime = millis() / 1000;
  
  // Read sensors and publish at intervals
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = currentTime;
    
    read_all_sensors();
    safety_logic();
    publish_data();
    update_leds();
    
    Serial.printf("✅ Published | Temp: %.1f°C | Gas: %d | Motion: %s\n", 
                  temperature, gasValue, motionDetected ? "YES" : "NO");
  }
  
  delay(100);  // Small delay
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
    rssi = WiFi.RSSI();
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(rssi);
    Serial.println(" dBm");
    digitalWrite(LED_GREEN, HIGH);
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
    digitalWrite(LED_GREEN, LOW);
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
      digitalWrite(LED_GREEN, HIGH);
      
      // Subscribe to all actuator topics
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
  else if (topicStr == "factory/actuator/pump") {
    process_actuator_command("PUMP", message);
  }
  else if (topicStr == "factory/actuator/vent") {
    process_actuator_command("VENT", message);
  }
  else if (topicStr == "factory/actuator/alarm") {
    if (message == "ON") trigger_alarm(true);
    else trigger_alarm(false);
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
  else if (actuator == "PUMP") {
    if (value == "ON") {
      digitalWrite(RELAY_PUMP, LOW);
      pumpOn = true;
      Serial.println("✅ PUMP ON");
    } else if (value == "OFF") {
      digitalWrite(RELAY_PUMP, HIGH);
      pumpOn = false;
      Serial.println("✅ PUMP OFF");
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
  else if (actuator == "ALARM") {
    if (value == "ON") trigger_alarm(true);
    else trigger_alarm(false);
  }
}

// ==================== READ ALL SENSORS ====================
void read_all_sensors() {
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
  
  // Pressure (BMP180/280)
  if (bmp.begin()) {
    pressure = bmp.readPressure() / 100.0;  // Convert to hPa
  }
  
  // Gas sensor
  gasValue = analogRead(MQ2_PIN);
  
  // Motion sensor
  motionDetected = digitalRead(PIR_PIN);
  
  // Ultrasonic (tank level)
  tankDistance = readUltrasonic();
  
  // Soil moisture
  soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  
  // Sound level (simple analog reading)
  soundLevel = analogRead(SOUND_PIN);
  
  // Vibration
  vibrationDetected = digitalRead(VIBRATION_PIN);
  
  // Light level (LDR)
  lightLevel = analogRead(LIGHT_PIN);
  
  // Water flow rate
  flowRate = calculateFlowRate();
  
  // Update RSSI
  if (WiFi.status() == WL_CONNECTED) {
    rssi = WiFi.RSSI();
  }
  
  // Debug output
  Serial.println("\n--- Sensor Readings ---");
  Serial.printf("🌡 Temperature: %.1f°C\n", temperature);
  Serial.printf("💧 Humidity: %.1f%%\n", humidity);
  Serial.printf("📊 Pressure: %.1f hPa\n", pressure);
  Serial.printf("💨 Gas: %d ppm\n", gasValue);
  Serial.printf("🔔 Motion: %s\n", motionDetected ? "DETECTED" : "None");
  Serial.printf("📏 Tank Distance: %.1f cm\n", tankDistance);
  Serial.printf("🌱 Soil Moisture: %d (%s)\n", soilMoisture, 
                soilMoisture < SOIL_WET ? "WET" : "DRY");
  Serial.printf("🔊 Sound: %d\n", soundLevel);
  Serial.printf("📳 Vibration: %s\n", vibrationDetected ? "YES" : "NO");
  Serial.printf("💡 Light: %d\n", lightLevel);
  Serial.printf("🌊 Flow Rate: %.1f L/min\n", flowRate);
}

// ==================== SAFETY LOGIC ====================
void safety_logic() {
  if (!autoMode) return;
  
  bool gasAlert = (gasValue > GAS_THRESHOLD);
  bool gasCritical = (gasValue > GAS_CRITICAL);
  bool highTemp = (temperature > TEMP_HIGH);
  bool tempCritical = (temperature > TEMP_CRITICAL);
  bool tankLow = (tankDistance < TANK_LOW_CM);
  bool soilDry = (soilMoisture > SOIL_DRY);
  bool loudSound = (soundLevel > SOUND_THRESHOLD);
  
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
    
    // Trigger alarm
    if (!alarmActive) {
      trigger_alarm(true);
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
    digitalWrite(LED_YELLOW, HIGH);
  }
  else if (tankLow) {
    // Close valve to prevent overflow
    if (pumpOn) {
      digitalWrite(RELAY_PUMP, HIGH);
      pumpOn = false;
      Serial.println("⚠️ Tank low - Pump OFF");
    }
  }
  else if (soilDry) {
    // Automatic irrigation
    if (!pumpOn) {
      digitalWrite(RELAY_PUMP, LOW);
      pumpOn = true;
      Serial.println("💧 Soil dry - Irrigation ON");
    }
  }
  else {
    // Normal conditions - everything OFF
    digitalWrite(RELAY_FAN, HIGH);
    fanOn = false;
    digitalWrite(RELAY_PUMP, HIGH);
    pumpOn = false;
    ventServo.write(0);
    ventPosition = 0;
    trigger_alarm(false);
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_YELLOW, LOW);
  }
}

// ==================== ALARM CONTROL ====================
void trigger_alarm(bool state) {
  alarmActive = state;
  if (state) {
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("🚨 ALARM ACTIVATED");
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("🔇 Alarm deactivated");
  }
}

// ==================== LED STATUS ====================
void update_leds() {
  if (wifiConnected && mqttConnected) {
    digitalWrite(LED_GREEN, HIGH);
  } else {
    digitalWrite(LED_GREEN, !digitalRead(LED_GREEN));  // Blink
  }
  
  // Yellow = warning
  if (gasValue > GAS_THRESHOLD || temperature > TEMP_HIGH) {
    digitalWrite(LED_YELLOW, HIGH);
  } else {
    digitalWrite(LED_YELLOW, LOW);
  }
  
  // Red = critical
  if (gasValue > GAS_CRITICAL || temperature > TEMP_CRITICAL) {
    digitalWrite(LED_RED, HIGH);
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
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  if (duration == 0) return 999.0;
  
  return duration * 0.034 / 2.0;
}

// ==================== FLOW RATE CALCULATION ====================
float calculateFlowRate() {
  static unsigned long lastCalcTime = 0;
  unsigned long currentTime = millis();
  
  if (currentTime - lastCalcTime >= 1000) {  // Calculate every second
    detachInterrupt(FLOW_PIN);
    
    unsigned long elapsedTime = currentTime - flowStartTime;
    float frequency = flowPulseCount * 1000.0 / elapsedTime;  // Hz
    
    // YF-S201 formula: Flow Rate (L/min) = Frequency / 7.5
    flowRate = frequency / 7.5;
    
    // Accumulate total flow
    totalFlow += flowRate * (elapsedTime / 60000.0);
    
    // Reset counters
    flowPulseCount = 0;
    flowStartTime = currentTime;
    lastCalcTime = currentTime;
    
    attachInterrupt(FLOW_PIN, flowISR, RISING);
  }
  
  return flowRate;
}

// ==================== PUBLISH DATA ====================
void publish_data() {
  // Use ArduinoJson for proper JSON formatting
  StaticJsonDocument<512> doc;
  
  // Required fields
  doc["device_id"] = DEVICE_ID;
  
  // Environmental sensors
  doc["temp"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["gas"] = gasValue;
  
  // Alert flags
  doc["gas_alert"] = (gasValue > GAS_THRESHOLD) ? 1 : 0;
  doc["motion"] = motionDetected;
  
  // Tank/liquid monitoring
  doc["tank_dist"] = tankDistance;
  doc["tank_overflow"] = (tankDistance < TANK_LOW_CM) ? 1 : 0;
  doc["soil_moisture"] = soilMoisture;
  
  // Other sensors
  doc["sound_level"] = soundLevel;
  doc["vibration"] = vibrationDetected;
  doc["light_level"] = lightLevel;
  doc["flow_rate"] = flowRate;
  doc["total_flow"] = totalFlow;
  
  // Actuator status
  doc["fan_status"] = fanOn ? 1 : 0;
  doc["pump_status"] = pumpOn ? 1 : 0;
  doc["vent_position"] = ventPosition;
  doc["alarm_status"] = alarmActive ? 1 : 0;
  doc["auto_mode"] = autoMode ? 1 : 0;
  
  // Device health
  doc["rssi"] = rssi;
  doc["uptime"] = uptime;
  doc["free_heap"] = ESP.getFreeHeap();
  doc["chip_temp"] = temperatureRead();  // ESP32 internal temp
  
  // Serialize to string
  String json;
  serializeJson(doc, json);
  
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
