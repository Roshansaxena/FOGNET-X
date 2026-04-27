/*
 * FOGNET-X ESP8266 Factory Node - OPTIMIZED FOR LOW LATENCY
 * ==========================================================
 * Only change: Reduced publish delay from 1000ms to 500ms
 * All other logic remains identical to original code
 */

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Servo.h>

// --- PIN DEFINITIONS ---
#define DHTPIN D3
#define DHTTYPE DHT11
#define PIR_PIN D4
#define TRIG_PIN D7
#define ECHO_PIN D8
#define RELAY_PIN D0
#define SERVO_PIN D1
#define MQ2_PIN A0

// --- CONFIGURATION ---
const char* ssid = "BEYONDER 5430";
const char* password = "tejas143";
const char* mqtt_server = "10.136.75.54"; // Fog node IP

// --- THRESHOLDS ---
const int GAS_THRESHOLD = 400;      // Adjust based on lighter gas demo
const float TANK_OVERFLOW_CM = 5.0; // Distance in cm to trigger "overflow"
const float TANK_MAX_HEIGHT_CM = 10.0; // Total tank height for percentage calculation

// --- PUBLISH INTERVAL (OPTIMIZED) ---
const unsigned long PUBLISH_INTERVAL = 500;  // ⚡ Changed from 1000ms to 500ms (2x faster!)

WiFiClient espClient;
PubSubClient client(espClient);

DHT dht(DHTPIN, DHTTYPE);
Servo ventServo;

// --- STATE VARIABLES ---
bool autoMode = true; // Local safety logic active
unsigned long lastPublishTime = 0;  // Track last publish time

void setup_wifi() {
  delay(10);
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected 🤝 IP: " + WiFi.localIP().toString());
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  String top = String(topic);

  Serial.println("Message arrived [" + top + "]: " + msg);

  // Manual Override: If we receive a command, we can disable or respect it
  if (top == "factory/actuator/fan") {
    if (msg == "ON") digitalWrite(RELAY_PIN, LOW); // Relay Active Low
    else digitalWrite(RELAY_PIN, HIGH);
  }

  if (top == "factory/actuator/vent") {
    if (msg == "OPEN") ventServo.write(90);
    else ventServo.write(0);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP8266_Factory_Node")) {
      Serial.println("Connected to FOGNET-X 🤝");
      client.subscribe("factory/actuator/#");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH);
  if (dur == 0) return 999.0; // Out of range
  return dur * 0.034 / 2;
}

// Calculate tank percentage based on distance
// When flap is UP (close to sensor, small distance) = FULL (100%)
// When flap is DOWN (far from sensor, large distance) = EMPTY (0%)
float calculateTankPercentage(float distance) {
  if (distance >= TANK_MAX_HEIGHT_CM || distance < 0) {
    return 0.0; // Tank empty or invalid reading
  }
  
  // Inverse relationship: closer = more full
  float percentage = ((TANK_MAX_HEIGHT_CM - distance) / TANK_MAX_HEIGHT_CM) * 100.0;
  
  // Constrain between 0-100%
  return constrain(percentage, 0.0, 100.0);
}

void setup() {
  Serial.begin(115200);
  
  pinMode(PIR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Off by default

  ventServo.attach(SERVO_PIN);
  ventServo.write(0); // Closed

  dht.begin();
  setup_wifi();
  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  Serial.println("✨ Setup Complete - Publish Interval: " + String(PUBLISH_INTERVAL) + "ms");
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  unsigned long currentTime = millis();
  
  // Only publish when interval has elapsed
  if (currentTime - lastPublishTime >= PUBLISH_INTERVAL) {
    lastPublishTime = currentTime;
    
    // 1. READ SENSORS
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int gasValue = analogRead(MQ2_PIN);
    int motion = digitalRead(PIR_PIN);
    float tankDistance = readUltrasonic();
    float tankPercentage = calculateTankPercentage(tankDistance);

    // 2. SAFETY LOGIC (LOCAL AUTOMATION)
    bool gasAlert = (gasValue > GAS_THRESHOLD);
    bool tankOverflow = (tankDistance < TANK_OVERFLOW_CM);
    
    if (gasAlert) {
      // Section B: Exhaust Logic
      digitalWrite(RELAY_PIN, LOW); // Start Fan
      ventServo.write(90);          // Open Vent
      Serial.println("⚠️ GAS DETECTED! Fan ON & Vent OPEN");
    }

    // 3. SECURITY LOGIC
    String securityStatus = "SECURE";
    if (motion == HIGH) {
      if (gasAlert) {
        securityStatus = "CRITICAL: HUMAN IN DANGER (GAS+MOTION)";
        Serial.println("🚨 HIGH PRIORITY ALERT: Human detected in gas zone!");
      } else {
        securityStatus = "HUMAN DETECTED";
        Serial.println("👤 Entry Gate: Activity detected");
      }
    }

    // 4. PUBLISH DATA
    String payload = "{";
    payload += "\"temp\":" + String(t) + ",";
    payload += "\"humidity\":" + String(h) + ",";
    payload += "\"gas\":" + String(gasValue) + ",";
    payload += "\"gas_alert\":" + String(gasAlert ? 1 : 0) + ",";
    payload += "\"motion\":" + String(motion) + ",";
    payload += "\"tank_dist\":" + String(tankDistance, 1) + ",";
    payload += "\"tank_overflow\":" + String(tankOverflow ? 1 : 0) + ",";
    payload += "\"tank_percentage\":" + String(tankPercentage, 1) + ",";
    payload += "\"security\":\"" + securityStatus + "\"";
    payload += "}";

    client.publish("factory/sensor/data", payload.c_str());
    client.publish("factory/status/heartbeat", "alive");

    // Debug Console Output
    Serial.print("Temp: "); Serial.print(t);
    Serial.print(" | Gas: "); Serial.print(gasValue);
    Serial.print(" | Tank Distance: "); Serial.print(tankDistance, 1);
    Serial.print(" cm (" + String(tankPercentage, 1) + "%)");
    Serial.println();
  }
  
  yield(); // Allow ESP8266 to handle background tasks
}
